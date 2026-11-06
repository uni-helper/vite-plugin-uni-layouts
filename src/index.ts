import type { Plugin } from 'vite'
import type { UserOptions } from './types'
import chokidar from 'chokidar'
import { createFilter } from 'vite'
import { virtualModuleId } from './constant'
import { Context } from './context'
import { getPageJsonPath, resolveOptions } from './utils'

export function VitePluginUniLayouts(userOptions: UserOptions = {}): Plugin {
  const options = resolveOptions(userOptions)
  const ctx = new Context(options)
  ctx.pageJsonPath = getPageJsonPath(options.cwd)

  return {
    name: 'vite-plugin-uni-layouts',
    enforce: 'pre',
    configResolved(config) {
      ctx.config = config
      // build watch has no dev server watcher, and a layout added while it runs
      // still changes the declaration and the virtual module
      if (config.build.watch)
        ctx.setupWatcher(chokidar.watch(['src/pages.json', 'pages.json', ctx.layoutDirPath]))
    },
    async buildStart() {
      await ctx.writeDeclarationFile()
    },
    configureServer(server) {
      ctx.setupViteServer(server)
    },
    resolveId(id) {
      if (id === virtualModuleId)
        return id
    },
    load(id) {
      if (id === virtualModuleId)
        return ctx.virtualModule()
    },
    transform(code, id) {
      const filter = createFilter(['src/main.(ts|js)', 'main.(ts|js)'])
      if (filter(id))
        return ctx.importLayoutComponents(code, id)

      return ctx.transform(code, id)
    },
  }
}

export default VitePluginUniLayouts
