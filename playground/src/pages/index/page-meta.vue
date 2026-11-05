<script lang="ts" setup>
import { ref } from 'vue'

// 页面用了默认布局，page-meta 仍要能生效：插件会把它提到 <layout-default-uni> 外面
const locked = ref(false)
</script>

<template>
  <page-meta :page-style="`overflow:${locked ? 'hidden' : 'visible'}`" />
  <view>
    <button @click="locked = !locked">
      {{ locked ? 'unlock scroll' : 'lock scroll' }}
    </button>
    <view v-for="i in 40" :key="i" class="row">
      row {{ i }}
    </view>
  </view>
</template>

<style>
.row {
  padding: 20rpx;
  border-bottom: 1px solid #eee;
}
</style>
