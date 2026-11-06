<script setup lang="ts">
import { useUniLayoutRef } from 'virtual:uni-layouts'

definePage({
  layout: 'ref',
})

// the type is a contract: the layout exposes `clicks` and `bump`
const layout = useUniLayoutRef<{ clicks: number, bump: () => void }>()
</script>

<template>
  <view>
    <button @click="layout?.bump()">
      bump layout
    </button>
    <view>layout clicks: {{ layout?.clicks }}</view>
  </view>
</template>
