import type { Plugin } from 'vite'
import type { UserOptions } from './types'
import chokidar from 'chokidar'
import { createFilter } from 'vite'
import { virtualModuleId } from './constant'
import { Context } from './context'
import { writeDeclaration } from './declaration'
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
      if (config.build.watch)
        ctx.setupWatcher(chokidar.watch(['src/pages.json', 'pages.json']))
    },
    async buildStart() {
      if (!options.dts)
        return
      try {
        await writeDeclaration(options.dts)
      }
      catch (error) {
        // the declaration only feeds editor types, so a failure must not stop
        // the build; the path is in the message to make it actionable
        console.warn(`[vite-plugin-uni-layouts] failed to write ${options.dts}: ${String(error)}`)
      }
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
