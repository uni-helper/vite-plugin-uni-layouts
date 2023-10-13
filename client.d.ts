declare module 'virtual:uni-layouts' {
  import type { DefineComponent, Plugin } from 'vue'

  export const layouts: Record<string, DefineComponent<object, object, any>>
  const plugin: Plugin
  export default plugin
}
