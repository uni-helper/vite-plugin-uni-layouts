import { existsSync, readFileSync } from 'node:fs'
import path, { join, relative, resolve, sep } from 'node:path'
import process from 'node:process'
import type { SFCDescriptor } from '@vue/compiler-sfc'
import { parse as VueParser } from '@vue/compiler-sfc'
import { parse as jsonParse } from 'jsonc-parser'
import { normalizePath } from 'vite'
import type { Page, ResolvedOptions, UserOptions } from './types'

function slash(str: string) {
  return str.replace(/\\|\//g, sep)
}

export function getPageJsonPath(cwd = process.cwd()) {
  return existsSync(normalizePath(join(cwd, 'src'))) ? 'src/pages.json' : 'pages.json'
}

export function resolveOptions(userOptions: UserOptions = {}): ResolvedOptions {
  return {
    layout: 'default',
    layoutDir: 'src/layouts',
    cwd: process.cwd(),
    ...userOptions,
  }
}

export function loadPagesJson(path = 'src/pages.json', cwd = process.cwd()) {
  const pagesJsonRaw = readFileSync(resolve(cwd, path), {
    encoding: 'utf-8',
  })

  const { pages = [], subPackages = [] } = parsePagesJson(pagesJsonRaw, process.env.UNI_PLATFORM || '')

  return [
    ...pages,
    ...subPackages
      .map(({ pages = {}, root = '' }: any) => {
        return pages.map((page: any) => ({
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
export function parsePagesJson(content: string, platform: string) {
  try {
    const preprocessed = preprocess(content, platform)
    return jsonParse(preprocessed)
  }
  catch {
    return {}
  }
}

function getPlatformContext(platform: string): Record<string, boolean> {
  const ctx: Record<string, boolean> = {
    VUE3: true,
  }
  const p = platform.toUpperCase()
  if (p) {
    ctx[p] = true
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
  const code = condition.replace(/[a-zA-Z0-9_$-]+/g, (match) => {
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

function preprocess(content: string, platform: string) {
  const context = getPlatformContext(platform)
  const lines = content.split('\n')
  const result: string[] = []
  const stack: boolean[] = []

  const shouldInclude = () => stack.every(v => v)

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
  return result.join('\n')
}

export function getTarget(
  resolvePath: string,
  pages: Page[] = [],
  layout = 'default',
  cwd = process.cwd(),
) {
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
