import { resolve } from 'node:path'
import type { FSWatcher, ResolvedConfig, ViteDevServer } from 'vite'
import { normalizePath } from 'vite'
import MagicString from 'magic-string'
import type { ElementNode } from '@vue/compiler-dom'
import { parse } from '@vue/compiler-dom'
import { kebabCase } from 'scule'
import { walk } from 'estree-walker'
import { scanLayouts } from './scan'
import type { Layout, Page, ResolvedOptions } from './types'
import { getTarget, loadPagesJson } from './utils'

export class Context {
  config!: ResolvedConfig
  options: ResolvedOptions
  pages: Page[]
  layouts: Layout[]
  private _server?: ViteDevServer
  parse?: (input: string, options?: any) => any
  constructor(options: ResolvedOptions) {
    this.options = options
    this.pages = []
    this.layouts = scanLayouts(options.layoutDir, options.cwd)
  }

  setupViteServer(server: ViteDevServer) {
    if (this._server === server)
      return

    this._server = server
    this.setupWatcher(server.watcher)
  }

  async setupWatcher(watcher: FSWatcher) {
    watcher.on('change', async (path) => {
      if (
        normalizePath(path)
        === normalizePath(resolve(this.options.cwd, 'src/pages.json'))
      )
        this.pages = loadPagesJson('src/pages.json', this.options.cwd)
      // TODO: auto reload
    })
  }

  transform(code: string, path: string) {
    if (!this.pages?.length)
      this.pages = loadPagesJson('src/pages.json', this.options.cwd)

    const page = getTarget(
      path,
      this.pages,
      this.options.layout,
      this.config.root,
    )
    if (!page)
      return
    if (!this.layouts.length)
      return
    let layoutName: string | undefined | false = page.layout
    let layout: Layout | undefined

    if (typeof layoutName === 'boolean' && layoutName)
      layoutName = 'default'

    if (typeof layoutName === 'string') {
      if (!layoutName)
        return
      layout = this.layouts.find(l => l.name === (layoutName as string))
      if (!layout)
        return
    }

    const ast = parse(code)
    const ms = new MagicString(code)
    let sourceWithoutRoot = ''
    let props: string[] = []
    let dynamicLayout = ''
    const rootTemplate = ast.children.find(
      node => node.type === 1 && node.tag === 'template',
    ) as ElementNode
    const rootScript = ast.children.find(
      node => node.type === 1 && node.tag === 'script',
    ) as ElementNode
    if (!rootTemplate)
      return

    if (rootScript) {
      const firstContent = rootScript.children?.[0]
      const code = firstContent?.type === 2 && firstContent.content
      if (code && this.parse) {
        const ast = this.parse(code)
        walk(ast, {
          enter(node) {
            if (node.type === 'VariableDeclarator') {
              const hasUniLayoutVar
                = node.id.type === 'Identifier' && node.id.name === 'uniLayout'
              const isRef
                = node.init?.type === 'CallExpression'
                && node.init.callee.type === 'Identifier'
                && node.init.callee.name === 'ref'
              if (hasUniLayoutVar && isRef)
                props.push('ref="uniLayout"')
            }
          },
        })
      }
    }

    const isDisabledLayout = typeof layoutName === 'boolean' && !layoutName
    if (isDisabledLayout) {
      const uniLayoutComponent = rootTemplate.children.find(
        node => node.type === 1 && kebabCase(node.tag) === 'uni-layout',
      ) as ElementNode

      if (uniLayoutComponent) {
        props = uniLayoutComponent.props.map(v => v.loc.source)
        for (const prop of uniLayoutComponent.props) {
          if (
            prop.name === 'bind'
            && prop.type === 7
            && prop?.exp?.type === 4
            && prop.arg?.type === 4
            && prop.arg?.content === 'name'
          )
            dynamicLayout = prop.exp.content

          if (prop.name === 'name' && prop.type === 6) {
            layoutName = prop.value?.content
            // not set layout
            if (!layoutName)
              return
            layout = this.layouts.find(
              l => l.name === (layoutName as string),
            )
            if (!layout)
              return
          }
        }
        sourceWithoutRoot += uniLayoutComponent.children
          .map(v => v.loc.source)
          .join('\n')
      }
      else {
        return
      }
    }
    else {
      sourceWithoutRoot += rootTemplate.children
        .map(v => v.loc.source)
        .join('')
    }
    ms.replace(rootTemplate.loc.source, '')
    if (dynamicLayout) {
      ms.prepend(`<template>
  <component ${props.join(' ')} :is='\`layout-\${${dynamicLayout}}-uni\`'>
    ${sourceWithoutRoot}
  </component>
</template>
`)
    }
    else {
      ms.prepend(`<template>
  <layout-${layout?.kebabName}-uni ${props.join(' ')}>
    ${sourceWithoutRoot}
  </layout-${layout?.kebabName}-uni>
</template>
`)
    }
    const map = ms.generateMap({
      source: path,
      file: `${path}.map`,
      includeContent: true,
    })
    return {
      code: ms.toString(),
      map,
    }
  }

  async virtualModule() {
    const imports: string[] = []
    const components: string[] = []
    const _exports = this.layouts.map((v) => {
      imports.push(
        `import Layout_${v.pascalName}_Uni from "${normalizePath(v.path)}"`,
      )
      components.push(
        `app.component("layout-${v.kebabName}-uni", Layout_${v.pascalName}_Uni)`,
      )
      return `Layout_${v.pascalName}_Uni,`
    })
    return `${imports.join('\n')}
export const layouts = {
  ${_exports.join('\n')}
}
export default {
  install(app) {
    ${components.join('\n')}
  }
}`
  }

  async importLayoutComponents(code: string, id: string) {
    const ms = new MagicString(code)
    const imports: string[] = []
    const components: string[] = []
    for (const v of this.layouts) {
      imports.push(
        `import Layout_${v.pascalName}_Uni from "${normalizePath(v.path)}"`,
      )
      components.push(
        `app.component("layout-${v.kebabName}-uni", Layout_${v.pascalName}_Uni);\n`,
      )
    }
    ms.append(imports.join('\n'))
    ms.replace(
      /(createApp[\s\S]*?)(return\s{\s*app)/,
      `$1${components.join('')}$2`,
    )
    const map = ms.generateMap({
      source: id,
      file: `${id}.map`,
      includeContent: true,
    })
    code = ms.toString()
    return {
      code,
      map,
    }
  }
}
