# @uni-helper/vite-plugin-uni-layouts

Customizable layouts framework for uni-app applications using Vite.

English | [简体中文](./README.zhCN.md)

## Installation

```bash
pnpm i -D @uni-helper/vite-plugin-uni-layouts
```

## Usage

```ts
// vite.config.ts
import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
import UniLayouts from "@uni-helper/vite-plugin-uni-layouts";

export default defineConfig({
  plugins: [UniLayouts(), uni()],
});
```

Import virtual layouts and call `app.use`

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

Create the layout in `src/layouts`

```vue
<!-- default.vue -->
<template>
  <slot>main</slot>
</template>
```

Add layout config on page in pages.json

```json
// pages.json
{
  ...
  "pages": [{
    "path": "pages/index/index",
    // Optional, this is default value
    "layout": "default"
  }]
  ...
}
```

## Configuration

see [type.ts](./src/types.ts)

## Notes

If you used [vite-plugin-uni-pages](https://github.com/uni-helper/vite-plugin-uni-pages), just only use route-block.

```vue
<route>
{
  "layout": "anyLayout"
}
</route>
```

## TODO

- [ ] layout ref
