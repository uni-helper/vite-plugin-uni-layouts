# @uni-helper/vite-plugin-uni-layouts

Vite 下 uni-app 的可定制布局框架

[English](./README.md) | 简体中文

## 安装

```bash
pnpm i -D @uni-helper/vite-plugin-uni-layouts
```

## 使用

```ts
// vite.config.ts
import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
import UniLayouts from "@uni-helper/vite-plugin-uni-layouts";

export default defineConfig({
  plugins: [UniLayouts(), uni()],
});
```

导入虚拟布局并调用 `app.use`

```ts
// src/main.ts
import { createSSRApp } from "vue";
import App from "./App.vue";
import UniLayouts from "virtual:uni-layouts";

export function createApp() {
  const app = createSSRApp(App);
  app.use(UniLayouts);
  return {
    app,
  };
}
```

在 `src/layouts` 下创建布局

```vue
<!-- default.vue -->
<template>
  <slot>main</slot>
</template>
```

在 pages.json 中的页面中添加 layout 配置

```json
// pages.json
{
  ...
  "pages": [{
    "path": "pages/index/index",
    // 可选, 这是默认值
    "layout": "default"
  }]
  ...
}
```

## 配置

see [type.ts](./src/types.ts)

## 注意

如果你使用 [vite-plugin-uni-pages](https://github.com/uni-helper/vite-plugin-uni-pages), 只需使用 route-block

```vue
<route>
{
  "layout": "anyLayout"
}
</route>
```
