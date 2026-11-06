<script lang="ts" setup>
import { useLayoutRef } from 'virtual:uni-layouts'
import { ref, watch } from 'vue'

definePage({
  layout: false,
})

const layoutName = ref<string | boolean>('default')
const layout = useLayoutRef()

// the mini program does not clear the ref when the layout disappears
watch(layoutName, () => {
  layout.value = null
})

function handleSwitch() {
  if (layoutName.value === 'default') {
    layoutName.value = 'posts'
  }
  else if (layoutName.value === 'posts') {
    layoutName.value = false
  }
  else {
    layoutName.value = 'default'
  }
}
</script>

<template>
  <button @click="handleSwitch">
    switch
  </button>
  <view>layout: {{ layout ? 'mounted' : 'none' }}</view>
  <uni-layout :name="layoutName">
    <template #header>
      uni-layout header
    </template>
    currentLayoutName: {{ layoutName }}
    <template #footer>
      uni-layout footer
    </template>
  </uni-layout>
</template>
