import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadPagesJson, parsePagesJson } from '../src/utils'

it('load pages', () => {
  const cwd = resolve(__dirname, 'fixtures')
  const pagesJson = loadPagesJson('src/pages.json', cwd)
  expect(pagesJson).toMatchSnapshot()
})

describe('parsePagesJson', () => {
  it('ifdef APP-PLUS', () => {
    const jsonString = `{
      "pages": [
        // #ifdef APP-PLUS
        {
          "path": "pages/index/index",
        }
        // #endif
      ]
    }`
    expect(parsePagesJson(jsonString, 'APP-PLUS')).toEqual({
      pages: [
        {
          path: 'pages/index/index',
        },
      ],
    })
    expect(parsePagesJson(jsonString, 'APP')).toEqual({
      pages: [],
    })
  })
  it('ifdef APP', () => {
    const jsonString = `{
      "pages": [
        // #ifdef APP
        {
          "path": "pages/index/index",
        }
        // #endif
      ]
    }`
    expect(parsePagesJson(jsonString, 'APP-PLUS')).toEqual({
      pages: [
        {
          path: 'pages/index/index',
        },
      ],
    })
    expect(parsePagesJson(jsonString, 'APP')).toEqual({
      pages: [
        {
          path: 'pages/index/index',
        },
      ],
    })
  })
  it('ifdef H5', () => {
    const jsonString = `{
      "pages": [
        // #ifdef H5
        {
          "path": "pages/index/index",
        }
        // #endif
      ]
    }`
    expect(parsePagesJson(jsonString, 'WEB')).toEqual({
      pages: [
        {
          path: 'pages/index/index',
        },
      ],
    })
    expect(parsePagesJson(jsonString, 'APP')).toEqual({
      pages: [],
    })
  })
  it('ifndef and ||', () => {
    const jsonString = `{
      "pages": [
        {
          // #ifdef H5 || MP-WEIXIN
          "path": "pages/index/index"
          // #endif
          // #ifndef H5 || MP-WEIXIN
          "path": "pages/index/index1"
          // #endif
        }
      ]
    }`
    expect(parsePagesJson(jsonString, 'WEB')).toEqual({
      pages: [
        {
          path: 'pages/index/index',
        },
      ],
    })
    expect(parsePagesJson(jsonString, 'MP-WEIXIN')).toEqual({
      pages: [
        {
          path: 'pages/index/index',
        },
      ],
    })
    expect(parsePagesJson(jsonString, 'MP-ALIPAY')).toEqual({
      pages: [
        {
          path: 'pages/index/index1',
        },
      ],
    })
  })
  it('ifdef with else', () => {
    const jsonString = `{
      "pages": [
        // #ifdef MP-WEIXIN
        {
          "path": "pages/mp/index"
        },
        // #else
        {
          "path": "pages/web/index"
        },
        // #endif
        {
          "path": "pages/shared/index"
        }
      ]
    }`
    expect(parsePagesJson(jsonString, 'MP-WEIXIN')).toEqual({
      pages: [
        {
          path: 'pages/mp/index',
        },
        {
          path: 'pages/shared/index',
        },
      ],
    })
    expect(parsePagesJson(jsonString, 'H5')).toEqual({
      pages: [
        {
          path: 'pages/web/index',
        },
        {
          path: 'pages/shared/index',
        },
      ],
    })
  })
  it('platform name with underscores', () => {
    const jsonString = `{
      "pages": [
        // #ifdef MP_WEIXIN
        {
          "path": "pages/index/index"
        }
        // #endif
      ]
    }`
    expect(parsePagesJson(jsonString, 'MP-WEIXIN')).toEqual({
      pages: [
        {
          path: 'pages/index/index',
        },
      ],
    })
  })
})
