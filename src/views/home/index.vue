<template>
  <div class="main-wrapper pd-15">
    <template v-if="!props.providerType">
      <ConnectWallet @connect="type => emit('connect', type)" />
    </template>
    <template v-else-if="!props.address">
      <Button :title="$t('public.public1')" @click="createAccount" />
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
import ConnectWallet from './ConnectWallet/index.vue';
import Button from '@/components/Button/index.vue';
import CopyWrapper from '@/components/CopyWrapper/index.vue';
import Sign from './Sign/index.vue';
import CreateAddress from './CreateAddress/index.vue';
import CreateTx from './CreateTx/index.vue';
import { Tabs } from './types';

const props = defineProps<{
  providerType: string;
  address: string;
  pub: string;
  chain: string;
}>();

// const emit = defineEmits(['createAccount', 'connect']);
const emit = defineEmits<{
  (e: 'createAccount'): void;
  (e: 'connect'): void;
}>();

watch(
  () => [props.chain, props.address],
  () => {
    nextTick(resetFields);
  }
);

function createAccount() {
  emit('createAccount');
}

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
</style>
