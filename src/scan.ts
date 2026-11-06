import type { Layout } from './types'
import { basename, dirname, extname, join, relative, resolve } from 'node:path'
import process from 'node:process'
import { camelCase, kebabCase, pascalCase, splitByCase } from 'scule'
import { globSync } from 'tinyglobby'
import { normalizePath } from 'vite'

/**
 * Names derived from a file name end up in generated code: `Layout_<Pascal>_Uni`
 * as an identifier and `layout-<kebab>-uni` as a tag. A quote or a backslash in
 * the file name breaks both, so such a file is skipped with a warning instead of
 * producing code that cannot compile.
 */
const VALID_NAME = /^[\p{L}\p{N}_$]+$/u

export function scanLayouts(dir = 'src/layouts', cwd = process.cwd()): Layout[] {
  dir = resolve(cwd, dir)
  const files = globSync('**/*.vue', {
    onlyFiles: true,
    ignore: ['node_modules', '.git', '**/__*__/*'],
    cwd: dir,
  })
  files.sort()

  const layouts: Layout[] = []

  for (const file of files) {
    const filePath = normalizePath(join(dir, file))
    const dirNameParts = splitByCase(
      normalizePath(relative(dir, dirname(filePath))),
    )
    let fileName = basename(filePath, extname(filePath))
    if (fileName.toLowerCase() === 'index')
      fileName = basename(dirname(filePath))

    const fileNameParts = splitByCase(fileName)
    const componentNameParts: string[] = []

    while (
      dirNameParts.length
      && (dirNameParts[0] || '').toLowerCase()
      !== (fileNameParts[0] || '').toLowerCase()
    ) {
      componentNameParts.push(dirNameParts.shift()!)
    }

    const pascalName
      = pascalCase(componentNameParts) + pascalCase(fileNameParts)
    const camelName = camelCase(pascalName)
    const kebabName = kebabCase(pascalName)
    if (!VALID_NAME.test(pascalName)) {
      console.warn(`[vite-plugin-uni-layouts] "${filePath}" derives the layout name "${camelName}", which cannot be used in generated code, skipping it`)
      continue
    }
    layouts.push({
      name: camelName,
      path: filePath,
      pascalName,
      kebabName,
    })
  }
  return layouts
}
