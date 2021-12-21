<template>
  <div class="copy-wrapper">
    <div class="row" v-if="props.layout === 'row'">
      <div class="content">
        {{ prefix }}
        {{ props.omit ? superLong(props.content, 10) : props.content }}
      </div>
      <img
        src="../../assets/img/copy.svg"
        alt=""
        @click="copy(props.content)"
      />
    </div>
    <div v-else class="column">
      <img
        src="../../assets/img/copy.svg"
        alt=""
        @click="copy(props.content)"
      />
      <div class="content">
        {{ prefix }}
        {{ props.omit ? superLong(props.content, 10) : props.content }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { superLong } from '@/utils/util';
import useCopy from '@/hooks/useCopy';

const props = defineProps({
  content: String,
  prefix: String,
  omit: {
    type: Boolean,
    default: true
  },
  layout: {
    type: String,
    default: 'row'
  }
});

const { copy } = useCopy();
</script>

<style lang="scss">
.copy-wrapper {
  .row,
  .column {
    display: flex;
    background: #f0f2f6;
    border-radius: 10px;
    min-height: 48px;
    padding: 6px 10px;
    margin-bottom: 10px;
    img {
      width: 16px;
      cursor: pointer;
    }
  }
  .row {
    align-items: center;
    justify-content: space-between;
  }
  .column {
    flex-direction: column;
    .content {
      word-break: break-all;
    }
    img {
      align-self: flex-end;
    }
  }
}
</style>
