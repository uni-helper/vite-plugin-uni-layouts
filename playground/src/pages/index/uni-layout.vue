<script lang="ts" setup>
import { ref } from 'vue';

const layoutName = ref<string | boolean>('default')
function handleSwitch() {
  if (layoutName.value === 'default') {
    layoutName.value = 'posts'
  } else if (layoutName.value === 'posts') {
    layoutName.value = false
  } else {
    layoutName.value = 'default'
  }
}
</script>

<template>
  <button @click="handleSwitch"> switch </button>
  <uni-layout :name="layoutName">
    <template #header>uni-layout header</template>
    currentLayoutName: {{ layoutName }}
    <template #footer>uni-layout footer</template>
  </uni-layout>
</template>

<route lang="json">
{
  "layout": false
}
</route>
