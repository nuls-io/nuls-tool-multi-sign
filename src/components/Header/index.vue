<template>
  <div class="header-bar flex-between pd-15">
    <img class="logo" src="../../assets/img/logo.svg" alt="" />
    <!--    <template v-if="props.chain === 'NULS'">
          <img class="logo" src="../../assets/img/logo.svg" alt="" />
        </template>
        <template v-else>
          <img class="nerve-logo" src="../../assets/img/nervelogo.svg" alt="" />
        </template>-->
    <div class="right flex-between">
      <div
        class="account-wrap theme-bg flex-center"
        v-if="props.address && props.providerType"
      >
        <div class="flex-center" @click.stop="showSwitchChain">
          <img class="chain-logo" :src="chainList[props.chain].logo" />
          <el-icon>
            <caret-bottom />
          </el-icon>
        </div>

        <ChainList
          v-model:show="isShowSwitchChain"
          :chainList="chainList"
          :current="props.chain"
          @change="switchChain"
        />
        <span class="theme-text" @click.stop="showAccount = true">
          {{ superLong(props.address, 6) }}
        </span>
      </div>
      <div class="lang" @click="switchLang">{{ lang }}</div>
    </div>
    <el-dialog
      v-model="showAccount"
      custom-class="account-dialog"
      title=""
      :show-close="false"
      width="90%"
      :append-to-body="false"
    >
      <div class="close">
        <img
          class="close-icon"
          src="../../assets/img/close.svg"
          alt=""
          @click="showAccount = false"
        />
      </div>
      <div class="content">
        <div class="top flex-between">
          <div class="left flex-center">
            <span>{{ superLong(props.address, 6) }}</span>
            <img
              src="../../assets/img/copy.svg"
              alt=""
              @click="copy(props.address)"
            />
          </div>
          <div class="right" @click="disconnect">
            {{ $t('public.public4') }}
          </div>
        </div>
        <div
          class="bottom flex-center"
          @click="toUrl(props.chain, props.address)"
        >
          <img src="../../assets/img/view.svg" alt="" />
          <span>{{ $t('public.public5') }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { superLong, toUrl } from '@/utils/util';
import ChainList from '@/components/ChainList/index.vue';
import NULSLogo from '@/assets/img/NULS.png';
import NERVELogo from '@/assets/img/Nerve.png';
import useLang from '../../hooks/useLang';
import useCopy from '@/hooks/useCopy';

const props = defineProps<{
  address: string;
  chain: string;
  providerType: string;
}>();
const emit = defineEmits<{
  (e: 'switchChain', chain: string): void;
  (e: 'disconnect'): void;
}>();
// const props = defineProps({
//   address: String,
//   chain: String,
//   providerType: String
// });
// const emit = defineEmits(['switchChain', 'disconnect']);

const chainList = {
  NULS: {
    logo: NULSLogo,
    label: 'NULS'
  },
  NERVE: {
    logo: NERVELogo,
    label: 'NERVE'
  }
};

const isShowSwitchChain = ref(false);

function showSwitchChain() {
  isShowSwitchChain.value = true;
}

function switchChain(chain: string) {
  if (chain === props.chain) return;
  emit('switchChain', chain);
}

const showAccount = ref(false);

const { copy } = useCopy();

function disconnect() {
  emit('disconnect');
  showAccount.value = false;
}

const { lang, switchLang } = useLang();
</script>

<style lang="scss">
@import '../../assets/css/theme';

.header-bar {
  height: 64px;

  .logo {
    width: 75px;
  }

  .nerve-logo {
    width: 100px;
  }

  .account-wrap {
    padding: 0 15px;
    height: 32px;
    border-radius: 15px;
    cursor: pointer;
    position: relative;

    .chain-logo {
      width: 25px;
    }

    .el-icon {
      font-size: 12px;
      margin: 0 5px 0 2px;
    }
  }

  .account-dialog {
    .el-dialog__header {
      display: none;
    }

    .el-dialog__body {
      padding: 20px 20px 40px;
    }

    .close {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 15px;

      img {
        width: 14px;
        cursor: pointer;
      }
    }

    .content {
      border: 1px solid #aab2c9;
      border-radius: 10px;
      padding: 15px;

      img {
        width: 16px;
        cursor: pointer;
      }

      .top {
        margin-bottom: 10px;

        .left {
          span {
            font-size: 18px;
            margin-right: 10px;
          }
        }

        .right {
          min-width: 50px;
          height: 25px;
          line-height: 23px;
          color: #f35757;
          border: 1px solid #f35858;
          border-radius: 8px;
          text-align: center;
          cursor: pointer;
        }
      }

      .bottom {
        cursor: pointer;

        img {
          margin-right: 5px;
        }
      }
    }
  }

  .lang {
    margin-left: 5px;
    cursor: pointer;
  }
}
</style>
