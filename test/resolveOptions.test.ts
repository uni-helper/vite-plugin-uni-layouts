import path, { } from 'node:path'
import { expect, it } from 'vitest'
import { resolveOptions } from '../src/utils'

it('resolve user options', () => {
  const options = resolveOptions({
    layout: 'home',
    layoutDir: 'src/layout',
  })
  options.cwd = path.basename(options.cwd)
  expect(options).toMatchSnapshot('userOptions')
})

it('resolve default options', () => {
  const options = resolveOptions()
  options.cwd = path.basename(options.cwd)
  expect(options).toMatchSnapshot('default')
})
