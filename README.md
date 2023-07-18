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

layout 插件并非使用了什么魔法，它只做了两件事：
1. 自动扫描并全局注册 layouts 目录下的组件
2. 将页面使用 layout 组件包裹起来
所以，在微信小程序下，如果你使用了 web-view , 那么不会生效。

如果你使用 [vite-plugin-uni-pages](https://github.com/uni-helper/vite-plugin-uni-pages), 只需使用 route-block

```vue
<route>
{
  "layout": "anyLayout"
}
</route>
```
