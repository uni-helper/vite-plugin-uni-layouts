import type { FSWatcher } from 'chokidar'
import type { ViteDevServer } from 'vite'
import { resolve } from 'node:path'
import process from 'node:process'
import { expect, it } from 'vitest'
import { Context } from '../src/context'
import { resolveOptions } from '../src/utils'

const cwd = resolve(__dirname, 'fixtures')
const pagesJson = resolve(cwd, 'src/pages.json')

type Handler = (path: string) => Promise<void>

/**
 * Stand-in for the Vite dev server: records the modules the plugin asks to
 * reload, and knows `.vue` modules only, the way a running server sees the
 * pages that were actually requested.
 */
function createServer() {
  const handlers: Record<string, Handler> = {}
  const reloaded: string[] = []

  const server = {
    watcher: {
      on: (event: string, handler: Handler) => {
        handlers[event] = handler
      },
    },
    moduleGraph: {
      getModuleByUrl: async (url: string) => (url.endsWith('.vue')
        ? { url }
        : undefined),
      getModuleById: () => undefined,
      invalidateModule: (module: { url: string }) => reloaded.push(module.url),
    },
    reloadModule: async () => {},
  }

  return {
    server: server as unknown as ViteDevServer,
    handlers,
    reloaded,
  }
}

function createWatcher() {
  const handlers: Record<string, Handler> = {}
  const watcher = {
    on: (event: string, handler: Handler) => {
      handlers[event] = handler
    },
  }
  return { watcher: watcher as unknown as FSWatcher, handlers }
}

function createContext() {
  return new Context(resolveOptions({ cwd }))
}

it('reloads pages.json without a dev server', async () => {
  const ctx = createContext()
  const { watcher, handlers } = createWatcher()
  await ctx.setupWatcher(watcher)

  await expect(handlers.change(pagesJson)).resolves.toBeUndefined()
  expect(ctx.pages.map(page => page.path)).toEqual([
    'pages/index/index',
    'pages/index/test',
    'pages/index/disabled',
  ])
})

it('reloads only the pages whose layout changed', async () => {
  const ctx = createContext()
  const { server, handlers, reloaded } = createServer()
  ctx.setupViteServer(server)
  // the app was opened while pages/index/index still used another layout
  ctx.pages = [
    { path: 'pages/index/index', layout: 'kebabLayout' },
  ]

  await handlers.change(pagesJson)

  expect(reloaded).toEqual(['/src/pages/index/index.vue'])
})

// chokidar reports native paths, and only windows reports them with `\`
it.runIf(process.platform === 'win32')('matches pages.json when the path uses windows separators', async () => {
  const ctx = createContext()
  const { server, handlers, reloaded } = createServer()
  ctx.setupViteServer(server)
  ctx.pages = [
    { path: 'pages/index/index', layout: 'kebabLayout' },
  ]

  await handlers.change('C:\\project\\src\\pages.json')

  expect(reloaded).toEqual(['/src/pages/index/index.vue'])
})

it('invalidates the open pages when a layout appears', async () => {
  const ctx = createContext()
  await ctx.transform('<template><view /></template>', resolve(cwd, 'src/pages/index/index.vue'))
  const { server, handlers, reloaded } = createServer()
  ctx.setupViteServer(server)

  await handlers.add(resolve(cwd, 'src/layouts/extra.vue'))

  expect(reloaded).toEqual([
    '/src/pages/index/index.vue',
    '/src/pages/index/test.vue',
    '/src/pages/index/disabled.vue',
  ])
})

it('ignores files outside the layouts directory', async () => {
  const ctx = createContext()
  await ctx.transform('<template><view /></template>', resolve(cwd, 'src/pages/index/index.vue'))
  const { server, handlers, reloaded } = createServer()
  ctx.setupViteServer(server)

  await handlers.add(resolve(cwd, 'src/pages/index/index.vue'))

  expect(reloaded).toEqual([])
})
