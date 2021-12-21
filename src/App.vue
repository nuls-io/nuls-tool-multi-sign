<template>
  <el-config-provider :locale="localeLang">
    <Header
      :address="address"
      :chain="currentChain"
      :providerType="providerType"
      @switchChain="handleSwitch"
      @disconnect="disconnect"
    />
    <Home
      :address="address"
      :chain="currentChain"
      :providerType="providerType"
      :pub="pub"
      @connect="connectWallet"
      @createAccount="createAccount"
    />
  </el-config-provider>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import Header from '@/components/Header/index.vue';
import Home from './views/home/index.vue';
import useEthereum from '@/hooks/useEthereum';
import config from '@/config';
import storage from '@/utils/storage';
import { ElMessage } from 'element-plus';
import useLang from '@/hooks/useLang';

import type { AccountItem } from '@/views/home/types';

const {
  address,
  providerType,
  initProvider,
  generateAddress,
  pub,
  currentChain,
  switchChain,
  connect,
  disconnect
} = useEthereum();

const { localeLang } = useLang();

onMounted(() => {
  initProvider();
  const chain = storage.get('currentChain') || 'NULS';
  changeTheme(chain);
});

function changeTheme(chain: string) {
  const root = document.getElementById('app') as HTMLElement;
  if (chain === 'NULS') {
    root.classList.remove('nerve-chain');
  } else {
    root.classList.add('nerve-chain');
  }
}

function handleSwitch(chain: string) {
  changeTheme(chain);
  switchChain(chain);
}

async function connectWallet(type: string) {
  try {
    await connect(type);
  } catch (e) {
    ElMessage.error({
      message: e.message || e,
      duration: 2000
    });
  }
}

async function createAccount() {
  try {
    const account = await generateAddress(config.NERVE, config.NULS);
    const accountList: Omit<AccountItem, 'multi_NERVE' | 'multi_NULS'>[] =
      storage.get('accountList') || [];
    const existIndex = accountList.findIndex(v => v.pub === account.pub);
    // 原来存在就替换，找不到就push
    if (existIndex > -1) {
      accountList[existIndex] = account;
    } else {
      accountList.push(account);
    }
    storage.set('accountList', accountList);
  } catch (e) {
    ElMessage.error({
      message: e.message || e,
      duration: 2000
    });
  }
}
</script>

<style lang="scss">
@import 'assets/css/base.scss';

#app {
  background-color: #ffffff;
  width: 100%;
  height: 100%;
  position: relative;
  box-shadow: 0 3px 29px 0 rgb(178 199 217 / 29%);
  @media screen and (min-width: 1200px) {
    width: 400px;
    height: 780px;
    margin: 0 auto;
    overflow: auto;
    padding-bottom: 30px;
  }
}
</style>
