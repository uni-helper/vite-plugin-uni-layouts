declare module "virtual:uni-layouts" {
  import type { DefineComponent, App } from "vue";
  export const layouts: Record<string, DefineComponent<{}, {}, any>>;
  const plugin: (app: App) => void;
  export default plugin;
}
