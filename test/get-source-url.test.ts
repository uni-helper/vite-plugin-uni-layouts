import { expect, it } from 'vitest'
import { getSourceUrl } from '../src/utils'

it('serves sources from src when pages.json lives there', () => {
  expect(getSourceUrl('src/pages.json', 'pages/index/index.vue')).toBe('/src/pages/index/index.vue')
  expect(getSourceUrl('src/pages.json', 'pages-sub/test/test.vue')).toBe('/src/pages-sub/test/test.vue')
  expect(getSourceUrl('src/pages.json', 'main.ts')).toBe('/src/main.ts')
})

it('serves sources from the root when pages.json lives there', () => {
  expect(getSourceUrl('pages.json', 'pages/index/index.vue')).toBe('/pages/index/index.vue')
  expect(getSourceUrl('pages.json', 'main.ts')).toBe('/main.ts')
})
