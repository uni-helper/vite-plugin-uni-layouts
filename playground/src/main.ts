import { createSSRApp } from "vue";
import App from "./App.vue";
import UseUniLayouts from "virtual:uni-layouts";

export function createApp() {
  const app = createSSRApp(App);
  UseUniLayouts(app);
  return {
    app,
  };
}
