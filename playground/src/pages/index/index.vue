<!--
  * @Date: 2023-07-18
  * @Any: any comment
 -->
<script setup lang="ts">
import { ref } from "vue";
const title = ref<string>("Hello");
const popShow = ref<boolean>(true);
function handleChange() {
  popShow.value = !popShow.value;
}
</script>

<template>

  <view class="content">
    <image class="logo" src="/static/logo.png" />
    <view class="text-area">
      <text class="title">{{ title }}</text>
    </view>
    <button @click="handleChange">change page meta</button>
    <view class="long-block"></view>
  </view>
</template>

<style>
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.logo {
  height: 200rpx;
  width: 200rpx;
  margin-top: 200rpx;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 50rpx;
}

.text-area {
  display: flex;
  justify-content: center;
}

.title {
  font-size: 36rpx;
  color: #8f8f94;
}
.long-block {
  height: 2000rpx;
}
</style>
