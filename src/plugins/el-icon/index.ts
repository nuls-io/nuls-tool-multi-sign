import { App } from 'vue';
import {
  CaretBottom,
  DocumentCopy
  /*ArrowDown,
  ArrowDownBold,
  ArrowRight,
  Loading,
  Minus,
  Plus,
  Back,
  CaretRight*/
} from '@element-plus/icons-vue';

// 全局注册@element-plus icon
const components = [
  CaretBottom,
  DocumentCopy
  /*ArrowDown,
  ArrowDownBold,
  ArrowRight,
  Loading,
  Minus,
  Plus,
  Back,
  CaretRight*/
];

export function useElIcon(app: App) {
  components.forEach(component => {
    app.component(component.name, component);
  });
}
