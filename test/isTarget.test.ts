import { resolve } from 'node:path'
import { expect, it } from 'vitest'
import { getTarget } from '../src/utils'

const cwd = resolve(__dirname, 'fixtures')

const pages = [
  {
    path: 'pages/index/index',
  },
  {
    path: 'pages/index/test',
    layout: 'test',
  },
]
it('getTarget:default', () => {
  const page = getTarget(`${cwd}/src/pages/index/index.vue`, pages, 'default', cwd)
  expect(page).toMatchObject({
    ...pages[0],
    layout: 'default',
  })
})

it('getTarget:false', () => {
  const page = getTarget('middleware/auth.ts', pages, 'default', cwd)
  expect(page).toEqual(false)
})
it('getTarget:test', () => {
  const page = getTarget(`${cwd}/src/pages/index/test.vue`, pages, 'test', cwd)
  expect(page).toEqual(pages[1])
})
