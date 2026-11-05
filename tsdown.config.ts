import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  // vite 只在使用方项目里存在（本包把它作为开发依赖），不能打进产物
  deps: {
    neverBundle: ['vite'],
  },
  format: 'esm',
  dts: true,
  clean: true,
})
