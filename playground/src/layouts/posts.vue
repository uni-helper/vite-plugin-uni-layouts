<script lang="ts" setup>
import { ref } from "vue";

const footer = ref("@uni-helper");
</script>
<template>
  <view>
    <view class="header">
      posts layout
    </view>
    <view><slot>main</slot></view>
    <view>
      <slot name="footer">{{ footer }}</slot>
    </view>
  </view>
</template>

<style>
.header {
  background-color: black;
  color: #fff;
}
</style>
