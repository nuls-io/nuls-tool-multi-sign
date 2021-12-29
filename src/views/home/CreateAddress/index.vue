<template>
  <div class="create-address-wrapper">
    <el-input
      v-model="pubString"
      :rows="4"
      type="textarea"
      :placeholder="$t('createAddress.createAddress1')"
    />
    <div class="pub-list">
      <h5>{{ $t('createAddress.createAddress2') }}{{ validList.length }}</h5>
      <PubItem
        v-model:pub="item.pub"
        v-for="(item, index) in pubList"
        :key="index"
        :pub="item.pub"
        :address="getAddress(item.pub)"
        @del="delPubList"
        :show-del-icon="true"
      />
      <PubItem
        v-model:pub="item.pub"
        v-for="(item, index) in manualList"
        :key="index"
        :pub="item.pub"
        :address="getAddress(item.pub)"
        @del="delManualList"
        :show-del-icon="manualList.length > 1"
      />
      <div class="add-icon">
        <img @click="addManualList" src="../../../assets/img/add.svg" alt="" />
      </div>
    </div>
    <div class="min-sign-amount">
      <el-input
        v-model.number="minSignCount"
        :placeholder="$t('createAddress.createAddress4')"
      ></el-input>
      <span class="count-error">{{ minSignTip }}</span>
    </div>
    <Button
      v-if="!multiAddress"
      :title="$t('tab.CreateAddress')"
      :disabled="disabled"
      @click="createAddress"
    ></Button>
    <template v-else>
      <div class="multi-address">
        <h5>{{ $t('createAddress.createAddress6') }}</h5>
        <CopyWrapper :content="multiAddress" />
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
/*pubKeyArray = [
  "02362c64e15ab653132ec753e4a8c181ef720ec927466a09417a07877824781f57",
  "0224d86a584324fc8e92c6dba19c08926a7af77df884deec0d1c3b879a8f50720f",
  "02962c7942851fa2c937be788a18693885276e3d9688b5997d9f02ebf2fef218db"
]*/
import { computed, ref, watch } from 'vue';
import Button from '@/components/Button/index.vue';
import CopyWrapper from '@/components/CopyWrapper/index.vue';
import PubItem from './PubItem.vue';
import { useI18n } from 'vue-i18n';
import { NTransfer } from '@/utils/api';
import storage from '@/utils/storage';
import type { AccountItem, MultiAddress } from '@/views/home/types';
import { ElMessage } from 'element-plus';

interface ModelItem {
  pub: string;
  address: string;
}

const props = defineProps<{
  chain: string;
  pub: string;
}>();

const { t } = useI18n();

let transfer: NTransfer;
watch(
  () => props.chain,
  val => {
    if (val) {
      transfer = new NTransfer({ chain: val });
    }
  },
  {
    immediate: true
  }
);

const pubString = ref('');
const pubList = ref<ModelItem[]>([]);
const manualList = ref<ModelItem[]>([{ pub: '', address: '' }]);

watch(
  () => pubString.value,
  val => {
    val = val.replace(/，/g, ',');
    const list = val.split(',').filter(v => v);
    const trimList = list.map(v => {
      const trimPub = v.replace(/\s/g, '');
      return {
        pub: trimPub,
        address: getAddress(trimPub)
      };
    });
    pubList.value = [...trimList];
  }
);

function getAddress(pub: string) {
  try {
    return transfer?.getAddressByPub(pub);
  } catch (e) {
    return '';
  }
}

function addManualList() {
  manualList.value.push({
    address: '',
    pub: ''
  });
}

function delPubList(index: number) {
  pubList.value.splice(index, 1);
}

function delManualList(index: number) {
  if (manualList.value.length === 1) return;
  manualList.value.splice(index, 1);
}

const validList = computed(() => {
  const totalList = pubList.value.concat(manualList.value);
  return totalList.filter(item => {
    const validAddress = getAddress(item.pub);
    return !!validAddress;
  });
});

const minSignCount = ref(null as unknown);

const disabled = computed(() => {
  return minSignTip.value || !minSignCount.value || !validList.value.length;
});

const minSignTip = computed(() => {
  let msg = '';
  if (minSignCount.value !== null) {
    const count = minSignCount.value as string;
    if (!count) {
      msg = t('tip.tip1');
    } else if (!/^[0-9]*$/.test(count)) {
      msg = t('tip.tip2');
    } else if (+count < 2 || +count > 15) {
      msg = t('tip.tip3');
    } else if (validList.value.length < +count) {
      msg = t('tip.tip4');
    }
  }
  return msg;
});

const multiAddress = ref('');

function createAddress() {
  const pubArray = validList.value.map(v => v.pub);
  if (pubArray.length > 15 || pubArray.length < minSignCount.value) {
    ElMessage.warning(t('tip.tip11'));
    return;
  }
  const filterPubs = [...new Set(pubArray)];
  if (filterPubs.length !== pubArray.length) {
    ElMessage.warning(t('tip.tip12'));
    return;
  }
  const address = transfer.createMultiAddress(
    minSignCount.value as string,
    pubArray
  );
  const accountList: AccountItem[] = storage.get('accountList') || [];
  accountList.map(item => {
    if (item.pub === props.pub) {
      const multiItem = {
        address,
        pubList: pubArray,
        minSignCount: minSignCount.value
      };
      const multiAddress = 'multi_' + props.chain;
      if (item[multiAddress]) {
        const exist = item[multiAddress].find(
          (v: MultiAddress) => v.address === address
        );
        if (!exist) {
          item[multiAddress].push(multiItem);
        }
      } else {
        item[multiAddress] = [multiItem];
      }
    }
  });
  storage.set('accountList', accountList);
  multiAddress.value = address;
}

function resetFields() {
  pubString.value = '';
  minSignCount.value = null;
  multiAddress.value = '';
  manualList.value = [{ pub: '', address: '' }];
}

defineExpose({
  resetFields
});
</script>

<style lang="scss">
.create-address-wrapper {
  .pub-list {
    margin-bottom: 20px;

    h5 {
      line-height: 1;
      font-size: 15px;
      margin: 20px 0 10px;
    }

    .add-icon {
      display: flex;
      justify-content: center;
      padding-top: 5px;

      img {
        cursor: pointer;
      }
    }

    .input-wrapper {
      position: relative;

      .minus {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        width: 20px;
        cursor: pointer;
      }
    }
  }

  .min-sign-amount {
    position: relative;
  }

  .count-error {
    color: #f56c6c;
    font-size: 12px;
    line-height: 1;
    padding-top: 4px;
    position: absolute;
    top: 100%;
    left: 0;
  }
  .multi-address {
    h5 {
      padding: 15px 0 8px;
      font-size: 15px;
    }
  }
}
</style>
