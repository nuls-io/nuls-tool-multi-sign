<template>
  <div class="pub-item">
    <div class="input-wrapper">
      <el-input
        :placeholder="$t('createAddress.createAddress3')"
        :model-value="pub"
        @input="handleInput"
      ></el-input>
      <img
        @click="delItem(index)"
        class="minus"
        src="../../../assets/img/del.svg"
        alt=""
        v-if="props.showDelIcon"
      />
    </div>
    <p class="label-text" v-if="pub">
      {{ $t('createAddress.createAddress5') }}
      <template v-if="address">
        {{ superLong(address, 12) }}
      </template>
      <template v-else>
        <span class="invalid-pub">Invalid pub</span>
      </template>
    </p>
  </div>
</template>

<script lang="ts" setup>
import { superLong } from '@/utils/util';

const props = defineProps({
  pub: String,
  chain: String,
  showDelIcon: Boolean,
  address: String
});

const emit = defineEmits(['del', 'update:pub']);

function handleInput(e: string) {
  emit('update:pub', e);
}

function delItem(index: number) {
  emit('del', index);
}
</script>

<style lang="scss">
.pub-item {
  margin-bottom: 15px;

  .el-input .el-input__inner {
    padding-right: 40px;
  }

  p {
    line-height: 1;
    margin-top: 8px;
    font-size: 13px;
  }
  .invalid-pub {
    color: #f56c6c;
    font-size: 12px;
  }
}
</style>
