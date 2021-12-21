<template>
  <div class="connect-wallet">
    <span class="title">Connect wallet</span>
    <div class="providers-wrap">
      <p
        v-for="item in providerList"
        :key="item.name"
        @click="connectProvider(item.provider)"
      >
        <img :src="item.src" alt="" />
        {{ item.name }}
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { providerList } from '@/hooks/useEthereum';
import { ElMessage } from 'element-plus';

const emit = defineEmits(['connect']);

function connectProvider(provider: string) {
  if (!window[provider]) {
    ElMessage.warning({ message: 'No provider was found' });
    return;
  }
  emit('connect', provider);
}
</script>

<style lang="scss">
.connect-wallet {
  //width: 96%;
  margin: 0 auto;

  .title {
    font-size: 20px;
    font-weight: 600;
    line-height: 2;
    margin-bottom: 5px;
    display: inline-block;
    margin-top: -10px;
  }

  .providers-wrap {
    display: flex;
    flex-wrap: wrap;
  }

  p {
    width: 50%;
    display: flex;
    align-items: center;
    height: 40px;
    padding: 0 15px;
    margin-bottom: 15px;
    border-radius: 16px;
    cursor: pointer;
    color: #a1a4b1;
    font-size: 14px;
    font-weight: 600;
    border: 1px solid transparent;

    &:hover {
      border-color: #5bcaf9;
      color: #333;
    }

    img {
      width: 28px;
      height: 28px;
      margin-right: 10px;
    }

    @media screen and (max-width: 400px) {
      font-size: 12px;
      padding: 0 8px;
      img {
        width: 22px;
        height: 22px;
      }
    }
  }
}
</style>
