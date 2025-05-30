<template>
  <div class="sign-wrapper">
    <el-input
      v-model.trim="txHex"
      :rows="3"
      type="textarea"
      :placeholder="$t('sign.sign1')"
    />
    <div class="content" v-loading="loading">
      <template v-if="errorMsg">
        <div class="hex-error">{{ $t('tip.tip9') }}</div>
      </template>
      <template v-if="txInfo.from">
        <div class="tx-info">
          <h5>{{ $t('sign.sign2') }}</h5>
          <p>
            <span class="label-text">{{ $t('sign.sign3') }}</span>
            <span>{{ $t('type.type' + txInfo.type) }}</span>
          </p>
          <p>
            <span class="label-text">{{ $t('sign.sign5') }}</span>
            <span>{{ txInfo.amount }} {{ txInfo.symbol }}</span>
          </p>
          <p>
            <span class="label-text">{{ $t('sign.sign6') }}</span>
            <span class="link" @click="toUrl(props.chain, txInfo.from)">
              {{ superLong(txInfo.from, 12) }}
            </span>
          </p>
          <p>
            <span class="label-text">{{ $t('sign.sign7') }}</span>
            <span class="link" @click="toUrl(props.chain, txInfo.to)">
              {{ superLong(txInfo.to, 12) }}
            </span>
          </p>
        </div>
        <template v-if="!generalTx">
          <div class="sign-info">
            <h5>{{ $t('sign.sign8') }}</h5>
            <p>
              <span class="label-text">{{ $t('sign.sign9') }}</span>
              <span>{{ signInfo.signedCount }}</span>
            </p>
            <p>
              <span class="label-text">{{ $t('sign.sign10') }}</span>
              <span>{{ restCount }}</span>
            </p>
          </div>
          <div class="tip" v-if="restCount <= 1 && !disableBtn">
            {{ $t('sign.sign11') }}
          </div>
          <Button
            v-if="!signHex"
            :title="disableBtn ? disableBtn : $t('tab.Sign')"
            :disabled="!!disableBtn"
            @click="submit"
          ></Button>
        </template>
        <template v-else>
          <Button
            v-if="!signHex"
            :title="disableSign ? $t('sign.sign14') : $t('sign.sign15')"
            :disabled="disableSign"
            @click="signAndBroadcast"
          ></Button>
        </template>
        <div class="sign-hex hash-wrapper" v-if="txHash">
          <h5>Hash:</h5>
          <CopyWrapper :content="txHash" layout="column" :omit="false" />
        </div>
        <div class="sign-hex" v-if="signHex">
          <h5>{{ $t('sign.sign12') }}</h5>
          <CopyWrapper :content="signHex" layout="column" :omit="false" />
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Button from '@/components/Button/index.vue';
import CopyWrapper from '@/components/CopyWrapper/index.vue';
import { NTransfer } from '@/utils/api';
import {
  broadcastTx,
  getNERVEAssets,
  getTxInfo,
  getContract
} from '@/service/api';
import {
  superLong,
  getCurrentAccount,
  divisionDecimals,
  debounce,
  toUrl
} from '@/utils/util';
import config from '@/config';
import { ElMessage } from 'element-plus';
import { getProvider } from '@/hooks/useEthereum';
import { NDecimals, NKey, NSymbol } from '@/constants/constants';

import type { TxInfo, SignInfo } from './types';
import { AssetItem } from '@/service/api/types';

const { t } = useI18n();

const props = defineProps<{
  chain: string;
  address: string;
  pub: string;
}>();

const txHex = ref('');
const generalTx = ref(false);
const txHash = ref('');
watch(
  () => txHex.value,
  val => {
    signHex.value = '';
    txHash.value = '';
    if (val) {
      debounce(() => deSerialize(val), 500)();
    } else {
      txInfo.value = {} as TxInfo;
      signInfo.value = {} as SignInfo;
      errorMsg.value = '';
    }
  }
);

// 交易信息
const txInfo = ref<TxInfo>({} as TxInfo);
const errorMsg = ref('');
// 签名信息
const signInfo = ref<SignInfo>({} as SignInfo);

// 仍需签名数
const restCount = computed(() => {
  return signInfo.value.minSignCount - signInfo.value.signedCount > 0
    ? signInfo.value.minSignCount - signInfo.value.signedCount
    : 0;
});

// 验证是否能签名
const disableBtn = computed(() => {
  const { signedInfo, pubkeyArray, existed } = signInfo.value;
  // console.log(signInfo.value, props.pub)
  if (!pubkeyArray) return false;
  const hasAuthToSign = pubkeyArray.find(v => v === props.pub);
  const alreadySigned = signedInfo.find(v => v.pub === props.pub);
  if (existed) {
    return t('error.lg_1003');
  } else if (!hasAuthToSign) {
    return t('sign.sign14');
  } else if (alreadySigned) {
    return t('sign.sign13');
  } else {
    return false;
  }
});

// disable sign and broadcast
const disableSign = computed(() => {
  const from = txInfo.value.from;
  if (!from) return false;
  const currentAccount = getCurrentAccount(props.address);
  const hasAuth = Object.values(currentAccount.address).find(v => v === from);
  return !hasAuth;
});

const loading = ref(false);

// 根据txHex反序列化交易
async function deSerialize(hex: string) {
  loading.value = true;
  const transfer = new NTransfer({
    chain: props.chain
  });
  try {
    const { coinData, type, hash, txData } = transfer.deSerialize(hex);
    // console.log(coinData, type, hash, '==--==', txData);
    const { fromList, toList } = coinData;
    // const { chainId } = config[props.chain];
    let symbol, newAmount, to;
    const from = fromList[0].address;
    if (txData) {
      // nuls链token转账
      const contractInfo = await getContract(txData.contractAddress);
      if (!contractInfo.result) throw contractInfo.error?.message;
      const txAmount = (txData.args[1] && txData.args[1][0]) || '0';
      symbol = contractInfo.result.symbol;
      newAmount = divisionDecimals(txAmount, contractInfo.result.decimals);
      to = txData.args[0][0] || '';
    } else {
      const { assetsChainId, assetsId, amount } = toList[0];
      const asssetKey = assetsChainId + '-' + assetsId;
      if (props.chain === 'NULS' && asssetKey === NKey) {
        symbol = NSymbol;
        newAmount = divisionDecimals(amount, NDecimals);
      } else {
        const currentAccount = getCurrentAccount(props.address);
        const NerveAddress = currentAccount.address.NERVE;
        const res = await getNERVEAssets(NerveAddress, true);
        const assetInfo = res.find(
          v => v.chainId === assetsChainId && v.assetId === assetsId
        ) as AssetItem;
        symbol = assetInfo.symbol;
        newAmount = divisionDecimals(amount, assetInfo.decimals);
      }
      to = toList[0].address;
    }
    txInfo.value = {
      from,
      to,
      amount: newAmount,
      symbol,
      type
    };
    const signedCount = transfer.getSignedCount(hex);
    if (signedCount) {
      generalTx.value = false;
      const { minSignCount, signedInfo, pubkeyArray } = signedCount;
      const existedTx = await getTxInfo(props.chain, hash);
      signInfo.value = {
        minSignCount,
        signedCount: signedInfo.length,
        signedInfo: signedInfo,
        pubkeyArray,
        existed: !!existedTx.result
      };
    } else {
      generalTx.value = true;
    }
    // console.log(signInfo.value, 'signInfo');
    errorMsg.value = '';
  } catch (e) {
    // console.log(e,33)
    txInfo.value = {} as TxInfo;
    signInfo.value = {} as SignInfo;
    errorMsg.value = t('tip.tip9');
    // console.log(e, '解析hex失败');
  }
  loading.value = false;
}

const signHex = ref('');

// 签名交易
async function submit() {
  loading.value = true;
  try {
    // const currentAccount = getCurrentAccount(props.address);
    const transfer = new NTransfer({
      chain: props.chain
    });
    const hex = await transfer.multiSign(txHex.value, props.address, props.pub);
    if (restCount.value <= 1) {
      const res = await broadcastTx(props.chain, hex);
      if (res.result) {
        ElMessage.success(t('tip.tip10'));
        signHex.value = hex;
        txHash.value = res.result.hash;
      } else {
        ElMessage.error(t('error.' + res.error?.code));
      }
    } else {
      signHex.value = hex;
    }
  } catch (e) {
    ElMessage.error(e.message || e);
  }
  loading.value = false;
}

async function signAndBroadcast() {
  loading.value = true;
  try {
    // const currentAccount = getCurrentAccount(props.address);
    const transfer = new NTransfer({
      chain: props.chain
    });
    const provider = getProvider();
    const isNULSLedger = provider?.isNabox && provider?.isNULSLedger;
    const hex = await transfer.signTx(
      txHex.value,
      props.address,
      props.pub,
      isNULSLedger
    );
    const res = await broadcastTx(props.chain, hex);
    if (res.result) {
      ElMessage.success(t('tip.tip10'));
      signHex.value = hex;
      txHash.value = res.result.hash;
    } else {
      ElMessage.error(t('error.' + res.error?.code));
    }
  } catch (e) {
    ElMessage.error(e.message || e);
  }
  loading.value = false;
}

function resetFields() {
  txHex.value = '';
  txInfo.value = {} as TxInfo;
  signInfo.value = {} as SignInfo;
  signHex.value = '';
  errorMsg.value = '';
}

defineExpose({
  resetFields
});
</script>

<style lang="scss">
.sign-wrapper {
  .el-textarea {
    margin-bottom: 20px;
  }

  .content {
    min-height: 300px;

    .hex-error {
      text-align: center;
      font-size: 16px;
      color: #f56c6c;
    }
  }

  .tx-info,
  .sign-info {
    padding-bottom: 10px;

    h5,
    p {
      line-height: 1;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    h5 {
      font-size: 15px;
    }
  }

  .tip {
    color: #f4bd64;
    margin-top: -10px;
    margin-bottom: 10px;
  }

  .hash-wrapper {
    .content {
      min-height: 40px;
    }
  }

  .sign-hex {
    h5 {
      font-size: 15px;
      margin-bottom: 10px;
    }
  }
}
</style>
