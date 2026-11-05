import process from 'node:process'
import { expect, it } from 'vitest'
import { isLayoutFile } from '../src/utils'

const layoutDir = '/project/src/layouts'

it('accepts vue files inside the layouts directory', () => {
  expect(isLayoutFile('/project/src/layouts/default.vue', layoutDir)).toBe(true)
  expect(isLayoutFile('/project/src/layouts/blog/index.vue', layoutDir)).toBe(true)
})

it('rejects a sibling directory that shares the prefix', () => {
  expect(isLayoutFile('/project/src/layouts-old/default.vue', layoutDir)).toBe(false)
})

it('rejects files that are not layouts', () => {
  // scanLayouts only reads `.vue`, so an `.nvue` file there changes nothing
  expect(isLayoutFile('/project/src/layouts/native.nvue', layoutDir)).toBe(false)
  expect(isLayoutFile('/project/src/layouts/README.md', layoutDir)).toBe(false)
  expect(isLayoutFile('/project/src/pages/index/index.vue', layoutDir)).toBe(false)
})

// vite's normalizePath only turns `\` into `/` on windows, so backslashes
// reach the plugin only there
it.runIf(process.platform === 'win32')('matches windows paths', () => {
  expect(isLayoutFile('C:\\project\\src\\layouts\\default.vue', 'C:\\project\\src\\layouts')).toBe(true)
  expect(isLayoutFile('C:\\project\\src\\layouts-old\\default.vue', 'C:\\project\\src\\layouts')).toBe(false)
})
