import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { expect, it, vi } from 'vitest'
import { scanLayouts } from '../src/scan'

it('scanLayouts', () => {
  const cwd = resolve(__dirname, 'fixtures')
  const layouts = scanLayouts('src/layouts', cwd)
  expect(
    layouts.map((v) => {
      return {
        ...v,
        path: v.path.slice(cwd.length + 1),
      }
    }),
  ).toMatchSnapshot()
})

it('skips a layout whose name cannot be used in generated code', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'uni-layouts-scan-'))
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  try {
    mkdirSync(join(cwd, 'layouts'))
    for (const file of [
      'good.vue',
      '1room.vue',
      '中文.vue',
      'foo\'bar.vue',
    ])
      writeFileSync(join(cwd, 'layouts', file), '<template><view /></template>')

    const layouts = scanLayouts('layouts', cwd)

    // a digit and non-ASCII letters still make a valid identifier and tag
    expect(layouts.map(layout => layout.name)).toEqual(['1room', 'good', '中文'])
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('foo\'bar.vue'))
  }
  finally {
    warn.mockRestore()
    rmSync(cwd, { recursive: true, force: true })
  }
})
