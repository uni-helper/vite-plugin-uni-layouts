<script setup lang="ts">
import { ref } from 'vue'

const clicks = ref(0)

function bump() {
  clicks.value++
}

defineExpose({ clicks, bump })
</script>

<template>
  <view>
    <view>ref layout clicks: {{ clicks }}</view>
    <slot />
  </view>
</template>
