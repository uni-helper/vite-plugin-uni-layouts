import { resolve } from 'node:path'
import ts from 'typescript'
import { expect, it, vi } from 'vitest'
import { Context } from '../src/context'
import { resolveOptions } from '../src/utils'

const cwd = resolve(__dirname, 'fixtures')

function createContext(): Context {
  return new Context(resolveOptions({ cwd }))
}

it('keeps the main file valid when it does not end with a newline', async () => {
  const result = await createContext().importLayoutComponents(
    'const app = createApp(App)\nreturn { app }',
    `${cwd}/src/main.ts`,
  )

  expect(result).toBeDefined()
  const { diagnostics } = ts.transpileModule(result!.code, { reportDiagnostics: true })
  expect(diagnostics ?? []).toHaveLength(0)
})

it('registers the layout under both names', async () => {
  const result = await createContext().importLayoutComponents(
    'const app = createApp(App)\nreturn { app }',
    `${cwd}/src/main.ts`,
  )

  expect(result!.code).toContain('app.component("layout-camel-layout-uni", Layout_CamelLayout_Uni)')
  expect(result!.code).toContain('app.component("layout-camelLayout-uni", Layout_CamelLayout_Uni)')
})

it('warns and changes nothing without the injection point', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

  const result = await createContext().importLayoutComponents(
    'export default { app }',
    `${cwd}/src/main.ts`,
  )

  expect(result).toBeUndefined()
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('cannot find'))
  warn.mockRestore()
})

it('keeps a replacement pattern in a layout name literal', async () => {
  const ctx = createContext()
  // `$1` would be read as a capture group in a string replacement
  ctx.layouts = [
    {
      name: 'a$1',
      path: '/project/src/layouts/a$1.vue',
      pascalName: 'A$1',
      kebabName: 'a$1',
    },
  ]

  const result = await ctx.importLayoutComponents(
    'const app = createApp(App)\nreturn { app }',
    `${cwd}/src/main.ts`,
  )

  expect(result!.code).toContain('app.component("layout-a$1-uni", Layout_A$1_Uni)')
})
