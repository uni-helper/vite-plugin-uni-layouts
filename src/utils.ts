import { existsSync, readFileSync } from 'node:fs'
import path, { join, relative, resolve, sep } from 'node:path'
import process from 'node:process'
import type { SFCDescriptor } from '@vue/compiler-sfc'
import { parse as VueParser } from '@vue/compiler-sfc'
import { parse as jsonParse } from 'jsonc-parser'
import { normalizePath } from 'vite'
import type { ViteDevServer } from 'vite'
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

  const { pages = [], subPackages = [] } = jsonParse(pagesJsonRaw)

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

// 使模块失效并重新加载
export async function invalidateAndReload(filePath: string, server?: ViteDevServer) {
  if (!server) {
    console.error('Vite server not available.')
    return false
  }

  const module = await server.moduleGraph.getModuleByUrl(filePath)

  if (module) {
    // 1. 使模块失效
    // 这会清除模块的 transform 缓存，并标记它需要重新加载
    // 同时也会遍历所有导入它的模块并传递失效状态
    server.moduleGraph.invalidateModule(module)

    // 2. 通知 HMR
    // 告诉浏览器该模块（及其所有依赖它的模块）需要重新加载
    server.reloadModule(module)

    return true
  }
  else {
    console.warn(`[vite-plugin-uni-layouts] ❌ Module not found in module graph: ${filePath}`)
    return false
  }
}
