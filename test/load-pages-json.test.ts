import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { loadPagesJson, parsePagesJson } from '../src/utils'

it('load pages', () => {
  const cwd = resolve(__dirname, 'fixtures')
  const pagesJson = loadPagesJson('src/pages.json', cwd)
  expect(pagesJson).toMatchSnapshot()
})

describe('duplicated page entries', () => {
  it('warns about duplicates and stays quiet without them', () => {
    const cwd = resolve(__dirname, 'fixtures')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubEnv('UNI_PLATFORM', 'mp-weixin')

    loadPagesJson('src/pages-duplicated.json', cwd)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"pages/index/index"'))

    // 同一个断言在无重复的 pages.json 上必须不成立，否则它永远不会失败
    warn.mockClear()
    loadPagesJson('src/pages.json', cwd)
    expect(warn).not.toHaveBeenCalled()

    warn.mockRestore()
    vi.unstubAllEnvs()
  })
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
  it('unbalanced ifdef', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const jsonString = `{
      "pages": [
        {
          "path": "pages/index/index"
        },
        // #ifdef APP-PLUS
        {
          "path": "pages/app/index"
        }
      ]
    }`
    expect(parsePagesJson(jsonString, 'H5')).toEqual({
      pages: [
        {
          path: 'pages/index/index',
        },
      ],
    })
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('unbalanced #ifdef'),
    )
    warn.mockRestore()
  })
})
