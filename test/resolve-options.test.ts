import path from 'node:path'
import { expect, it } from 'vitest'
import { resolveOptions } from '../src/utils'

it('resolve user options', () => {
  const { cwd, layout, layoutDir } = resolveOptions({
    layout: 'home',
    layoutDir: 'src/layout',
  })
  expect(path.isAbsolute(cwd)).toBe(true)
  expect({ layout, layoutDir }).toMatchSnapshot('userOptions')
})

it('resolve default options', () => {
  const { cwd, layout, layoutDir } = resolveOptions()
  expect(path.isAbsolute(cwd)).toBe(true)
  expect({ layout, layoutDir }).toMatchSnapshot('default')
})

it('resolve the declaration file path', () => {
  const cwd = path.resolve(__dirname, 'fixtures')

  expect(resolveOptions({ cwd }).dts).toBe(path.resolve(cwd, 'src/uni-layouts.d.ts'))
  expect(resolveOptions({ cwd, dts: 'src/types/layouts.d.ts' }).dts).toBe(path.resolve(cwd, 'src/types/layouts.d.ts'))
  expect(resolveOptions({ cwd, dts: false }).dts).toBe(false)
})
