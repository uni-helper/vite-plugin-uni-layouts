<template>
  <view>
    <view><slot>main</slot></view>
    <view class="footer">
      [Footer Layouts]
    </view>
  </view>
</template>

<style scoped>
.footer {
  text-align: center;
  margin-top: 20rpx;
  opacity: 0.5;
  cursor: pointer;
}
.footer:hover {
  opacity: 1;
}
</style>