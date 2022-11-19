<template>
  <view>
    <view class="header">
      <slot>header</slot>
    </view>
    <view><slot>main</slot></view>
    <view>
      <slot>footer</slot>
    </view>
  </view>
</template>

<style>
.header {
  background-color: black;
  color: #fff;
}
</style>
