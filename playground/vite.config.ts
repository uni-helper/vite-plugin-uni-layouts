import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import UniLayouts from '@uni-helper/vite-plugin-uni-layouts'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [UniLayouts(), uni()],
})
