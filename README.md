<a href="https://uni-helper.js.org/vite-plugin-uni-layouts"><img src="https://cdn.jsdelivr.net/gh/uni-helper/vite-plugin-uni-layouts@main/banner.svg" alt="banner" width="100%"/></a>

# @uni-helper/vite-plugin-uni-layouts

<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/uni-helper/vite-plugin-uni-layouts@main/logo.svg" alt="logo" width="256" height="256"/>
</p>

<p align="center">
  <a href="https://github.com/uni-helper/vite-plugin-uni-layouts/blob/main/LICENSE"><img src="https://img.shields.io/github/license/uni-helper/vite-plugin-uni-layouts?style=for-the-badge&labelColor=005947&color=eee" alt="License"></a>
  <a href="https://github.com/uni-helper/vite-plugin-uni-layouts/stargazers"><img src="https://img.shields.io/github/stars/uni-helper/vite-plugin-uni-layouts?style=for-the-badge&labelColor=005947&color=eee" alt="Stars"></a>
  <a href="https://npmx.dev/package/@uni-helper/vite-plugin-uni-layouts"><img src="https://img.shields.io/npm/v/@uni-helper/vite-plugin-uni-layouts?style=for-the-badge&labelColor=005947&color=eee" alt="NPM Version"></a>
  <a href="https://npmx.dev/package/@uni-helper/vite-plugin-uni-layouts"><img src="https://img.shields.io/npm/dm/@uni-helper/vite-plugin-uni-layouts?style=for-the-badge&labelColor=005947&color=eee" alt="NPM Downloads"></a>
</p>
<p align="center">
  <a href="https://github.com/kejunmao"><img src="https://img.shields.io/badge/Author-KeJun-blue?style=for-the-badge" alt="Author"></a>
  <a href="https://github.com/ModyQyW"><img src="https://img.shields.io/badge/Maintainer-ModyQyW-blue?style=for-the-badge" alt="Maintainer"></a>
</p>

Vite 下 uni-app 的可定制布局框架。构建时扫描 `src/layouts`，把布局组件全局注册，再按页面配置把页面模板包进对应布局。

不想看文档？直接问 AI 🤖 <a href="https://deepwiki.com/uni-helper/vite-plugin-uni-layouts"><img src="https://deepwiki.com/badge.svg" alt="Ask DeepWiki"></a>

## 安装

```bash
pnpm i -D @uni-helper/vite-plugin-uni-layouts
```

需要 Node.js `^22.22.2 || ^24.15.0 || >=26.0.0`。0.2 起只提供 ESM 入口，Vite 配置要按 ESM 加载。

## 使用

### 配置

```ts
// vite.config.mts
import Uni from '@uni-helper/plugin-uni'
import UniLayouts from '@uni-helper/vite-plugin-uni-layouts'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    UniLayouts(), // 要在 Uni() 之前
    Uni(),
  ],
})
```

`@uni-helper/plugin-uni` 只做一件事：把 CJS 的 `@dcloudio/vite-plugin-uni` 转成 ESM 默认导出。不装它也行，自己取一次 `.default`：`const Uni = (dcloudioUni as unknown as { default?: typeof dcloudioUni }).default ?? dcloudioUni`。

### 创建布局

在 `src/layouts` 下新建布局组件，文件名就是布局名。

```vue
<!-- src/layouts/default.vue -->
<template>
  <view>
    <slot>main</slot>
  </view>
</template>
```

`posts.vue`、`Posts.vue`、`posts/index.vue` 都得到 `posts`。带目录的布局保留目录段，`the/nesting/layout.vue` 得到 `theNestingLayout`；目录名和文件名重复的段只算一次。页面配置里写的是 camelCase 形式。

### 应用布局

页面默认用 `default` 布局。换布局就在 pages.json 里给页面写 `layout`：

```json
{
  "pages": [
    {
      "path": "pages/index/index",
      "layout": "posts"
    }
  ]
}
```

配合 [vite-plugin-uni-pages](https://github.com/uni-helper/vite-plugin-uni-pages) 时写进 `definePage` 宏，由它生成 pages.json：

```vue
<script setup lang="ts">
definePage({
  layout: 'posts',
})
</script>
```

`<route>` 自定义块在 uni-pages 0.4 就移除了，写在那里不会进 pages.json。

### 禁用布局

`layout: false` 表示页面不套布局，模板原样输出。这种页面要自己用 `<uni-layout>` 指定布局。

```json
{
  "path": "pages/index/index",
  "layout": false
}
```

### 动态布局

页面禁用布局后，用内置组件 `<uni-layout>` 指定布局。`name` 支持绑定变量，组件上的其他属性会透传给布局组件。

```vue
<script setup>
import { ref } from 'vue'

const name = ref('default')
</script>

<template>
  <uni-layout :name="name">
    <template #header>
      header
    </template>
    页面内容
    <template #footer>
      footer
    </template>
  </uni-layout>
</template>
```

小程序端展开成每个布局的 `v-if` / `v-else-if` 链，H5 端生成一个 `<component :is>`。

### ref

声明一个叫 `uniLayout` 的 ref，插件会给包裹页面的布局组件加上 `ref="uniLayout"`。

```vue
<script setup>
import { ref } from 'vue'

const uniLayout = ref()
</script>
```

Options API 里用 `this.$refs.uniLayout`。

### 选项

`UniLayouts(options)` 只有三个字段：`layout` 是默认布局名（默认 `default`），`layoutDir` 是布局目录（默认 `src/layouts`），`cwd` 是路径基准（默认 `process.cwd()`）。

## 注意

微信小程序下用了 `web-view` 的页面拿不到布局。插件改的是页面模板，`web-view` 的内容不在模板里。

## 破坏性更新

### 0.2.0

只发布 ESM。`exports` 里的 `require` 条件和 CJS 产物都删了，Vite 配置必须是 ESM：用 `vite.config.mts`，或者在 package.json 里设 `"type": "module"`。留在 `vite.config.ts` 又没有 `"type": "module"` 时，加载插件会报 `This package is ESM only`。

Node.js 下限提高到 `^22.22.2 || ^24.15.0 || >=26.0.0`。

`@dcloudio/vite-plugin-uni` 是 CJS 包，ESM 配置里它的 default 指向整个 `module.exports`，直接 `uni()` 会报 `uni is not a function`。用 `@uni-helper/plugin-uni`，或者自己取一次 `.default`。

布局配置还在 pages.json 的 `layout` 字段里，这一处没变。用 uni-pages 时注意它从 0.4 起不再解析 `<route>` 自定义块。

## 关联项目

- [uni-helper/vite-plugin-uni-pages](https://github.com/uni-helper/vite-plugin-uni-pages) - 使用 TypeScript 来编写 uni-app 的 pages.json
- [uni-helper/vite-plugin-uni-manifest](https://github.com/uni-helper/vite-plugin-uni-manifest) - 使用 TypeScript 来编写 uni-app 的 manifest.json
- [uni-helper/vite-plugin-uni-platform](https://github.com/uni-helper/vite-plugin-uni-platform) - 基于文件名的按平台编译插件
- [uni-helper/vite-plugin-uni-platform-modifier](https://github.com/uni-helper/vite-plugin-uni-platform-modifier) - 为属性、指令提供平台修饰符
- [uni-ku/root](https://github.com/uni-ku/root) - 解决 uni-app 无法使用根组件的问题
- [skiyee/oiyo](https://oiyo.js.org/) - uni-app 增强型工程框架

## 参与贡献

欢迎提交 Pull Request，请阅读 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解开发与提交规范。

## 许可证

[MIT](https://github.com/uni-helper/vite-plugin-uni-layouts/blob/main/LICENSE)
