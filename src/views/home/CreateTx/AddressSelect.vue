<template>
  <div class="address-select-wrapper" v-show="props.show">
    <div
      class="address-item"
      v-for="item in props.addressList"
      :key="item"
      @mouseover="hoverEnter"
      @mouseleave="hoverOut"
      @click="selectAddress(item)"
    >
      {{ superLong(item.address, 10) }}
      <img src="../../../assets/img/copy.svg" alt="" @click.stop="copy(item.address)" />
    </div>
    <div class="add-address theme-text" @click="addAddress">
      {{ $t('createTx.createTx7') }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { superLong } from '@/utils/util';
import useCopy from '@/hooks/useCopy';

const props = defineProps({
  show: Boolean,
  addressList: Array
});

const emit = defineEmits(['update:show', 'selectAddress', 'addAddress']);

const { copy } = useCopy();

function hoverEnter(e: Event) {
  const target = e.target as HTMLElement;
  target.classList.add('theme-text');
}

function hoverOut(e: Event) {
  const target = e.target as HTMLElement;
  target.classList.remove('theme-text');
}

function selectAddress(address: string) {
  emit('selectAddress', address);
  emit('update:show', false);
}

function addAddress() {
  emit('addAddress');
  emit('update:show', false);
}
</script>

<style lang="scss">
@import '../../../assets/css/theme.scss';

.address-select-wrapper {
  position: absolute;
  z-index: 999;
  background-color: #fff;
  width: 100%;
  border-radius: 10px;
  box-shadow: 0 0 16px 0 rgba(81, 91, 125, 0.18);
  border: 1px solid #e9ebf3;

  .address-item,
  .add-address {
    height: 55px;
    line-height: 55px;
    font-size: 15px;
    cursor: pointer;
  }

  .address-item {
    border-bottom: 1px solid #e9ebf4;
    margin-left: 20px;
    display: flex;
    justify-content: space-between;
    padding-right: 20px;
    img {
      width: 16px;
    }
  }

  .add-address {
    text-align: center;
  }
}
</style>
