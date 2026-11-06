import { resolve } from 'node:path'
import { afterEach, expect, it, vi } from 'vitest'
import { Context } from '../src/context'
import { resolveOptions } from '../src/utils'

const ctx = new Context(
  resolveOptions({
    cwd: resolve(__dirname, 'fixtures'),
  }),
)

afterEach(() => {
  vi.restoreAllMocks()
})
// const defaultLayout = ctx.layouts.find(l => l.name === 'default') as Layout

it('use default layout', async () => {
  const code = await ctx.transform(
    `<template><div>hello</div></template>`,
    `${ctx.options.cwd}/src/pages/index/index.vue`,
  )
  expect(code?.code).toMatchSnapshot()
})

it('use test layout', async () => {
  const code = await ctx.transform(
    `<template><main></main></template>`,
    `${ctx.options.cwd}/src/pages/index/test.vue`,
  )
  expect(code?.code).toMatchSnapshot()
})
it('use inline layout', async () => {
  const code = await ctx.transform(
    `<template>
    <UniLayout name="camelLayout">
        <main></main>
    </UniLayout>
  </template>`,
    `${ctx.options.cwd}/src/pages/index/disabled.vue`,
  )
  expect(code?.code).toMatchSnapshot()
})
it('hoist page-meta out of the layout', async () => {
  const code = await ctx.transform(
    `<template>
  <page-meta :page-style="pageStyle"></page-meta>
  <view>hello</view>
</template>`,
    `${ctx.options.cwd}/src/pages/index/index.vue`,
  )
  expect(code?.code).toMatchSnapshot()
})
it('leave a PageMeta component inside the layout', async () => {
  const code = await ctx.transform(
    `<template>
  <PageMeta />
  <view>hello</view>
</template>`,
    `${ctx.options.cwd}/src/pages/index/index.vue`,
  )
  expect(code?.code).toMatchSnapshot()
})
it('keep page-meta in place when layout is disabled', async () => {
  const code = await ctx.transform(
    `<template>
  <page-meta :page-style="pageStyle"></page-meta>
  <UniLayout name="camelLayout">
    <main></main>
  </UniLayout>
</template>`,
    `${ctx.options.cwd}/src/pages/index/disabled.vue`,
  )
  expect(code?.code).toMatchSnapshot()
})
it('bind a named layout ref', async () => {
  const code = await ctx.transform(
    `<script setup>
const layout = useUniLayoutRef()
</script>
<template><div>hello</div></template>`,
    `${ctx.options.cwd}/src/pages/index/index.vue`,
  )
  expect(code?.code).toMatchSnapshot()
})
it('bind the legacy uniLayout ref', async () => {
  const code = await ctx.transform(
    `<script setup>
import { ref } from 'vue'
const uniLayout = ref()
</script>
<template><div>hello</div></template>`,
    `${ctx.options.cwd}/src/pages/index/index.vue`,
  )
  expect(code?.code).toMatchSnapshot()
})
it('leave an ordinary template ref alone', async () => {
  const code = await ctx.transform(
    `<script setup>
import { ref } from 'vue'
const title = ref('hello')
</script>
<template><div>hello</div></template>`,
    `${ctx.options.cwd}/src/pages/index/index.vue`,
  )
  expect(code?.code).toMatchSnapshot()
})
it('bind the layout ref on the dynamic layout', async () => {
  const code = await ctx.transform(
    `<script setup>
const layout = useUniLayoutRef()
</script>
<template>
  <UniLayout name="camelLayout">
    <main></main>
  </UniLayout>
</template>`,
    `${ctx.options.cwd}/src/pages/index/disabled.vue`,
  )
  expect(code?.code).toMatchSnapshot()
})
it('keep the ref written on the dynamic layout', async () => {
  const code = await ctx.transform(
    `<script setup>
const layout = useUniLayoutRef()
</script>
<template>
  <UniLayout ref="myLayout" name="camelLayout">
    <main></main>
  </UniLayout>
</template>`,
    `${ctx.options.cwd}/src/pages/index/disabled.vue`,
  )
  expect(code?.code).toMatchSnapshot()
})

it('warn about a wrong layout name', async () => {
  const warnCtx = new Context(resolveOptions({
    cwd: resolve(__dirname, 'fixtures'),
  }))
  warnCtx.pages = [
    { path: 'pages/index/wrong-layout', layout: 'nope' },
  ]

  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const code = await warnCtx.transform(
    `<template><div>hello</div></template>`,
    `${warnCtx.options.cwd}/src/pages/index/wrong-layout.vue`,
  )

  // the page still renders, only without a wrapper
  expect(code).toBeUndefined()
  expect(warn).toHaveBeenCalledOnce()
  expect(warn.mock.calls[0][0]).toContain('"nope"')
  expect(warn.mock.calls[0][0]).toContain('pages/index/wrong-layout')
})

it('warn once when the layout directory has no layouts', async () => {
  const emptyCtx = new Context(resolveOptions({
    cwd: resolve(__dirname, 'fixtures'),
    layoutDir: 'src/layouts/missing',
  }))
  emptyCtx.pages = [
    { path: 'pages/index/one' },
    { path: 'pages/index/two' },
  ]

  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  for (const name of ['one', 'two']) {
    const code = await emptyCtx.transform(
      `<template><div>${name}</div></template>`,
      `${emptyCtx.options.cwd}/src/pages/index/${name}.vue`,
    )
    expect(code).toBeUndefined()
  }

  expect(warn).toHaveBeenCalledOnce()
  expect(warn.mock.calls[0][0]).toContain('src/layouts/missing')
})

it('warn when a page falls back to a missing default layout', async () => {
  const noDefaultCtx = new Context(resolveOptions({
    cwd: resolve(__dirname, 'fixtures'),
    layoutDir: 'src/layouts/the',
  }))
  noDefaultCtx.pages = [
    { path: 'pages/index/index' },
  ]

  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const code = await noDefaultCtx.transform(
    `<template><div>hello</div></template>`,
    `${noDefaultCtx.options.cwd}/src/pages/index/index.vue`,
  )

  expect(code).toBeUndefined()
  expect(warn).toHaveBeenCalledOnce()
  expect(warn.mock.calls[0][0]).toContain('uses the default layout "default"')
})
