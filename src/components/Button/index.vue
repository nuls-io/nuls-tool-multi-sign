<template>
  <div class="button-wrapper">
    <el-button v-bind="$attrs" :type="props.type">{{ props.title }}</el-button>
  </div>
</template>

<script lang="ts">
export default {
  inheritAttrs: false
};
</script>

<script lang="ts" setup>
const props = defineProps({
  title: String,
  type: {
    type: String,
    default: 'primary'
  }
});
</script>

<style lang="scss">
.button-wrapper {
  margin: 35px 15px 0;
  button {
    width: 100%;
    height: 50px;
    border-radius: 10px;
  }
}
</style>
