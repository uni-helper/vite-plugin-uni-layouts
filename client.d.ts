declare module "virtual:uni-layouts" {
  import type { DefineComponent, App, Plugin } from "vue";
  export const layouts: Record<string, DefineComponent<{}, {}, any>>;
  const plugin: Plugin
  export default plugin;
}
