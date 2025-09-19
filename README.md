# @uni-helper/vite-plugin-uni-layouts

Vite 下 uni-app 的可定制布局框架

## 安装

```bash
pnpm i -D @uni-helper/vite-plugin-uni-layouts
```

## 使用

### 配置

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import UniLayouts from '@uni-helper/vite-plugin-uni-layouts'

export default defineConfig({
  plugins: [UniLayouts(), uni()],
})
```

### 创建布局

在 `src/layouts` 下创建布局

```vue
<!-- default.vue -->
<template>
  <slot>main</slot>
</template>
```

### 应用布局

在 pages.json 中的页面中添加 layout 配置

```json
// pages.json
{
  // ...
  "pages": [{
    "path": "pages/index/index",
    // 可选, 这是默认值
    "layout": "default"
  }]
  // ...
}
```

### 禁用布局

```json
// pages.json
{
  // ...
  "pages": [{
    "path": "pages/index/index",
    "layout": false
  }]
  // ...
}
```

### 动态布局和额外插槽

你需要先**禁用页面**的布局， 然后使用内置组件 `<uni-layout />`, 使用 `name` 属性指定布局，支持动态绑定 name、ref 等任意属性

```vue
<script setup>
const defaultName = ref('default')
</script>
<template>
  <uni-layout :name="defaultName">
    <template #header>uni-layout header</template>
    use slot
    <template #footer>uni-layout footer</template>
  </uni-layout>
</template>
```

### 通过 `ref` 引用 uni-layout 组件

layout 插件提供了一个组件 <uni-layout>，一般情况下，使用了 layout 的页面会被插入到这个组件的 slot 里。但是页面被包裹的过程是在运行时动态执行的，所以无法在使用 layout 的页面的 template 块里自定义 uni-layout 组件的 attribute。

在实际开发的时候，常常需要在 script block 中引用这个组件。这个插件有一个 ref 属性，可以让开发者在实际页面代码中引用运行时被插入到页面中的 uni-layout 组件。

只需声明一个 ref 变量 `uniLayout` 即可访问。实际使用了 Vue 的 (Template Refs)[https://vuejs.org/guide/essentials/template-refs.html#accessing-the-refs] 特性。但是在本文写作时 uni-mp-vue 的版本不够新，所以不支持使用 `useTemplateRef` 函数。

```vue
<script setup>
const uniLayout = ref()
</script>
```
或者

```vue
<script>
export default {
  onLoad() {
    console.log(this.$refs.uniLayout)
  }
}
</script>
```

#### 在页面中向 Layout 传值

实际开发中常常有这样的需求：在 Layout 里有一个 NavBar，在 NavBar 上有一个标题，这个标题的内容由具体渲染的页面来决定。这个需求可以用 ref 来实现。

在 layout 中 Expose 一个用来设定 NavBar 标题的函数：

```vue
<!-- layout.vue -->
<template>
  <navbar :title="navBarTitle"/>
</template>

<script lang="ts" setup>
import {ref, defineExpose} from "vue"

const navBarTitle = ref("")

function setNavBarTitle(val) {
  navBarTitle.value = val
}

defineExpose({ setNavBarTitle })
</script>
```

在使用 layout.vue 渲染的页面中，通过 ref 引用 uni-layout 组件，调用函数来修改标题。

```vue
<!-- page.vue -->

<script lang="ts" setup>
import {ref, onMounted} from "vue"

const uniLayout = ref(null)

onMounted(function() {
  uniLayout.value.setNavBarTitle("子页面标题")
})
</script>
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
<route lang="json">
{
  "layout": "anyLayout"
}
</route>
```
