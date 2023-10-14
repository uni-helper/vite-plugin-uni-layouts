import { resolve } from 'node:path'
import { expect, it } from 'vitest'
import { Context } from '../src/context'
import { resolveOptions } from '../src/utils'

const ctx = new Context(
  resolveOptions({
    cwd: resolve(__dirname, 'fixtures'),
  }),
)
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
