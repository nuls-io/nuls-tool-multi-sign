import { App } from 'vue';
import { copys, toThousands } from '@/utils/util';

// 绑定到this实例上的方法
export function useGlobalProperties(app: App) {
  app.config.globalProperties.$copy = function (str: string) {
    copys(str);
    // this.$mess
  };

  app.config.globalProperties.$thousands = function (str: string | number) {
    return toThousands(str);
  };
}
