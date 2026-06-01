<template>
  <div
    class="sign-wrapper sign-wrapper--diag-bar"
    :class="{ 'sign-wrapper--diag-error': showDiagnostic }"
  >
    <el-input
      v-model.trim="txHex"
      :rows="3"
      type="textarea"
      :placeholder="$t('sign.sign1')"
    />
    <div class="content" v-loading="loading">
      <template v-if="errorMsg">
        <div class="hex-error">{{ errorMsg }}</div>
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
    <Teleport to="body">
      <div
        ref="diagPanelRef"
        class="multisign-diag-panel"
        :class="{ 'multisign-diag-panel--error': showDiagnostic }"
      >
        <template v-if="showDiagnostic">
          <p class="multisign-diag-tip">{{ $t('sign.sign16') }}</p>
          <p class="multisign-diag-error" v-if="lastErrorText">{{ lastErrorText }}</p>
        </template>
        <Button :title="$t('sign.sign17')" @click="copyDiagnostic"></Button>
      </div>
    </Teleport>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import Button from '@/components/Button/index.vue';
import CopyWrapper from '@/components/CopyWrapper/index.vue';
import { NTransfer } from '@/utils/api';
import {
  msError,
  msLog,
  hexBrief,
  MULTI_SIGN_DEBUG_TAG,
  copyDiagnosticReport,
  clearDiagnosticLogs,
  getLastErrorMessage,
  registerDiagnosticHandler,
  unregisterDiagnosticHandler
} from '@/utils/multiSignDebug';
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
    msLog('Sign.deSerialize ok', {
      hash,
      type,
      signedCount: signedCount ? signedCount.signedInfo.length : 0,
      minSignCount: signedCount ? signedCount.minSignCount : null
    });
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
    showDiagnostic.value = false;
    lastErrorText.value = '';
  } catch (e) {
    msError('Sign.deSerialize failed', e, {
      debugTag: MULTI_SIGN_DEBUG_TAG,
      txHex: hexBrief(hex)
    });
    txInfo.value = {} as TxInfo;
    signInfo.value = {} as SignInfo;
    errorMsg.value = t('tip.tip9');
    openDiagnostic(e, { phase: 'deSerialize', txHex: hexBrief(hex) });
  }
  loading.value = false;
}

const signHex = ref('');
const showDiagnostic = ref(false);
const lastErrorText = ref('');
const diagPanelRef = ref<HTMLElement | null>(null);

onMounted(() => {
  registerDiagnosticHandler(({ message }) => {
    lastErrorText.value = message;
    showDiagnostic.value = true;
    scrollDiagnosticIntoView();
  });
});

onUnmounted(() => {
  unregisterDiagnosticHandler();
});

function scrollDiagnosticIntoView() {
  nextTick(() => {
    diagPanelRef.value?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  });
}

function buildSignContext(extra: Record<string, unknown> = {}) {
  return {
    chain: props.chain,
    signAddress: props.address,
    pub: props.pub,
    txHex: hexBrief(txHex.value),
    txHexFull: txHex.value,
    ...extra
  };
}

function openDiagnostic(error: unknown, extra?: Record<string, unknown>) {
  const err = error as { message?: string };
  lastErrorText.value = err?.message || String(error);
  if (extra) {
    msLog('Sign.diagnostic-context', extra);
  }
  showDiagnostic.value = true;
  scrollDiagnosticIntoView();
}

function copyDiagnostic() {
  copyDiagnosticReport(buildSignContext({ lastError: lastErrorText.value }));
  ElMessage.success(t('sign.sign18'));
}

/** 钱包内报错但未 reject 时，submit 结束仍无 signHex，兜底展示诊断条 */
function ensureDiagnosticAfterFailedSign(hadSignHex: string) {
  if (signHex.value && signHex.value !== hadSignHex) {
    return;
  }
  if (showDiagnostic.value) {
    return;
  }
  const fromLog = getLastErrorMessage();
  openDiagnostic(
    new Error(fromLog || t('sign.sign19')),
    { phase: 'ensureAfterSubmit', hadSignHex: !!hadSignHex }
  );
}

// 签名交易
async function submit() {
  const signHexBefore = signHex.value;
  loading.value = true;
  showDiagnostic.value = false;
  lastErrorText.value = '';
  clearDiagnosticLogs();
  msLog('Sign.submit:start', buildSignContext());
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
        const msg = t('error.' + res.error?.code);
        msError('Sign.broadcast failed', new Error(msg), buildSignContext());
        ElMessage.error(msg);
      }
    } else {
      signHex.value = hex;
    }
  } catch (e) {
    msError('Sign.submit failed', e, buildSignContext());
    ElMessage.error((e as Error).message || String(e));
  } finally {
    loading.value = false;
    ensureDiagnosticAfterFailedSign(signHexBefore);
  }
}

async function signAndBroadcast() {
  const signHexBefore = signHex.value;
  loading.value = true;
  showDiagnostic.value = false;
  lastErrorText.value = '';
  clearDiagnosticLogs();
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
      const msg = t('error.' + res.error?.code);
      msError('Sign.broadcast failed', new Error(msg), buildSignContext());
      ElMessage.error(msg);
    }
  } catch (e) {
    msError('Sign.signAndBroadcast failed', e, buildSignContext());
    ElMessage.error((e as Error).message || String(e));
  } finally {
    loading.value = false;
    ensureDiagnosticAfterFailedSign(signHexBefore);
  }
}

function resetFields() {
  txHex.value = '';
  txInfo.value = {} as TxInfo;
  signInfo.value = {} as SignInfo;
  signHex.value = '';
  errorMsg.value = '';
  showDiagnostic.value = false;
  lastErrorText.value = '';
  clearDiagnosticLogs();
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

  &.sign-wrapper--diag-bar {
    padding-bottom: 72px;
  }

  &.sign-wrapper--diag-bar.sign-wrapper--diag-error {
    padding-bottom: 160px;
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

/* Teleport 到 body，不可嵌套在 .sign-wrapper 下 */
.multisign-diag-panel {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99999;
  max-width: 400px;
  margin: 0 auto;
  padding: 10px 16px;
  padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px));
  background: #fff;
  border-top: 1px solid #e4e7ed;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);

  .button-wrapper {
    margin: 0;
  }

  &--error {
    padding: 12px 16px;
    padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
    background: #fff7e6;
    border-top: 2px solid #fa8c16;
    box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.18);
    animation: multisign-diag-in 0.35s ease-out;
  }

  .multisign-diag-tip {
    font-size: 14px;
    line-height: 1.5;
    color: #ad6800;
    margin-bottom: 6px;
    font-weight: 600;
  }

  .multisign-diag-error {
    font-size: 12px;
    line-height: 1.4;
    color: #f56c6c;
    word-break: break-all;
    margin-bottom: 10px;
    max-height: 56px;
    overflow-y: auto;
  }

}

@keyframes multisign-diag-in {
  from {
    transform: translateY(100%);
    opacity: 0.6;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
