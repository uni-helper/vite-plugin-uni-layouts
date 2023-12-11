import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import UniLayouts from '@uni-helper/vite-plugin-uni-layouts'
import UniPages from '@uni-helper/vite-plugin-uni-pages'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // @ts-expect-error ignore
    UniPages({
      subPackages: [
        'pages-sub',
      ],
      dts: 'src/uni-pages.d.ts',
    }),
    // @ts-expect-error ignore
    UniLayouts(),
    uni(),
  ],
})
