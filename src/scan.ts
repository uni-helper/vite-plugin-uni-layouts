import { basename, dirname, extname, join, relative } from 'node:path'
import fg from 'fast-glob'
import { camelCase, kebabCase, pascalCase, splitByCase } from 'scule'
import { normalizePath } from 'vite'
import type { Layout } from './types'

export function scanLayouts(dir: string) {
  const files = fg.sync('**/*.vue', {
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
    )
      componentNameParts.push(dirNameParts.shift()!)

    const pascalName
      = pascalCase(componentNameParts) + pascalCase(fileNameParts)
    const camelName = camelCase(pascalName)
    const kebabName = kebabCase(pascalName)
    layouts.push({
      name: camelName,
      path: filePath,
      pascalName,
      kebabName,
    })
  }
  return layouts
}
