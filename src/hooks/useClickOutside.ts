import { ref, Ref, onMounted, onBeforeUnmount } from 'vue';

export default function useClickOutside(element: Ref<null | HTMLElement>) {
  const isClickOutSide = ref(false);
  function clickHandle(e: MouseEvent) {
    if (element.value) {
      const target = e.target as HTMLElement;
      isClickOutSide.value = !element.value.contains(target);
    }
  }
  onMounted(() => {
    document.addEventListener('click', clickHandle);
  });
  onBeforeUnmount(() => {
    document.removeEventListener('click', clickHandle);
  });

  return isClickOutSide;
}
