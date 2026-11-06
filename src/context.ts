import type { AttributeNode, DirectiveNode, ElementNode, SimpleExpressionNode } from '@vue/compiler-core'
import type { FSWatcher } from 'chokidar'
import type { ResolvedConfig, ViteDevServer } from 'vite'
import type { Layout, Page, ResolvedOptions } from './types'
import { resolve } from 'node:path'
import { isMp } from '@uni-helper/uni-env'
import MagicString from 'magic-string'
import { kebabCase } from 'scule'
import { normalizePath } from 'vite'
import { runtimeModuleCode, virtualModuleId } from './constant'
import { scanLayouts } from './scan'
import { findLayoutRefName, getPagesWithChangedLayout, getSourceUrl, getTarget, invalidateAndReload, isLayoutFile, loadPagesJson, parseSFC } from './utils'

export class Context {
  config!: ResolvedConfig
  options: ResolvedOptions
  pages: Page[]
  /**
   * layouts 列表
   */
  layouts: Layout[]
  pageJsonPath: string
  /**
   * layouts 目录路径
   */
  layoutDirPath: string
  private _server?: ViteDevServer
  /** the "no layouts" warning is global, so it must not repeat per page */
  private warnedNoLayouts = false
  constructor(options: ResolvedOptions) {
    this.options = options
    this.pages = []
    this.layoutDirPath = resolve(options.cwd, options.layoutDir)
    this.layouts = scanLayouts(this.layoutDirPath)
    this.pageJsonPath = 'src/pages.json'
  }

  setupViteServer(server: ViteDevServer): void {
    if (this._server === server)
      return

    this._server = server
    this.setupWatcher(server.watcher)
  }

  async setupWatcher(watcher: FSWatcher): Promise<void> {
    watcher.on('change', async (path) => {
      // chokidar reports native paths, and Windows uses `\`
      if (!normalizePath(path).endsWith(this.pageJsonPath))
        return

      const prePages = this.pages
      this.reloadPages()

      const server = this._server
      if (!server)
        return

      // the wrapper a page gets comes from its `layout`, so only pages whose
      // layout changed need to be transformed again
      for (const page of getPagesWithChangedLayout(this.pages, prePages))
        await this.reloadPage(page, server)
    })

    watcher.on('add', async (path) => {
      if (!isLayoutFile(path, this.layoutDirPath))
        return
      await this.reloadLayouts()
    })

    watcher.on('unlink', async (path) => {
      if (!isLayoutFile(path, this.layoutDirPath))
        return
      await this.reloadLayouts()
    })
  }

  /**
   * Read pages.json again. An in-flight save can leave the file empty for a
   * moment, and a throw inside a watcher listener takes the whole dev server
   * down, so a failed read keeps the last good page list.
   */
  reloadPages(): void {
    try {
      this.pages = loadPagesJson(this.pageJsonPath, this.options.cwd)
    }
    catch (error) {
      // the reason goes into the message: a dev-server console wrapper can drop
      // extra arguments and print an object as `{}`
      console.warn(`[vite-plugin-uni-layouts] failed to read ${this.pageJsonPath}, keeping the previous page list: ${String(error)}`)
    }
  }

  /** Invalidate both possible sources of a page: `.vue` and `.nvue`. */
  async reloadPage(page: Page, server: ViteDevServer): Promise<void> {
    for (const ext of ['.vue', '.nvue'])
      await invalidateAndReload(getSourceUrl(this.pageJsonPath, `${page.path}${ext}`), server)
  }

  /**
   * A wrong `layoutDir` or an empty directory leaves every page unwrapped.
   * The condition is global, so warn once per scan instead of once per page.
   */
  private warnNoLayouts(): void {
    if (this.layouts.length || this.warnedNoLayouts)
      return
    this.warnedNoLayouts = true
    console.warn(`[vite-plugin-uni-layouts] no layout found in "${this.layoutDirPath}", pages render without layouts`)
  }

  /** Rescan the layouts directory and reload every module that imports a layout. */
  async reloadLayouts(): Promise<void> {
    this.layouts = scanLayouts(this.layoutDirPath)
    // the directory changed, so the next transform has to report a still empty
    // one again
    this.warnedNoLayouts = false
    this.warnNoLayouts()

    const server = this._server
    if (!server)
      return

    // layouts reach the app through the virtual module or through the main file,
    // and both lists are generated from this.layouts
    const virtualModule = server.moduleGraph.getModuleById(virtualModuleId)
    if (virtualModule) {
      server.moduleGraph.invalidateModule(virtualModule)
      await server.reloadModule(virtualModule)
    }

    for (const ext of ['.ts', '.js'])
      await invalidateAndReload(getSourceUrl(this.pageJsonPath, `main${ext}`), server)

    // an open page keeps the wrapper from the layout list it was transformed
    // with, so it needs the page modules again; `transform` also bails out while
    // no layout exists, which leaves the page list empty even with pages open
    if (!this.pages.length)
      this.reloadPages()
    for (const page of this.pages)
      await this.reloadPage(page, server)
  }

  async transform(code: string, path: string): Promise<{
    code: string
    map: string
  } | undefined> {
    // no layouts
    if (!this.layouts.length) {
      this.warnNoLayouts()
      return
    }
    // no pages
    if (!this.pages?.length)
      this.pages = loadPagesJson(this.pageJsonPath, this.options.cwd)

    const page = getTarget(
      path,
      this.pages,
      this.options.layout,
      this.config?.root || this.options.cwd,
    )

    // is not page
    if (!page)
      return

    let pageLayoutName: string | undefined | false = page.layout
    let pageLayout: Layout | undefined

    if (typeof pageLayoutName === 'boolean' && pageLayoutName)
      pageLayoutName = 'default'

    if (typeof pageLayoutName === 'string') {
      // layout name is empty
      if (!pageLayoutName)
        return
      pageLayout = this.layouts.find(l => l.name === (pageLayoutName as string))
      // a missing layout leaves the page unwrapped, which is silent otherwise
      if (!pageLayout) {
        // the name equals the `layout` option when the page has no layout of
        // its own, and that is worth saying: the fix is adding the layout file
        // or setting the option, not changing this page
        const fallback = pageLayoutName === this.options.layout
        console.warn(
          fallback
            ? `[vite-plugin-uni-layouts] page "${page.path}" uses the default layout "${pageLayoutName}", which does not exist, rendering the page without a layout`
            : `[vite-plugin-uni-layouts] layout "${pageLayoutName}" of page "${page.path}" does not exist, rendering the page without a layout`,
        )
        return
      }
    }
    const disabled = typeof pageLayoutName === 'boolean' && !pageLayoutName

    const sfc = await parseSFC(code)
    const ms = new MagicString(code)
    const setupCode = sfc.scriptSetup?.loc.source
    // the page reads the layout instance through this ref, so the wrapper needs
    // to carry it; the mini program resolves the name against setup bindings
    const layoutRefName = setupCode
      ? findLayoutRefName(setupCode, sfc.scriptSetup?.lang)
      : undefined
    const layoutRefProp = layoutRefName
      ? `ref="${layoutRefName}"`
      : ''

    if (disabled) {
      // find dynamic layout
      const uniLayoutNode = sfc.template?.ast?.children.find(v => v.type === 1 && kebabCase(v.tag) === 'uni-layout') as ElementNode
      // not found
      if (!uniLayoutNode)
        return

      ms.overwrite(uniLayoutNode.loc.start.offset, uniLayoutNode.loc.end.offset, this.generateDynamicLayout(uniLayoutNode, layoutRefProp))
    }
    else {
      if (sfc.template?.loc.start.offset && sfc.template?.loc.end.offset) {
        // `<page-meta>` only takes effect as the first node of a page, so render
        // it before the layout wrapper instead of inside it. Only top-level
        // nodes are hoisted; a nested one cannot work either way
        // exact tag only: `<PageMeta>` would be a user component, not the built-in
        const pageMetaNodes = (sfc.template.ast?.children ?? []).filter(
          v => v.type === 1 && v.tag === 'page-meta',
        ) as ElementNode[]
        const pageMetas = pageMetaNodes.map(v => v.loc.source).join('\n')
        const templateStart = sfc.template.loc.start.offset
        let pageContent = sfc.template.content
        // drop the page-meta nodes from the page content, walking from the end
        // so the offsets of the earlier nodes stay valid
        for (const node of [...pageMetaNodes].reverse()) {
          pageContent = pageContent.slice(0, node.loc.start.offset - templateStart)
            + pageContent.slice(node.loc.end.offset - templateStart)
        }

        const before = pageMetas
          ? `${pageMetas}\n`
          : ''
        ms.overwrite(templateStart, sfc.template.loc.end.offset, `\n${before}<layout-${pageLayout?.kebabName}-uni ${layoutRefProp}>${pageContent}</layout-${pageLayout?.kebabName}-uni>\n`)
      }
    }

    if (ms.hasChanged()) {
      const map = ms.generateMap({
        source: path,
        file: `${path}.map`,
        includeContent: true,
      })
      return {
        code: ms.toString(),
        // magic-string's SourceMap class does not satisfy vite's map type, so
        // pass it as the JSON string vite accepts
        map: map.toString(),
      }
    }
  }

  async virtualModule(): Promise<string> {
    const imports: string[] = ['import { shallowRef } from \'vue\'']
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
${runtimeModuleCode}export default {
  install(app) {
    ${components.join('\n')}
  }
}`
  }

  generateDynamicLayout(node: ElementNode, layoutRefProp = ''): string {
    const staticLayoutNameBind = node.props.find(
      v => v.type === 6 && v.name === 'name' && v.value?.content,
    ) as AttributeNode
    const dynamicLayoutNameBind = node.props.find(
      v => v.type === 7 && v.name === 'bind' && v.arg?.type === 4 && v.arg?.content === 'name' && v.exp?.type === 4 && v.exp.content,
    ) as DirectiveNode
    const slotsSource = node.children.map(v => v.loc.source).join('\n')
    const nodeProps = node.props.filter(prop => !(prop === dynamicLayoutNameBind || prop === staticLayoutNameBind)).map(v => v.loc.source)

    if (!(staticLayoutNameBind || dynamicLayoutNameBind))
      console.warn('[vite-plugin-uni-layouts] Dynamic layout not found name bind')

    // the page side ref lands on the tag that actually renders; the other
    // branches of the mini program chain are never mounted. A ref written on
    // `<uni-layout>` itself wins, so the page keeps its own access
    const hasOwnRef = node.props.some(prop => (prop.type === 6 && prop.name === 'ref')
      || (prop.type === 7 && prop.name === 'bind' && prop.arg?.type === 4 && prop.arg.content === 'ref'))
    const refProp = hasOwnRef ? '' : layoutRefProp

    if (isMp) {
      const props: string[] = [...nodeProps]
      if (refProp)
        props.push(refProp)
      if (staticLayoutNameBind) {
        const layout = staticLayoutNameBind.value?.content
        return `<layout-${layout}-uni ${props.join(' ')}>${slotsSource}</layout-${layout}-uni>`
      }

      const bind = (dynamicLayoutNameBind.exp as SimpleExpressionNode).content
      const defaultSlot = node.children.filter((v) => {
        if (v.type === 1 && v.tagType === 3) {
          const slot = v.props.find(v => v.type === 7 && v.name === 'slot' && v.arg?.type === 4) as any
          if (slot)
            return slot.arg.content === 'default'
        }
        return v
      })
      const defaultSlotSource = defaultSlot.map(v => v.loc.source).join('\n')
      const layouts = this.layouts.map((layout, index) => {
        const directive = index === 0
          ? 'if'
          : 'else-if'
        return `<layout-${layout.kebabName}-uni v-${directive}="${bind} ==='${layout.kebabName}'" ${props.join(' ')}>${slotsSource}</layout-${layout.kebabName}-uni>`
      })
      layouts.push(`<template v-else>${defaultSlotSource}</template>`)

      return layouts.join('\n')
    }
    else {
      const props: string[] = [...nodeProps]
      if (refProp)
        props.push(refProp)
      if (staticLayoutNameBind)
        props.push(`is="layout-${staticLayoutNameBind.value?.content}-uni"`)
      else
        props.push(`:is="\`layout-\${${(dynamicLayoutNameBind.exp as SimpleExpressionNode).content}}-uni\`"`)
      return `<component ${props.join(' ')}>${slotsSource}</component>`
    }
  }

  async importLayoutComponents(code: string, id: string): Promise<{
    code: string
    map: string
  }> {
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
      /(createApp[\s\S]*?)(return\s\{\s*app)/,
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
      map: map.toString(),
    }
  }
}
