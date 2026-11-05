import type { SFCDescriptor } from '@vue/compiler-sfc'
import type { ViteDevServer } from 'vite'
import type { Page, ResolvedOptions, UserOptions } from './types'
import { existsSync, readFileSync } from 'node:fs'
import path, { dirname, join, relative, resolve, sep } from 'node:path'
import process from 'node:process'
import { parse as VueParser } from '@vue/compiler-sfc'
import { parse as jsonParse } from 'jsonc-parser'
import { normalizePath } from 'vite'

function slash(str: string): string {
  return str.replace(/\\|\//g, sep)
}

export function getPageJsonPath(cwd = process.cwd()): 'src/pages.json' | 'pages.json' {
  return existsSync(normalizePath(join(cwd, 'src')))
    ? 'src/pages.json'
    : 'pages.json'
}

export function resolveOptions(userOptions: UserOptions = {}): ResolvedOptions {
  return {
    layout: 'default',
    layoutDir: 'src/layouts',
    cwd: process.cwd(),
    ...userOptions,
  }
}

export function loadPagesJson(path = 'src/pages.json', cwd = process.cwd()): Page[] {
  const pagesJsonRaw = readFileSync(resolve(cwd, path), {
    encoding: 'utf-8',
  })

  const { pages = [], subPackages = [] } = parsePagesJson(pagesJsonRaw, process.env.UNI_PLATFORM || '')

  return [
    ...pages,
    // 分包页面的 path 相对分包目录，拼上 root 才是相对 src 的页面路径
    ...subPackages
      .map(({ pages = [], root = '' }: { pages?: Page[], root?: string }) => {
        return pages.map(page => ({
          ...page,
          path: normalizePath(join(root, page.path)),
        }))
      })
      .flat(),
  ]
}

/**
 * parsePagesJson
 * The `parsePagesJson` exported by `@dcloudio/uni-cli-shared` does not support parsing `subPackage` in the miniProgram environment.
 * Therefore, a custom parsePagesJson implementation is provided here.
 * @param content The content of the pages.json file.
 * @param platform The platform to target.
 * @returns The parsed pages.json object.
 */
export function parsePagesJson(content: string, platform: string): Record<string, any> {
  return jsonParse(preprocess(content, platform))
}

function getPlatformContext(platform: string): Record<string, boolean> {
  const ctx: Record<string, boolean> = {
    VUE3: true,
  }
  const p = platform.toUpperCase()
  if (p) {
    ctx[p] = true
    // uni accepts "mp-weixin" and "mp_weixin" as the same platform
    ctx[p.replace(/-/g, '_')] = true
    if (p.startsWith('APP-'))
      ctx.APP = true

    if (p.startsWith('MP-'))
      ctx.MP = true

    if (p === 'H5' || p === 'WEB') {
      ctx.H5 = true
      ctx.WEB = true
    }
  }
  return ctx
}

function evaluate(condition: string, context: Record<string, boolean>): boolean {
  const code = condition.replace(/[\w$-]+/g, (match) => {
    if (match === 'true' || match === 'false')
      return match
    return context[match] ? 'true' : 'false'
  })
  try {
    // eslint-disable-next-line no-new-func
    return new Function(`return !!(${code})`)()
  }
  catch {
    return false
  }
}

function preprocess(content: string, platform: string): string {
  const context = getPlatformContext(platform)
  const lines = content.split('\n')
  const result: string[] = []
  const stack: boolean[] = []

  const shouldInclude = (): boolean => stack.every(v => v)

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('//')) {
      const comment = trimmed.substring(2).trim()
      if (comment.startsWith('#ifdef')) {
        stack.push(evaluate(comment.substring(6).trim(), context))
        result.push('')
        continue
      }
      if (comment.startsWith('#ifndef')) {
        stack.push(!evaluate(comment.substring(7).trim(), context))
        result.push('')
        continue
      }
      if (comment.startsWith('#else')) {
        // a block holds at most one #else (uni has no #elif), so flipping the
        // innermost entry turns the group into a 2-way switch
        stack[stack.length - 1] = !stack[stack.length - 1]
        result.push('')
        continue
      }
      if (comment.startsWith('#endif')) {
        stack.pop()
        result.push('')
        continue
      }
    }

    if (shouldInclude())
      result.push(line)
    else
      result.push('')
  }

  if (stack.length) {
    console.warn(
      '[vite-plugin-uni-layouts] unbalanced #ifdef/#ifndef in pages.json, the pages after it are ignored',
    )
  }
  return result.join('\n')
}

export function getTarget(
  resolvePath: string,
  pages: Page[] = [],
  layout = 'default',
  cwd = process.cwd(),
): false | Required<Page> {
  if (!(resolvePath.endsWith('.vue') || resolvePath.endsWith('.nvue')))
    return false

  const hasSrcDir = slash(resolvePath).includes(join(cwd, 'src'))

  const relativePath = relative(join(cwd, hasSrcDir ? 'src' : ''), resolvePath)
  const fileWithoutExt = path.basename(
    relativePath,
    path.extname(relativePath),
  )
  const pathWithoutExt = normalizePath(
    path.join(path.dirname(relativePath), fileWithoutExt),
  )

  const page = pages.find(p => normalizePath(p.path) === pathWithoutExt)
  if (page) {
    return {
      layout,
      ...page,
    } as Required<Page>
  }
  return false
}

export async function parseSFC(code: string): Promise<SFCDescriptor> {
  try {
    return (
      VueParser(code, {
        pad: 'space',
      }).descriptor
      // for @vue/compiler-sfc ^2.7
      || (VueParser as any)({
        source: code,
      })
    )
  }
  catch {
    throw new Error(
      '[vite-plugin-uni-layouts] Vue3\'s "@vue/compiler-sfc" is required.',
    )
  }
}

/**
 * Drop a module from the dev server graph and push the reload to the browser.
 * A file that was never requested is not in the graph; nothing to do then.
 */
export async function invalidateAndReload(filePath: string, server: ViteDevServer): Promise<void> {
  const module = await server.moduleGraph.getModuleByUrl(filePath)
  if (!module)
    return

  server.moduleGraph.invalidateModule(module)
  await server.reloadModule(module)
}

/** Whether a watcher path is a `.vue` file inside the layouts directory. */
export function isLayoutFile(filePath: string, layoutDirPath: string): boolean {
  const normalizedPath = normalizePath(filePath)
  // `scanLayouts` only picks up `.vue`, so other extensions are not layouts
  if (!normalizedPath.endsWith('.vue'))
    return false

  // the separator keeps a sibling like `src/layouts-old/x.vue` out
  return normalizedPath.startsWith(`${normalizePath(layoutDirPath)}/`)
}

/**
 * Pages whose `layout` differs from the previous pages.json read.
 * Pages are matched by `path`, so reordering pages.json is not a change.
 */
export function getPagesWithChangedLayout(pages: Page[], prePages: Page[]): Page[] {
  const preByPath = new Map(prePages.map(page => [
    normalizePath(page.path),
    page,
  ]))
  return pages.filter((page) => {
    const pre = preByPath.get(normalizePath(page.path))
    return !!pre && pre.layout !== page.layout
  })
}

/**
 * Dev server URL of a source file that sits next to pages.json, e.g.
 * `/src/pages/index/index.vue` or `/pages/index/index.vue` in a project without
 * a `src` directory. Page paths in pages.json are relative to pages.json itself.
 */
export function getSourceUrl(pageJsonPath: string, relativePath: string): string {
  return normalizePath(join('/', dirname(pageJsonPath), relativePath))
}
