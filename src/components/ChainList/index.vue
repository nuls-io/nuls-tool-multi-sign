<template>
  <div class="chain-list" v-show="props.show" ref="wrapper">
    <ul>
      <li
        v-for="item in props.chainList"
        :key="item.label"
        @click.stop="handleClick(item.label)"
      >
        <p
          :class="{
            active: item.label === props.current
          }"
        >
          <img :src="item.logo" alt="" />
          {{ item.label }}
        </p>
      </li>
      <div class="pop-arrow"></div>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';

const props = defineProps<{
  show: boolean;
  chainList: any;
  current: string;
}>();

const emit = defineEmits<{
  (e: 'update:show', show: boolean): void;
  (e: 'change', chain: string): void;
}>();

// const props = defineProps({
//   show: {
//     type: Boolean,
//     default: false
//   },
//   chainList: {
//     type: Object
//   },
//   current: String
// });
//
// const emit = defineEmits(['update:show', 'change']);

const wrapper = ref<HTMLElement>();

onMounted(() => {
  window.addEventListener('click', e => {
    const target = e.target as HTMLElement;
    if (!props.show || !wrapper.value) return;
    if (!wrapper.value?.contains(target)) {
      emit('update:show', false);
    }
  });
});

function handleClick(chain: string) {
  if (chain === props.current) return;
  emit('update:show', false);
  emit('change', chain);
}
</script>

<style scoped lang="scss">
.chain-list {
  position: absolute;
  top: 30px;
  left: 20px;
  z-index: 99999;
  width: 150px;
  padding: 6px 0;
  margin-top: 8px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

  li {
    padding: 5px 0;

    p {
      display: flex;
      align-items: center;
      padding: 0 15px;

      img {
        width: 28px;
        margin-right: 10px;
      }

      &:hover {
        background-color: #f5f7fa;
      }

      &.active {
        color: #409eff;
        font-weight: 700;
      }

      &.disable {
        cursor: not-allowed;
        color: #c0c4cc;

        &:hover {
          background-color: #fff;
        }
      }
    }
  }

  .pop-arrow,
  .pop-arrow:after {
    position: absolute;
    display: block;
    width: 0;
    height: 0;
    border-width: 6px;
    border-top-width: 0;
    border-color: transparent;
    border-style: solid;
  }

  .pop-arrow {
    top: -6px;
    left: 30px;
    border-bottom-color: #ebeef5;

    &:after {
      content: ' ';
      top: 1px;
      margin-left: -6px;
      border-bottom-color: #fff;
    }
  }
}
</style>
