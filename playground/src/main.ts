import type { App as VueApp } from 'vue'
import { createSSRApp } from 'vue'
import App from './App.vue'

// uni-app 的入口约定：返回 { app }，类型由 uni-app 运行时声明
export function createApp(): { app: VueApp } {
  const app = createSSRApp(App)
  return {
    app,
  }
}
