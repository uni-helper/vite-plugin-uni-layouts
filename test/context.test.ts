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
    <UhUniLayout name="camelLayout">
        <main></main>
    </UhUniLayout>
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
  <UhUniLayout name="camelLayout">
    <main></main>
  </UhUniLayout>
</template>`,
    `${ctx.options.cwd}/src/pages/index/disabled.vue`,
  )
  expect(code?.code).toMatchSnapshot()
})
it('bind a named layout ref', async () => {
  const code = await ctx.transform(
    `<script setup>
const layout = useUhUniLayoutRef()
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
const layout = useUhUniLayoutRef()
</script>
<template>
  <UhUniLayout name="camelLayout">
    <main></main>
  </UhUniLayout>
</template>`,
    `${ctx.options.cwd}/src/pages/index/disabled.vue`,
  )
  expect(code?.code).toMatchSnapshot()
})
it('keep the ref written on the dynamic layout', async () => {
  const code = await ctx.transform(
    `<script setup>
const layout = useUhUniLayoutRef()
</script>
<template>
  <UhUniLayout ref="myLayout" name="camelLayout">
    <main></main>
  </UhUniLayout>
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
  // the message prints the resolved directory, which separates with `\` on Windows
  expect(warn.mock.calls[0][0].replaceAll('\\', '/')).toContain('src/layouts/missing')
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

it('warn about the renamed uni-layout tag', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const legacy = await ctx.transform(
    `<template><uni-layout name="camelLayout"><main></main></uni-layout></template>`,
    `${ctx.options.cwd}/src/pages/index/disabled.vue`,
  )

  // the page is left alone, so without the warning a leftover tag that no
  // longer matches looks the same as a page that needs no layout
  expect(legacy).toBeUndefined()
  expect(warn).toHaveBeenCalledOnce()
  expect(warn.mock.calls[0][0]).toContain('<uh-uni-layout>')

  warn.mockClear()
  const current = await ctx.transform(
    `<template><uh-uni-layout name="camelLayout"><main></main></uh-uni-layout></template>`,
    `${ctx.options.cwd}/src/pages/index/disabled.vue`,
  )

  expect(current?.code).toContain('<component')
  expect(warn).not.toHaveBeenCalled()
})

it('warn about the layout tag on a statically laid out page', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const code = await ctx.transform(
    `<template><uh-uni-layout name="camelLayout"><main></main></uh-uni-layout></template>`,
    `${ctx.options.cwd}/src/pages/index/index.vue`,
  )

  // the page keeps its wrapper, so the tag stays in the template and renders
  // nothing; only the warning says so
  expect(code?.code).toContain('<layout-default-uni')
  expect(code?.code).toContain('<uh-uni-layout')
  expect(warn).toHaveBeenCalledOnce()
  expect(warn.mock.calls[0][0]).toContain('"layout": false')
})

it('warn about a nested layout tag', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const code = await ctx.transform(
    `<template><view><uh-uni-layout name="camelLayout"><main></main></uh-uni-layout></view></template>`,
    `${ctx.options.cwd}/src/pages/index/disabled.vue`,
  )

  expect(code).toBeUndefined()
  expect(warn).toHaveBeenCalledOnce()
  expect(warn.mock.calls[0][0]).toContain('directly under <template>')
})
