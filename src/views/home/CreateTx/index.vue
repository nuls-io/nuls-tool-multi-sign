<template>
  <div class="create-tx-wrapper" v-loading="loading">
    <el-form ref="createTxForm" :model="formModel" :rules="rules">
      <div ref="fromAddress" class="from-address-item">
        <div class="from-address-content" @click="showAddressSelect = true">
          <span v-if="formModel.from">{{ superLong(formModel.from, 12) }}</span>
          <span v-else class="holder">{{ $t('createTx.createTx1') }}</span>
        </div>
        <AddressSelect
          v-model:show="showAddressSelect"
          :addressList="addressList"
          @selectAddress="selectAddress"
          @addAddress="addAddress"
        />
      </div>
      <el-form-item prop="asset">
        <el-select
          v-model="formModel.asset"
          :placeholder="$t('createTx.createTx2')"
        >
          <el-option
            v-for="item in assetsList"
            :key="item.assetKey"
            :label="item.symbol"
            :value="item.assetKey"
          ></el-option>
        </el-select>
      </el-form-item>
      <div class="available label-text">
        {{ $t('createTx.createTx3') }}{{ chooseAsset?.available }}
      </div>
      <el-form-item prop="amount" class="amount-item">
        <el-input
          v-model="formModel.amount"
          :placeholder="$t('createTx.createTx4')"
        ></el-input>
        <div class="max theme-text" @click="max">
          {{ $t('createTx.createTx6') }}
        </div>
      </el-form-item>
      <el-form-item prop="to">
        <el-input
          v-model.trim="formModel.to"
          :placeholder="$t('createTx.createTx5')"
        ></el-input>
      </el-form-item>
      <Button
        v-if="!txHex"
        :title="$t('tab.CreateTx')"
        @click="submit"
        :disabled="!formModel.from"
      />
      <div class="tx-hex" v-else>
        <h5>{{ $t('createTx.createTx8') }}</h5>
        <CopyWrapper :content="txHex" layout="column" :omit="false" />
      </div>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElForm, ElMessage } from 'element-plus';
import AddressSelect from './AddressSelect.vue';
import Button from '@/components/Button/index.vue';
import CopyWrapper from '@/components/CopyWrapper/index.vue';
import useClickOutside from '@/hooks/useClickOutside';
import storage from '@/utils/storage';
import { getNERVEAssets, getNULSAssets } from '@/service/api';
import nerve from 'nerve-sdk-js';
import { NTransfer } from '@/utils/api';
import { timesDecimals, superLong, Times, Plus } from '@/utils/util';
import { getContractCallData } from '@/utils/nulsContractValidate';
import config from '@/config';
import { NDecimals } from '@/constants/constants';

import type { ValidAddressInfo } from './types';
import type { AssetItem } from '@/service/api/types';
import type { AccountItem, MultiAddress } from '@/views/home/types';

// const props = defineProps({
//   chain: String,
//   pub: String
// });
// const emit = defineEmits(['addAddress']);
const props = defineProps<{
  chain: string;
  pub: string;
}>();
const emit = defineEmits<{
  (e: 'addAddress'): void;
}>();

const { t } = useI18n();

const createTxForm = ref<InstanceType<typeof ElForm>>();
const fromAddress = ref<HTMLElement | null>(null);

const formModel = reactive({
  from: '',
  asset: '',
  amount: '',
  to: ''
});

const rules = reactive({
  from: [
    {
      validator: validateFrom,
      trigger: 'change'
    }
  ],
  asset: [
    {
      validator: validateAsset,
      trigger: 'blur'
    }
  ],
  amount: [
    {
      validator: validateAmount,
      trigger: 'blur'
    }
  ],
  to: [
    {
      validator: validateTo,
      trigger: 'change'
    }
  ]
});

function validateFrom(rule: any, value: any, callback: any) {
  let addressInfo: ValidAddressInfo = {} as ValidAddressInfo;
  try {
    addressInfo = nerve.verifyAddress(value);
    // addressInfo.type 1:主网地址 2：合约地址 3:多签地址
  } catch (e) {
    //
  }
  if (!addressInfo.right) {
    callback(t('tip.tip5'));
  } else if (addressInfo.chainId !== config[props.chain].chainId) {
    callback(t('tip.tip5'));
  } else {
    getAssets(value);
    callback();
  }
}

function validateAsset(rule: any, value: any, callback: any) {
  if (!value) {
    callback(t('createTx.createTx2'));
  } else {
    callback();
  }
}

function validateAmount(rule: any, value: any, callback: any) {
  const decimals = chooseAsset.value.decimals || NDecimals;
  const reg = new RegExp(
    '^([1-9][\\d]{0,20}|0)(\\.[\\d]{0,' + decimals + '})?$'
  );
  if (!reg.exec(value)) {
    callback(t('tip.tip7'));
  } else if (
    chooseAsset.value &&
    Number(chooseAsset.value.available) - value < 0
  ) {
    callback(t('tip.tip8'));
  } else {
    callback();
  }
}

function validateTo(rule: any, value: any, callback: any) {
  // console.log(value, 4564)
  let addressInfo: ValidAddressInfo = {} as ValidAddressInfo;
  try {
    addressInfo = nerve.verifyAddress(value);
    // addressInfo.type 1:主网地址 2：合约地址 3:多签地址
  } catch (e) {
    //
  }
  if (!addressInfo.right) {
    callback(t('tip.tip5'));
  } else if (addressInfo.chainId !== config[props.chain].chainId) {
    callback(t('tip.tip6'));
  } else {
    callback();
  }
}

const isClickFromItem = useClickOutside(fromAddress);

watch(
  () => isClickFromItem.value,
  val => {
    if (val) {
      showAddressSelect.value = false;
    }
  }
);

const showAddressSelect = ref(false);
const addressList = ref(initAddressList());

function initAddressList(): MultiAddress[] {
  const accountList: AccountItem[] = storage.get('accountList') || [];
  const currentAccount = accountList.find(v => v.pub === props.pub) || {};
  return currentAccount['multi_' + props.chain] || [];
}

function selectAddress(item: MultiAddress) {
  if (item.address !== formModel.from) {
    formModel.from = item.address;
    getAssets(item.address);
  }
  isClickFromItem.value = true;
}

function addAddress() {
  emit('addAddress');
}

const assetsList = ref<AssetItem[]>([]);

async function getAssets(address: string) {
  if (props.chain === 'NERVE') {
    assetsList.value = await getNERVEAssets(address);
  } else {
    assetsList.value = await getNULSAssets(address);
  }
}

const chooseAsset = computed<AssetItem>(() => {
  const asset = assetsList.value.find(v => v.assetKey === formModel.asset);
  return asset as AssetItem;
});

function max() {
  formModel.amount = chooseAsset.value.available;
}

const loading = ref(false);
const txHex = ref('');
function submit() {
  createTxForm.value?.validate(async valid => {
    if (valid) {
      try {
        loading.value = true;
        const { from, to, amount } = formModel;
        const { chainId, assetId, decimals, contractAddress } = chooseAsset.value;
        let type = 2, inputOutput: any, txData: any = {};
        const transfer = new NTransfer({
          chain: props.chain as string
        });
        if (contractAddress) {
          // nuls 转账token资产
          type = 16;
          const contractCallDataRes = await getContractCallData(from, to, 25, contractAddress, 'transfer', amount, decimals);
          if (!contractCallDataRes.success) {
            throw contractCallDataRes.msg;
          }
          txData = contractCallDataRes.data!;
          const transferInfo = {
            from,
            assetsChainId: config.NULS.chainId,
            assetsId: config.NULS.assetId,
            amount: Times(txData.gasLimit, txData.price).toFixed(), // 调用合约手续费
            toContractValue: 0,
            to: contractAddress
          };
          inputOutput = await transfer.callContractTransaction(transferInfo);
        } else {
          const transferInfo = {
            from,
            to,
            assetsChainId: chainId,
            assetsId: assetId,
            amount: timesDecimals(amount, decimals),
            fee: 0
          };
          if (props.chain === 'NULS') {
            transferInfo.fee = 100000;
          }
          inputOutput = await transfer.transferTransaction(transferInfo);
        }
        const { inputs, outputs } = inputOutput;
        const tAssemble = transfer.sdk.transactionAssemble(inputs, outputs, '', type, txData);
        const multiInfo = addressList.value.find(
          v => v.address === from
        ) as MultiAddress;
        txHex.value = transfer.createMultiTransaction(
          tAssemble,
          multiInfo.minSignCount,
          multiInfo.pubList
        );
        console.log(txHex.value, 465798);
      } catch (e) {
        console.log(e);
        ElMessage.error({
          message: e,
          duration: 2000
        });
      }
      loading.value = false;
    }
  });
}

function resetFields() {
  addressList.value = initAddressList();
  formModel.from = '';
  createTxForm.value?.resetFields();
  assetsList.value = [];
  txHex.value = '';
}

defineExpose({
  resetFields
});
</script>

<style lang="scss">
.create-tx-wrapper {
  .from-address-item {
    position: relative;
    height: 50px;
    cursor: pointer;
    margin-bottom: 20px;

    .from-address-content {
      border: 1px solid #dcdfe6;
      border-radius: 10px;
      line-height: 48px;
      padding-left: 15px;
    }
  }

  .available {
    text-align: right;
    line-height: 1;
    margin-bottom: 5px;
  }

  .amount-item {
    position: relative;

    input {
      padding-right: 50px;
    }

    .max {
      position: absolute;
      min-width: 50px;
      height: 50px;
      line-height: 50px;
      right: 0;
      top: 0;
      text-align: center;
      cursor: pointer;
    }
  }
  .tx-hex {
    h5 {
      padding-bottom: 8px;
      font-size: 15px;
    }
  }
}
</style>
