import { resolve } from 'node:path'
import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
})

it('puts the layout ref on every branch of the mini program layout chain', async () => {
  // `isMp` is read from the env when the module loads, so the env has to be
  // stubbed before importing the plugin and reset for the other test files
  vi.stubEnv('UNI_PLATFORM', 'mp-weixin')
  vi.resetModules()
  const { Context } = await import('../src/context')
  const { resolveOptions } = await import('../src/utils')

  const ctx = new Context(resolveOptions({
    cwd: resolve(__dirname, 'fixtures'),
  }))
  const code = await ctx.transform(
    `<script setup>
const layout = useUhUniLayoutRef()
</script>
<template>
  <UhUniLayout :name="layoutName">
    <main></main>
  </UhUniLayout>
</template>`,
    `${ctx.options.cwd}/src/pages/index/disabled.vue`,
  )

  const branches = code!.code.split('\n').filter(line => line.startsWith('<layout-'))
  expect(branches.length).toBeGreaterThan(1)
  for (const branch of branches)
    expect(branch).toContain('ref="layout"')
})
