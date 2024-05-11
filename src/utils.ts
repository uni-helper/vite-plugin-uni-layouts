import { readFileSync } from 'node:fs'
import path, { join, relative, resolve } from 'node:path'
import process from 'node:process'
import type { SFCDescriptor } from '@vue/compiler-sfc'
import { parse as VueParser } from '@vue/compiler-sfc'
import { parse as jsonParse } from 'jsonc-parser'
import { normalizePath } from 'vite'
import type { Page, ResolvedOptions, UserOptions } from './types'

export function resolveOptions(userOptions: UserOptions = {}): ResolvedOptions {
  return {
    layout: 'default',
    layoutDir: 'src/layouts',
    pagesJsonPath: 'src/pages.json',
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
  let isSrcMode = false
  if (resolvePath.startsWith(join(cwd, 'src')))
    isSrcMode = true
  const relativePath = relative(join(cwd, isSrcMode ? 'src' : ''), resolvePath)
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
