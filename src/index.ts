import type { Plugin } from 'vite'
import { createFilter } from 'vite'
import chokidar from 'chokidar'
import { virtualModuleId } from './constant'
import { Context } from './context'
import type { UserOptions } from './types'
import { resolveOptions } from './utils'

export function VitePluginUniLayouts(userOptions: UserOptions = {}): Plugin {
  const options = resolveOptions(userOptions)
  const ctx = new Context(options)
  return {
    name: 'vite-plugin-uni-layouts',
    enforce: 'pre',
    configResolved(config) {
      ctx.config = config
      if (config.build.watch)
        ctx.setupWatcher(chokidar.watch(['src/pages.json', 'pages.json']))
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
      const filter = createFilter('src/main.(ts|js)')
      if (filter(id))
        return ctx.importLayoutComponents(code, id)

      return ctx.transform(code, id)
    },
  }
}

export default VitePluginUniLayouts
