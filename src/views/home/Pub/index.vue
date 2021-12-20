<template>
  <div class="pub-key-wrapper flex-between">
    <div class="left">公钥 {{ superLong(props.pub, 10) }}</div>
    <img src="../../../assets/img/copy.svg" alt="" @click="copy(props.pub)" />
  </div>
</template>

<script lang="ts" setup>
import { superLong } from '@/utils/util';
import useCopy from '@/hooks/useCopy';

const props = defineProps({
  pub: String
});

const { copy } = useCopy();
</script>

<style lang="scss">
.pub-key-wrapper {
  background: #f0f2f6;
  border-radius: 10px;
  height: 48px;
  padding: 0 10px;
  margin-bottom: 10px;
  img {
    width: 16px;
    cursor: pointer;
  }
}
</style>
