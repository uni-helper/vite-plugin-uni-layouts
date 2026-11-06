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

> **请考虑持续[赞助](https://github.com/ModyQyW/sponsors)以维持该项目的持续健康发展，非常感谢！🙏**

## 安装

```bash
pnpm i -D @uni-helper/vite-plugin-uni-layouts
```

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
    UniLayouts(),
    Uni(),
  ],
})
```

### 和 vite-plugin-uni-pages 一起用

默认地，页面配置放在 `pages.json` 里，需要手动更新，比较麻烦。推荐使用 [@uni-helper/vite-plugin-uni-pages](https://github.com/uni-helper/vite-plugin-uni-pages) 自动扫描并生成 `pages.json`。

```ts
// vite.config.mts
import Uni from '@uni-helper/plugin-uni'
import UniLayouts from '@uni-helper/vite-plugin-uni-layouts'
import UniPages from '@uni-helper/vite-plugin-uni-pages'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    UniPages(),
    UniLayouts(),
    Uni(),
  ],
})
```

`@uni-helper/vite-plugin-uni-pages` 还提供了 `definePage`。要支持类型提示，需要设置 `tsconfig.json`。

```json
{
  "compilerOptions": {
    "types": ["@dcloudio/types", "@uni-helper/vite-plugin-uni-pages/client"]
  }
}
```

更多内容请查看 `@uni-helper/vite-plugin-uni-pages` [仓库](https://github.com/uni-helper/vite-plugin-uni-pages)或[文档](https://uni-helper.js.org/vite-plugin-uni-pages)。

### 创建布局

默认情况下，布局文件需要放在 `src/layouts` 目录下，使用 `src/layouts/default.vue` 作为默认布局。一个布局文件就是一个 Vue 组件。

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

布局名由文件路径推导。

| 文件 | 布局名 |
| --- | --- |
| `src/layouts/default.vue` | `default` |
| `src/layouts/posts.vue` | `posts` |
| `src/layouts/Posts.vue` | `posts` |
| `src/layouts/posts/index.vue` | `posts` |
| `src/layouts/posts/posts.vue` | `posts` |
| `src/layouts/kebab-layout.vue` | `kebabLayout` |
| `src/layouts/no-index/index.vue` | `noIndex` |
| `src/layouts/blog/posts.vue` | `blogPosts` |
| `src/layouts/the/nesting/layout.vue` | `theNestingLayout` |

自 v0.3 起，没有布局目录（`layoutDir` 写错、目录为空）时插件会警告一次，所有页面都不套布局。页面写的布局名不存在时也会警告，只有这一页不套布局。

要指定布局文件所在目录，需要调整 `layoutDir` 选项，详见[插件配置](#插件配置)。

要使用具名插槽，必须禁用默认布局并使用 `<uh-uni-layout>` 组件，详见[动态布局](#动态布局)。

### 指定布局

页面默认用 `default` 布局。

如果不使用 `@uni-helper/vite-plugin-uni-pages`，需要手动更新 `pages.json` 来使用指定布局。

```jsonc
{
  "pages": [
    {
      "path": "pages/index/index"
      // 默认使用 default 布局
    },
    {
      "path": "pages/posts/index",
      "layout": "posts" // 使用 posts 布局
    },
    {
      "path": "pages/users/index",
      "layout": false // 不使用任何布局
    }
  ]
}
```

如果使用 `@uni-helper/vite-plugin-uni-pages`，可以写入 `definePage` 宏，构建时宏会被删掉并自动更新 `pages.json`。

```vue
<!-- src/pages/posts/index.vue -->
<script setup lang="ts">
definePage({
  layout: 'posts', // 使用 posts 布局
  // layout: false, // 不使用任何布局
})
</script>

<template>
  <view>帖子列表</view>
</template>
```

### 条件编译

自 v0.3 起，通过条件编译，同一个页面可以给不同平台配不同的 `layout`。

如果不使用 `@uni-helper/vite-plugin-uni-pages`，需要手动更新 `pages.json`，详见 [条件编译处理多端差异](https://uniapp.dcloud.net.cn/tutorial/platform.html)。

```json
{
  "pages": [
    // #ifdef H5
    { "path": "pages/index/index", "layout": "home" },
    // #endif
    // #ifndef H5
    { "path": "pages/index/index", "layout": "default" },
    // #endif
    { "path": "pages/about/about" }
  ]
}
```

如果使用 `@uni-helper/vite-plugin-uni-pages`，可以使用 `definePage` 的函数式写法。

```vue
<script setup lang="ts">
definePage(({ define }) =>
  define({ layout: 'default' })
    .ifdef('h5', { layout: 'home' }),
)
</script>
```

### 动态布局

页面写了 `layout: false` 之后，插件不再自动包裹页面。想套布局或使用具名插槽，用内置组件 `<uh-uni-layout>` 指定已有布局；不需要布局的页面直接写内容就行。

布局示例如下：

```vue
<!-- src/layouts/named-slots.vue -->
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

动态布局页面示例如下：

```vue
<script setup lang="ts">
import { ref } from 'vue'

definePage({
  layout: false, // 禁用默认布局
})

const name = ref('namedSlots')
</script>

<template>
  <!-- 指定使用 src/layouts/named-slots.vue 作为页面布局 -->
  <uh-uni-layout :name="name">
    <template #header>
      header
    </template>
    页面内容
    <template #footer>
      footer
    </template>
  </uh-uni-layout>
</template>
```

`<uh-uni-layout>` 组件的 `name` prop 写布局名，也支持绑定变量，其它属性会透传给布局组件。

### 读取布局实例

布局里用 `defineExpose` 暴露方法，页面拿到实例就能直接调。

```vue
<!-- src/layouts/default.vue -->
<script setup lang="ts">
function toast(message: string): void {
  // ...
}

defineExpose({ toast })
</script>
```

自 v0.3 起可以用 `useUhUniLayoutRef` 拿到实例。从虚拟模块 `virtual:uni-layouts` 导入，变量名随意，泛型写布局暴露的接口。

```vue
<script setup lang="ts">
import { useUhUniLayoutRef } from 'virtual:uni-layouts'

const uniLayout = useUhUniLayoutRef<{ toast: (message: string) => void }>()

function handleShowToast() {
  uniLayout.value?.toast('hello')
}
</script>
```

插件读页面的 `<script setup>`，给包裹标签加一个和变量名一致的 ref，这里是 `ref="uniLayout"`。类型来自插件生成的 `uni-layouts.d.ts`，由 `dts` 选项控制（默认开启）。没生成时 `import` 会报找不到模块，构建不受影响，也可以自己声明，见[插件配置](#插件配置)。

值是布局挂载之后才有的，`onLoad` 里读取会拿到 `null`。用 `onMounted` / `onReady`，或者 `watch(uniLayout, ...)`。模板里写 `uniLayout?.toast('...')` 也可以，模板会自动解包，有值了会重新渲染。

v0.3 以前只能写 `const uniLayout = ref()`，插件在 setup 顶层找这个名字，给包裹标签加 `ref="uniLayout"`。该写法在 v0.3 仍然可用，但已经不再推荐，原因参考 [Issue #41](https://github.com/uni-helper/vite-plugin-uni-layouts/issues/41)。

还有几个边界需要注意：

- `useUhUniLayoutRef` 要写在页面 setup 顶层，包在函数或条件里不算 setup 绑定，插件无法识别。
- `layout: false` 的页面不套包裹，ref 加在自己写的 `<uh-uni-layout>` 上，效果一样。标签上已经有 `ref` 时以你写的为准。
- Options API 不受支持，对应页面没有等价的自动绑定。
- 小程序端动态布局切到不渲染布局的分支后，ref 里还是上一个实例，H5 会置空。要两端一致，见[注意](#注意)。

没有组件上下文的纯 JS 模块（比如 `utils.js`）调不到布局实例，`useUhUniLayoutRef` 只能在页面或组件的 setup 里用。跨页提示放到模块里的状态上，让布局去渲染。

```ts
// src/utils/toast.ts
import { ref } from 'vue'

const messages = ref<string[]>([])

export function toast(message: string) {
  messages.value.push(message)
}
```

布局渲染这份状态：

```vue
<!-- src/layouts/default.vue -->
<script setup lang="ts">
import { messages } from '@/utils/toast'
</script>

<template>
  <view class="layout">
    <view v-for="message in messages" :key="message" class="toast">
      {{ message }}
    </view>
    <slot />
  </view>
</template>
```

页面直接 `import toast`，不需要经过布局实例：

```vue
<!-- src/pages/index/index.vue -->
<script setup lang="ts">
import { toast } from '@/utils/toast'

function handleSave() {
  toast('保存成功')
}
</script>

<template>
  <view>
    <button @click="handleSave">
      保存
    </button>
  </view>
</template>
```

工具函数里同样可以直接调用，比如请求失败时 `toast('请求失败')`。

### page-meta

`<page-meta>` 只有作为页面第一个节点才生效，被布局组件包住就会失效。自 v0.3 起，插件包裹页面时会把它提出来，放到布局组件前面。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const locked = ref(false)
</script>

<template>
  <page-meta :page-style="`overflow:${locked ? 'hidden' : 'visible'}`" />
  <view class="content">
    页面内容
  </view>
</template>
```

上面的页面最终渲染成 `<page-meta>` 在外面、布局组件在里面，打开弹窗时用 `page-style` 控制页面滚动。

插件只处理页面模板顶层的 `<page-meta>`，写在其它节点里面的不受影响，也不会生效。`layout: false` 的页面模板不需要处理，页面本身就是根节点，`<page-meta>` 写在第一个位置即可。

### 开发时热更新

改 pages.json 里某个页面的 `layout`，只有这一页重新编译，其他页面不动（0.3 起）。

在布局目录里新增或删除 `.vue`，插件会重扫布局，页面用上新布局，删掉的布局从页面模板里去掉。

`vite build --watch` 没有 dev server，pages.json 的变化只更新插件记下的页面列表，下一次构建生效。

## 插件配置

```ts
interface UserOptions {
  /**
   * 页面没有自己的 `layout` 时使用的布局名
   * @default 'default'
   */
  layout?: string

  /**
   * 布局文件所在目录，相对 `cwd`
   * @default 'src/layouts'
   */
  layoutDir?: string

  /**
   * 路径基准
   * @default process.cwd()
   */
  cwd?: string

  /**
   * 生成 `useUhUniLayoutRef` 的类型声明
   * 为 true 时写到 pages.json 同目录的 `uni-layouts.d.ts`
   * 为 string 时作为自定义路径，相对 `cwd`
   * @default true
   * @since 0.3.0
   */
  dts?: boolean | string
}
```

### 配置示例

```ts
// vite.config.mts
import UniLayouts from '@uni-helper/vite-plugin-uni-layouts'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    UniLayouts({
      layout: 'default',
      layoutDir: 'src/layouts',
      dts: 'src/types/uni-layouts.d.ts',
    }),
  ],
})
```

### 声明文件

`dts` 默认开启，启动 dev server 或构建时写 `uni-layouts.d.ts`，位置跟 pages.json 同目录（有 `src` 时是 `src/uni-layouts.d.ts`）。传字符串表示相对 `cwd` 的路径，`false` 关掉。生成的声明可以直接提交进仓库。

tsconfig 的 `include` 要覆盖 `*.d.ts`，例如 `src/**/*.d.ts`。只写了 `src/**/*.ts`、`src/**/*.vue` 的项目，文件写得出来但类型不生效，把生成路径加进 `include` 即可。

关掉之后 `useUhUniLayoutRef` 在编辑器里没有类型，`import` 会报错（构建不受影响），需要自己声明：

```ts
declare module 'virtual:uni-layouts' {
  export function useUhUniLayoutRef<T = Record<string, any>>(): import('vue').ShallowRef<T | null>
}
```

### 完整类型定义

请查看 [types.ts](https://github.com/uni-helper/vite-plugin-uni-layouts/blob/main/src/types.ts) 获取完整定义。

## 注意

微信小程序下用了 `web-view` 的页面拿不到布局。插件改的是页面模板，`web-view` 的内容不在模板里。

小程序端 `useUhUniLayoutRef` 拿到的实例不会自动清空：动态布局切到不渲染布局的分支（`v-else`，或者 `<uh-uni-layout>` 上的 `v-if` 变成 false）之后，ref 里还是上一个实例。H5 会置空。要两端一致，跟着切换条件清一下：

```ts
watch(layoutName, () => {
  uniLayout.value = null
})
```

布局重新挂载后 ref 会再次填上。

## 常见问题

### 页面没有套上布局，也没有警告

先确认页面配置：`layout: false` 的页面本来就不套布局。再确认路径，pages.json 里的 `path` 要和文件位置对上，插件只处理 `.vue` 和 `.nvue`。

用到 `web-view` 的页面拿不到布局，见[注意](#注意)。

### 提示布局不存在

页面写的布局名在布局目录里找不到，插件会打一条 warning，页面按没有布局渲染。核对页面配置里的 `layout` 和 [`layoutDir`](#插件配置) 选项，或者补上对应的布局文件。

页面没写 `layout`、默认布局又不存在时，提示会说明用的是默认布局。补一个 `default.vue`，或者把 [`layout`](#插件配置) 选项改成已有的布局名。

### useUhUniLayoutRef 一直是 null

检查三件事：页面有没有被套布局（`layout: false` 的页面要在自己写的 `<uh-uni-layout>` 上放 ref）、变量是不是写在 setup 顶层、读取的时机是不是太早（`onLoad` 拿不到，用 `onMounted` 或 `onReady`）。

### 找不到模块 virtual:uni-layouts

多半是 `dts` 关掉了，或者生成的 `uni-layouts.d.ts` 不在 tsconfig 的 `include` 里。怎么改见[声明文件](#声明文件)。

### 动态布局不生效

`<uh-uni-layout>` 只有写在 `layout: false` 的页面模板顶层才会被插件改写。页面仍然套着静态布局时，标签原样留在模板里，Vue 会提示找不到组件，布局不渲染。给页面加上 `layout: false`，见[动态布局](#动态布局)。

标签包在 `<view>` 之类的元素里也不会被改写，插件对这两种情况都会 warning。

### 页面里有 uni-layout 时编译报错

v0.3 起标签改名为 `<uh-uni-layout>`。旧名字 `uni-layout` 是 uni-app H5 的内置自定义元素，编译器会把它当普通元素，具名插槽的 `<template>` 永远拿不到 codegen，于是 H5 报 `Cannot read properties of undefined (reading 'type')`（dev 下是 `Codegen node is missing for element/if/for node`）。把标签改成 `<uh-uni-layout>` 即可，插件遇到旧标签会 warning 提醒。

## 破坏性更新

### 0.3

动态布局标签 `<uni-layout>` 改名为 `<uh-uni-layout>`，`useUniLayoutRef` 改名为 `useUhUniLayoutRef`，旧名字不再被识别。旧标签名是 uni-app H5 的内置自定义元素，留在页面里会让 H5 编译失败；插件发现旧标签时会 warning 提醒改名。`virtual:uni-layouts`、生成的 `uni-layouts.d.ts`、注册的 `layout-{name}-uni` 组件名和旧的 `const uniLayout = ref()` 写法都没变。

套布局的页面，`<page-meta>` 会被提到布局组件外面。以前写在布局包裹页面里的 `<page-meta>` 不生效，升级后这些配置会开始起作用。

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
