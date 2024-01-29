import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import storage from '@/utils/storage';
import zhCn from 'element-plus/lib/locale/lang/zh-cn';
import enLocale from 'element-plus/lib/locale/lang/en';

export default function useLang() {
  const { locale } = useI18n();
  // 切换的语言
  const lang = computed(() => {
    return locale.value === 'en' ? 'Zh' : 'En';
  });

  function switchLang() {
    locale.value = lang.value === 'En' ? 'en' : 'zh-cn';
    storage.set('lang', locale.value);
  }

  // element-plus国际化
  const localeLang = computed(() => {
    return lang.value === 'En' ? zhCn : enLocale;
  });
  return {
    lang,
    switchLang,
    localeLang
  };
}
