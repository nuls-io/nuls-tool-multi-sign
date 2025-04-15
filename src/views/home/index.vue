<template>
  <div class="main-wrapper pd-15">
    <template v-if="props.isWrongChain">
      <div class="connect-wallet">
        <Button
          :title="$t('public.public8')"
          @click="emit('switchToNULS')"
        ></Button>
      </div>
    </template>
    <template v-else-if="!props.address">
      <div class="connect-wallet">
        <Button :title="$t('public.public7')" @click="emit('connect')"></Button>
      </div>
    </template>
    <template v-else>
      <CopyWrapper :prefix="$t('public.public3')" :content="props.pub" />
      <el-tabs v-model="currentTab" stretch @tab-click="tabChange">
        <el-tab-pane :label="$t('tab.Sign')" :name="Tabs.Sign">
          <Sign
            :chain="props.chain"
            ref="SignRef"
            :address="props.address"
            :pub="props.pub"
          />
        </el-tab-pane>
        <el-tab-pane
          :label="$t('tab.CreateAddress')"
          :name="Tabs.CreateAddress"
        >
          <CreateAddress
            :chain="props.chain"
            :pub="props.pub"
            ref="CreateAddressRef"
          />
        </el-tab-pane>
        <el-tab-pane :label="$t('tab.CreateTx')" :name="Tabs.CreateTx">
          <CreateTx
            :chain="props.chain"
            :pub="props.pub"
            @addAddress="toCreateAddress"
            ref="CreateTxRef"
          />
        </el-tab-pane>
      </el-tabs>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { nextTick, ref, watch } from 'vue';
import Button from '@/components/Button/index.vue';
import CopyWrapper from '@/components/CopyWrapper/index.vue';
import Sign from './Sign/index.vue';
import CreateAddress from './CreateAddress/index.vue';
import CreateTx from './CreateTx/index.vue';
import { Tabs } from './types';

const props = defineProps<{
  address: string;
  pub: string;
  chain: string;
  isWrongChain: boolean;
}>();

const emit = defineEmits<{
  (e: 'createAccount'): void;
  (e: 'connect'): void;
  (e: 'switchToNULS'): void;
}>();

watch(
  () => [props.chain, props.address],
  () => {
    nextTick(resetFields);
  }
);

const currentTab = ref(Tabs.Sign);

const SignRef = ref<InstanceType<typeof Sign>>();
const CreateAddressRef = ref<InstanceType<typeof CreateAddress>>();
const CreateTxRef = ref<InstanceType<typeof CreateTx>>();
function tabChange() {
  // console.log(item.paneName);
  // const tab = item.paneName;
  resetFields();
}

function toCreateAddress() {
  currentTab.value = Tabs.CreateAddress;
}

function resetFields() {
  SignRef.value?.resetFields();
  CreateAddressRef.value?.resetFields();
  CreateTxRef.value?.resetFields();
}
</script>

<style lang="scss">
.main-wrapper {
  //
}
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
