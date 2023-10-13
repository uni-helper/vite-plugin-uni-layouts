import { resolve } from 'node:path'
import { expect, it } from 'vitest'
import { loadPagesJson } from '../src/utils'

it('load pages', () => {
  const cwd = resolve(__dirname, 'fixtures')
  const pagesJson = loadPagesJson('src/pages.json', cwd)
  expect(pagesJson).toMatchSnapshot()
})
