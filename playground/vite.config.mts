import Uni from '@uni-helper/plugin-uni'
import UniLayouts from '@uni-helper/vite-plugin-uni-layouts'
import UniPages from '@uni-helper/vite-plugin-uni-pages'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    UniPages({
      subPackages: [
        'src/pages-sub',
      ],
      dts: 'src/uni-pages.d.ts',
      insertFinalNewline: true,
    }),
    UniLayouts(),
    Uni(),
  ],
})
