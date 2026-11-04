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
// 或
// import dcloudioUni from '@dcloudio/vite-plugin-uni'
// const Uni = dcloudioUni.default || dcloudioUni
import UniLayouts from '@uni-helper/vite-plugin-uni-layouts'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    UniLayouts(), // 需要在 Uni() 之前调用
    Uni(),
  ],
})
```

### 和 vite-plugin-uni-pages 一起用

页面配置放在 pages.json 里，手写很麻烦，多数项目用 [vite-plugin-uni-pages](https://github.com/uni-helper/vite-plugin-uni-pages) 生成。两个一起用时这样写：

```ts
// vite.config.mts
import Uni from '@uni-helper/plugin-uni'
import UniLayouts from '@uni-helper/vite-plugin-uni-layouts'
import UniPages from '@uni-helper/vite-plugin-uni-pages'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    UniPages({
      subPackages: [
        'src/pages-sub',
      ],
      dts: 'src/uni-pages.d.ts',
    }),
    UniLayouts(),
    Uni(),
  ],
})
```

`UniPages()` 要放在 `Uni()` 前面，这是 uni-pages 的要求。`subPackages` 和 `dts` 是它的选项，跟布局无关：`subPackages` 的目录相对 Vite root，`dts` 是生成类型声明的路径。布局插件不用额外配置，它读的就是 uni-pages 写出来的 pages.json。

pages.json 的位置是固定的：项目里有 `src` 目录时读 `src/pages.json`，否则读根目录的 `pages.json`。uni-pages 的 `outDir` 保持默认的 `src` 即可，改成别的目录后布局插件找不到页面。

想让 `definePage` 有类型提示，把 uni-pages 的 client 类型加进 tsconfig 的 `types`：

```json
{
  "compilerOptions": {
    "types": ["@dcloudio/types", "@uni-helper/vite-plugin-uni-pages/client"]
  }
}
```

### 创建布局

布局放在 `src/layouts`（`layoutDir` 选项可以换目录）。布局就是普通 Vue 组件，默认插槽放页面内容，具名插槽给页面留着位置。

```vue
<!-- src/layouts/default.vue -->
<template>
  <view class="layout">
    <view class="header">
      <slot name="header">
        默认标题
      </slot>
    </view>
    <view class="main">
      <slot>main</slot>
    </view>
    <view class="footer">
      <slot name="footer" />
    </view>
  </view>
</template>

<style>
.layout {
  padding: 24rpx;
}
</style>
```

具名插槽要靠页面上的 `<uni-layout>` 填，见[动态布局](#动态布局)。

布局名由文件路径推导，页面配置里写的是下面第二列：

| 文件 | 布局名 |
| --- | --- |
| `src/layouts/default.vue` | `default` |
| `src/layouts/posts.vue` | `posts` |
| `src/layouts/Posts.vue` | `posts` |
| `src/layouts/posts/index.vue` | `posts` |
| `src/layouts/kebab-layout.vue` | `kebabLayout` |
| `src/layouts/no-index/index.vue` | `noIndex` |
| `src/layouts/blog/posts.vue` | `blogPosts` |
| `src/layouts/the/nesting/layout.vue` | `theNestingLayout` |

规则有三条：文件名是 `index` 时取目录名；目录段和文件名从头逐段比较，重复的段只算一次，所以 `posts/posts.vue` 也是 `posts`；剩下的部分转成 camelCase，所以 `kebab-layout.vue` 是 `kebabLayout`。

### 应用布局

页面默认用 `default` 布局。换布局时在页面配置里写布局名。

用 uni-pages 就写进 `definePage` 宏，构建时宏会被删掉，配置由 uni-pages 写进 pages.json：

```vue
<!-- src/pages/posts/index.vue -->
<script setup lang="ts">
definePage({
  layout: 'posts',
})
</script>

<template>
  <view>帖子列表</view>
</template>
```

没装 uni-pages 就直接写 pages.json：

```json
{
  "pages": [
    {
      "path": "pages/posts/index",
      "layout": "posts"
    }
  ]
}
```

布局名写错不会报错，页面会按没有布局渲染，排查时先核对布局名。

### 禁用布局

`layout: false` 表示这个页面不套布局，模板原样输出。用 uni-pages 时写进 `definePage`：

```vue
<script setup lang="ts">
definePage({
  layout: false,
})
</script>
```

手写 pages.json 时写法一样：

```json
{
  "path": "pages/index/index",
  "layout": false
}
```

### 动态布局

页面禁用布局之后，用内置组件 `<uni-layout>` 指定布局。下面的例子里 `layout: false` 和 `<uni-layout>` 缺一个都不行：

```vue
<script setup lang="ts">
import { ref } from 'vue'

definePage({
  layout: false,
})

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

`name` 写布局名，也支持绑定变量；`<uni-layout>` 上的其他属性会透传给布局组件。小程序端展开成每个布局的 `v-if` / `v-else-if` 链，H5 端生成一个 `<component :is>`。

### ref

在页面的 script setup 里声明一个叫 `uniLayout` 的 ref，插件会给包裹页面的布局组件加上 `ref="uniLayout"`，拿到的就是布局组件实例：

```vue
<script setup lang="ts">
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
