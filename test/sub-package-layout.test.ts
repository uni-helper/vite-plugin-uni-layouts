import { resolve } from 'node:path'
import { afterEach, expect, it, vi } from 'vitest'
import { Context } from '../src/context'
import { resolveOptions } from '../src/utils'

const cwd = resolve(__dirname, 'fixtures-sub-package')

afterEach(() => {
  vi.unstubAllEnvs()
})

/**
 * 分包页面的 `layout` 只写在当前平台那条 pages.json 条目里。读错平台时页面会
 * 套上别的平台的布局，看起来就像"分包页面的 layout 永远不生效"。
 */
it('keeps the disabled layout of a sub package page on the current platform', async () => {
  vi.stubEnv('UNI_PLATFORM', 'mp-weixin')

  const ctx = new Context(resolveOptions({ cwd }))
  const code = await ctx.transform(
    '<template><view>hi</view></template>',
    `${cwd}/src/pages-sub/list/index.vue`,
  )

  // 页面没有 `<uh-uni-layout>`，禁用布局就等于不改写
  expect(code).toBeUndefined()
})

it('uses the named layout of a sub package page on the current platform', async () => {
  vi.stubEnv('UNI_PLATFORM', 'mp-weixin')

  const ctx = new Context(resolveOptions({ cwd }))
  const code = await ctx.transform(
    '<template><view>hi</view></template>',
    `${cwd}/src/pages-sub/list/named.vue`,
  )

  expect(code?.code).toContain('<layout-tabbar-uni')
})
