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
            <span>{{ $t('sign.sign4') }}</span>
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
        <div class="tip" v-if="restCount === 1 && !disableBtn">
          {{ $t('sign.sign11') }}
        </div>

        <Button
          v-if="!signHex"
          :title="disableBtn ? disableBtn : $t('tab.Sign')"
          :disabled="!!disableBtn"
          @click="submit"
        ></Button>
        <div class="sign-hex" v-else>
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
import { broadcastTx, getNERVEAssets } from '@/service/api';
import {
  superLong,
  getCurrentAccount,
  divisionDecimals,
  debounce,
  toUrl
} from '@/utils/util';
import config from '@/config';
import { ElMessage } from 'element-plus';

const { t } = useI18n();

const props = defineProps({
  chain: String,
  address: String,
  pub: String
});

const txHex = ref('');
watch(
  () => txHex.value,
  val => {
    signHex.value = '';
    if (val) {
      debounce(() => deSerialize(val), 500)();
    } else {
      txInfo.value = {};
      signInfo.value = {};
      errorMsg.value = '';
    }
  }
);

// 交易信息
const txInfo = ref({});
const errorMsg = ref('');
// 签名信息
const signInfo = ref({});

// 仍需签名数
const restCount = computed(() => {
  return signInfo.value.minSignCount - signInfo.value.signedCount;
});

// 验证是否能签名
const disableBtn = computed(() => {
  const { signedInfo, pubkeyArray } = signInfo.value;
  // console.log(signInfo.value, props.pub)
  const hasAuthToSign = pubkeyArray.find(v => v === props.pub);
  const alreadySigned = signedInfo.find(v => v.pub === props.pub);
  if (!hasAuthToSign) {
    return t('sign.sign14');
  } else if (alreadySigned) {
    return t('sign.sign13');
  } else {
    return false;
  }
});

const loading = ref(false);

// 根据txHex反序列化交易
async function deSerialize(hex: string) {
  loading.value = true;
  const transfer = new NTransfer({
    chain: props.chain
  });
  try {
    const { coinData } = transfer.deSerialize(hex);
    console.log(coinData, 'coinData');
    const { fromList, toList } = coinData;
    const { assetsChainId, assetsId, amount } = toList[0];
    const { chainId } = config[props.chain];
    let symbol, newAmount;
    if (props.chain === 'NULS' && assetsChainId === chainId) {
      symbol = 'NULS';
      newAmount = divisionDecimals(amount, 8);
    } else {
      const res = await getNERVEAssets(props.address, true);
      const assetInfo = res.find(
        v => v.chainId === assetsChainId && v.assetId === assetsId
      );
      symbol = assetInfo.symbol;
      newAmount = divisionDecimals(amount, assetInfo.decimals);
    }

    txInfo.value = {
      from: fromList[0].address,
      to: toList[0].address,
      amount: newAmount,
      symbol
    };
    const signedCount = transfer.getSignedCount(hex);
    const { minSignCount, signedInfo, pubkeyArray } = signedCount;
    signInfo.value = {
      minSignCount,
      signedCount: signedInfo.length,
      signedInfo: signedInfo,
      pubkeyArray
    };
    console.log(signInfo.value, 'signInfo');
    errorMsg.value = '';
  } catch (e) {
    txInfo.value = {};
    signInfo.value = {};
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
    const currentAccount = getCurrentAccount(props.address);
    const transfer = new NTransfer({
      chain: props.chain
    });
    signHex.value = await transfer.multiSign(
      txHex.value,
      currentAccount.address.Ethereum,
      currentAccount.pub
    );
    if (restCount.value === 1) {
      const res = await broadcastTx(props.chain, signHex.value);
      if (res && res.hash) {
        ElMessage.success(t('tip.tip10'));
      }
    }
  } catch (e) {
    ElMessage.error(e.message || e);
  }
  loading.value = false;
}

function resetFields() {
  txHex.value = '';
  txInfo.value = {};
  signInfo.value = {};
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
  }

  .sign-hex {
    h5 {
      font-size: 15px;
      margin-bottom: 10px;
    }
  }
}
</style>