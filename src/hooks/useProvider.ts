import { reactive, toRefs, onMounted, onUnmounted } from 'vue';
import nerve from 'nerve-sdk-js';
import { isBeta } from '@/utils/util';
import config from '@/config';
import storage from '@/utils/storage';
import type { AccountItem } from '@/views/home/types';

interface State {
  address: string;
  pub: string;
  chainId: number;
  currentChain: string;
  isWrongChain: boolean;
}

export default function useProvider(autoInit = false) {
  const state = reactive<State>({
    address: '',
    pub: '',
    currentChain: '',
    isWrongChain: false,
    chainId: 0
  });

  async function initProvider() {
    if (window.NaboxWallet?.nai) {
      if (window.NaboxWallet.nai?.selectedAddress) {
        const address = window.NaboxWallet.nai.selectedAddress;
        checkAddress(address);
        if (!state.address) {
          await switchToNULS();
        }
        addListener();
      } else {
        connect();
      }
    }
  }

  function checkAddress(address: string) {
    console.log(address, '23424');
    if (isBeta) {
      if (address.startsWith('tNULS')) {
        state.currentChain = 'NULS';
      } else if (address.startsWith('TNVT')) {
        state.currentChain = 'NERVE';
      } else {
        state.currentChain = '';
      }
    } else {
      if (address.startsWith('NULS')) {
        state.currentChain = 'NULS';
      } else if (address.startsWith('NERVE')) {
        state.currentChain = 'NERVE';
      } else {
        state.currentChain = '';
      }
    }
    if (state.currentChain) {
      state.address = address;
      state.isWrongChain = false;
      setTimeout(() => {
        state.chainId = window.NaboxWallet.nai.chainId;
      });
      window.NaboxWallet.nai.getPub({ address }).then((pub: string) => {
        state.pub = pub;
        createAccount(pub);
      });
    } else {
      state.address = '';
      state.pub = '';
      state.isWrongChain = true;
      state.chainId = 0;
    }
  }

  async function createAccount(pub: string) {
    const accountList: Omit<AccountItem, 'multi_NERVE' | 'multi_NULS'>[] =
      storage.get('accountList') || [];
    const existIndex = accountList.findIndex(v => v.pub === pub);
    // 原来存在就替换，找不到就push
    if (existIndex === -1) {
      const account = generateAddress(pub);
      accountList.push(account);
      storage.set('accountList', accountList);
    }
  }

  function generateAddress(pub: string) {
    const NERVEAddress = nerve.getAddressByPub(
      config.NERVE.chainId,
      1,
      pub,
      config.NERVE.prefix
    );
    const NULSAddress = nerve.getAddressByPub(
      config.NULS.chainId,
      1,
      pub,
      config.NULS.prefix
    );
    const account = {
      address: {
        NERVE: NERVEAddress,
        NULS: NULSAddress
      },
      pub
    };
    return account;
  }

  function addListener() {
    window.NaboxWallet.nai.on('accountsChanged', handleAccountChange);
  }

  function handleAccountChange(accounts: string[]) {
    checkAddress(accounts[0]);
  }

  async function connect() {
    if (!window.NaboxWallet?.nai) {
      window.open('https://nabox.io');
      return;
    }
    await window.NaboxWallet.nai.createSession();
    const address = window.NaboxWallet.nai.selectedAddress;
    checkAddress(address);
    if (!state.address) {
      await switchToNULS();
    }
  }

  function disconnect() {
    state.address = '';
    state.pub = '';
    state.currentChain = '';
  }

  async function switchToNULS() {
    await switchChain(isBeta ? 2 : 1);
  }

  async function switchChain(chainId: number) {
    await window.NaboxWallet.nai.switchChain({
      chainId
    });
  }

  onMounted(() => {
    if (autoInit) {
      initProvider();
    }
  });
  onUnmounted(() => {
    window.NaboxWallet?.nai?.off('accountsChanged', handleAccountChange);
  });

  return {
    ...toRefs(state),
    initProvider,
    connect,
    disconnect,
    switchToNULS,
    switchChain
  };
}
