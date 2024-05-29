import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import UniLayouts from '@uni-helper/vite-plugin-uni-layouts'
import UniPages from '@uni-helper/vite-plugin-uni-pages'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    UniPages({
      subPackages: [
        'pages-sub',
      ],
      dts: 'src/uni-pages.d.ts',
    }),
    UniLayouts({
      teleportRootEl: '<page-meta :page-style="\'overflow:\'+(popShow?\'hidden\':\'visible\')"></page-meta>'
    }),
    uni(),
  ],
})
