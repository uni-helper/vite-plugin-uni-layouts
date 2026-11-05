import type { Page } from '../src/types'
import { expect, it } from 'vitest'
import { getPagesWithChangedLayout } from '../src/utils'

it('ignores reordered pages and unchanged layouts', () => {
  const pre: Page[] = [
    { path: 'pages/index/index' },
    { path: 'pages/a/a', layout: 'admin' },
  ]
  const next: Page[] = [
    { path: 'pages/a/a', layout: 'admin' },
    { path: 'pages/index/index' },
  ]
  expect(getPagesWithChangedLayout(next, pre)).toEqual([])
})

it('returns pages that gained or lost a layout', () => {
  const pre: Page[] = [
    { path: 'pages/a/a' },
    { path: 'pages/b/b', layout: 'admin' },
  ]
  const next: Page[] = [
    { path: 'pages/a/a', layout: 'admin' },
    { path: 'pages/b/b' },
  ]
  expect(getPagesWithChangedLayout(next, pre)).toEqual(next)
})

it('treats turning the layout off as a change', () => {
  const pre: Page[] = [
    { path: 'pages/a/a', layout: 'admin' },
  ]
  const next: Page[] = [
    { path: 'pages/a/a', layout: false },
  ]
  expect(getPagesWithChangedLayout(next, pre)).toEqual(next)
})

it('skips pages that pages.json did not list before', () => {
  const pre: Page[] = [
    { path: 'pages/a/a' },
  ]
  const next: Page[] = [
    { path: 'pages/a/a' },
    { path: 'pages/new/new' },
  ]
  expect(getPagesWithChangedLayout(next, pre)).toEqual([])
})
