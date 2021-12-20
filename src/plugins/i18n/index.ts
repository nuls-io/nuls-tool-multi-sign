import { App } from 'vue';
import { createI18n } from 'vue-i18n';
import storage from '@/utils/storage';
// import {i18n as Ei18n} from "element-plus/lib/locale";
import cn from '@/locale/cn';
import en from '@/locale/en';
import zhLocale from 'element-plus/es/locale/lang/zh-cn';
import enLocale from 'element-plus/es/locale/lang/en';

const messages = {
  [zhLocale.name]: {
    // zh-cn
    el: zhLocale.el,
    ...cn
  },
  [enLocale.name]: {
    // en
    el: enLocale.el,
    ...en
  }
};
const navigatorLang = 'en'; //window.navigator.language === "zh-CN" ? "zh-cn" : "en";
const fallLang = enLocale.name;
const lang = storage.get('lang') || navigatorLang;

const i18n = createI18n({
  locale: lang, // 默认
  fallbackLocale: fallLang, // 没有默认语言时重置为fallLang
  messages
});

// 设置element语言和国际化
// ElementLocale.use(zhLocale);
// console.log(ElementLocale, 66)
// console.log(i18n.global.t, 656)
// Ei18n(i18n.global.t);
export function useI18nPlugin(app: App) {
  app.use(i18n);
}
