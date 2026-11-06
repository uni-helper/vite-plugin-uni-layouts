import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, it } from 'vitest'
import { Context } from '../src/context'
import { resolveOptions } from '../src/utils'

let cwd: string | undefined

afterEach(async () => {
  if (cwd)
    await rm(cwd, { recursive: true, force: true })
  cwd = undefined
})

async function createProject(dts: string | false = 'src/uni-layouts.d.ts'): Promise<Context> {
  cwd = await mkdtemp(join(tmpdir(), 'uni-layouts-refresh-'))
  await mkdir(join(cwd, 'src/layouts'), { recursive: true })
  await writeFile(join(cwd, 'src/layouts/default.vue'), '<template><view /></template>')
  return new Context(resolveOptions({ cwd, dts }))
}

it('adds a layout that appears while the dev server runs', async () => {
  const ctx = await createProject()
  const file = join(cwd!, 'src/uni-layouts.d.ts')
  await ctx.reloadLayouts()
  expect(await readFile(file, 'utf-8')).toContain('default: true')

  await writeFile(join(cwd!, 'src/layouts/posts.vue'), '<template><view /></template>')
  await ctx.reloadLayouts()
  expect(await readFile(file, 'utf-8')).toContain('posts: true')
})

it('drops a layout that was deleted', async () => {
  const ctx = await createProject()
  const file = join(cwd!, 'src/uni-layouts.d.ts')
  await writeFile(join(cwd!, 'src/layouts/posts.vue'), '<template><view /></template>')
  await ctx.reloadLayouts()
  expect(await readFile(file, 'utf-8')).toContain('posts: true')

  await rm(join(cwd!, 'src/layouts/posts.vue'))
  await ctx.reloadLayouts()
  expect(await readFile(file, 'utf-8')).not.toContain('posts: true')
})

it('writes no declaration when the dts option is off', async () => {
  const ctx = await createProject(false)
  await ctx.reloadLayouts()
  expect(existsSync(join(cwd!, 'src/uni-layouts.d.ts'))).toBe(false)
})
