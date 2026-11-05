import type { SFCDescriptor } from '@vue/compiler-sfc'
import type { Page, ResolvedOptions, UserOptions } from './types'
import { existsSync, readFileSync } from 'node:fs'
import path, { join, relative, resolve, sep } from 'node:path'
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

  const { pages = [], subPackages = [] } = jsonParse(pagesJsonRaw)

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
