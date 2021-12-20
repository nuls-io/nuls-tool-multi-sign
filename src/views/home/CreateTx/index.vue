<template>
  <div class="create-tx-wrapper">
    <el-form ref="createTxForm" :model="formModel" :rules="rules">
      <div ref="fromAddress" class="from-address-item">
        <div class="from-address-content" @click="showAddressSelect = true">
          <span v-if="formModel.from">{{ superLong(formModel.from, 12) }}</span>
          <span v-else class="holder">{{ $t('createTx.createTx1') }}</span>
        </div>
        <!--        <el-form-item prop="from" class="from-address-item">
          <el-input
            v-model="formModel.from"
            :placeholder="$t('createTx.createTx1')"
          ></el-input>
          <AddressSelect
            v-model:show="showAddressSelect"
            :addressList="filteredAddressList"
            @selectAddress="selectAddress"
            @addAddress="addAddress"
          />
        </el-form-item>-->
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
import { ElForm } from 'element-plus';
import AddressSelect from './AddressSelect.vue';
import Button from '@/components/Button/index.vue';
import CopyWrapper from '@/components/CopyWrapper/index.vue';
import useClickOutside from '@/hooks/useClickOutside';
import storage from '@/utils/storage';
import { getNERVEAssets, getNULSAssets } from '@/service/api';
import nerve from 'nerve-sdk-js';
import { NTransfer } from '@/utils/api';
import { timesDecimals, superLong } from '@/utils/util';
import config from '@/config';

const props = defineProps({
  chain: String,
  pub: String
});

const emit = defineEmits(['addAddress']);

const { t } = useI18n();

const createTxForm = ref<InstanceType<typeof ElForm>>();
const fromAddress = ref<HTMLElement>();

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
  let addressInfo = {};
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
  const decimals = chooseAsset.value?.decimals || 8;
  const reg = new RegExp(
    '^([1-9][\\d]{0,20}|0)(\\.[\\d]{0,' + decimals + '})?$'
  );
  if (!reg.exec(value)) {
    callback(t('tip.tip7'));
  } else if (chooseAsset.value && chooseAsset.value.available - value < 0) {
    callback(t('tip.tip8'));
  } else {
    callback();
  }
}

function validateTo(rule: any, value: any, callback: any) {
  // console.log(value, 4564)
  let addressInfo = {};
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

function initAddressList() {
  const accountList = storage.get('accountList') || [];
  const currentAccount = accountList.find(v => v.pub === props.pub) || {};
  return currentAccount['multi_' + props.chain] || [];
}

function selectAddress(item) {
  if (item.address !== formModel.from) {
    formModel.from = item.address;
    getAssets(item.address);
  }
  isClickFromItem.value = true;
}

function addAddress() {
  emit('addAddress');
}

const assetsList = ref([]);

async function getAssets(address) {
  if (props.chain === 'NERVE') {
    assetsList.value = await getNERVEAssets(address);
  } else {
    assetsList.value = await getNULSAssets(address);
  }
}

const chooseAsset = computed(() => {
  const asset = assetsList.value.find(v => v.assetKey === formModel.asset);
  return asset || null;
});

function max() {
  if (chooseAsset.value) {
    formModel.amount = chooseAsset.value.available;
  }
}

const txHex = ref('');
function submit() {
  createTxForm.value?.validate(async valid => {
    if (valid) {
      const { from, to, amount } = formModel;
      const { chainId, assetId, decimals } = chooseAsset.value;
      const transferInfo = {
        from,
        to,
        assetsChainId: chainId,
        assetsId: assetId,
        amount: timesDecimals(amount, decimals),
        fee: 0
      };
      const transfer = new NTransfer({
        chain: props.chain
      });
      if (props.chain === 'NULS') {
        transferInfo.fee = 100000;
      }
      const inputOutput = await transfer.transferTransaction(transferInfo);
      const multiInfo = addressList.value.find(v => v.address === from);
      txHex.value = transfer.createMultiTransaction(
        inputOutput.inputs,
        inputOutput.outputs,
        multiInfo.minSignCount,
        multiInfo.pubList
      );
      console.log(txHex.value, 465798);
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
