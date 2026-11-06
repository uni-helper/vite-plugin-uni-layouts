<script lang="ts" setup>
import type { LayoutKey } from 'virtual:uni-layouts'
import { useUhUniLayoutRef } from 'virtual:uni-layouts'
import { ref, watch } from 'vue'

definePage({
  layout: false,
})

const layoutName = ref<LayoutKey | boolean>('default')
const layout = useUhUniLayoutRef()

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
  <uh-uni-layout :name="layoutName">
    <template #header>
      uh-uni-layout header
    </template>
    currentLayoutName: {{ layoutName }}
    <template #footer>
      uh-uni-layout footer
    </template>
  </uh-uni-layout>
</template>
