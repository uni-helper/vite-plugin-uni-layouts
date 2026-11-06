import type { Layout } from '../src/types'
import { join } from 'node:path'
import { expect, it, vi } from 'vitest'
import { Context } from '../src/context'
import { writeDeclaration } from '../src/declaration'
import { resolveOptions } from '../src/utils'

// the real writer goes to disk; here only the order of the calls matters
vi.mock('../src/declaration', () => ({
  writeDeclaration: vi.fn(),
}))

function layout(name: string): Layout {
  return {
    name,
    path: `/layouts/${name}.vue`,
    pascalName: name,
    kebabName: name,
  }
}

it('starts a second declaration write only after the first one finished', async () => {
  const ctx = new Context(resolveOptions({
    cwd: join(__dirname, 'fixtures'),
    dts: 'uni-layouts.d.ts',
  }))
  ctx.layouts = [
    layout('first'),
  ]

  const calls: string[][] = []
  let releaseFirst: (() => void) | undefined
  vi.mocked(writeDeclaration).mockImplementation(
    async (_filePath, layoutNames) => {
      calls.push(layoutNames)
      if (calls.length === 1) {
        await new Promise<void>((resolve) => {
          releaseFirst = resolve
        })
      }
    },
  )

  const first = ctx.writeDeclarationFile()
  ctx.layouts = [
    layout('second'),
  ]
  const second = ctx.writeDeclarationFile()

  // the second write is queued, so only the first one has started
  await new Promise(resolve => setImmediate(resolve))
  expect(calls).toEqual([
    ['first'],
  ])

  releaseFirst!()
  await Promise.all([first, second])
  expect(calls).toEqual([
    ['first'],
    ['second'],
  ])
})
