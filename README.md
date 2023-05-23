# @uni-helper/vite-plugin-uni-layouts

Vite 下 uni-app 的可定制布局框架

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

在 `src/layouts` 下创建布局

```vue
<!-- default.vue -->
<template>
  <slot>main</slot>
</template>
```

在 pages.json 中的页面中添加 layout 配置

```jsonc
// pages.json
{
  ...
  "pages": [{
    "path": "pages/index/index",
    // 可选, 这是默认值
    "layout": "default",
    
    // 或者使用 meta layout 更加贴合 vue-router 语义化
    // "meta": {
    //   "layout": "default"
    // }
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
