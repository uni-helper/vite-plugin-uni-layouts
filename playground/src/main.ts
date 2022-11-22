import { createSSRApp } from "vue";
import App from "./App.vue";
import UniLayouts from "virtual:uni-layouts";

export function createApp() {
  const app = createSSRApp(App);
  app.use(UniLayouts)
  return {
    app,
  };
}
