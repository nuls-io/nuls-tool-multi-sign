import { App } from 'vue';
import { useElIcon } from './el-icon';
import { useI18nPlugin } from './i18n';
import './element-plus';
// import { useGlobalProperties } from './globalProperties';

export default function usePlugins(app: App) {
  // useGlobalProperties(app);
  useElIcon(app);
  useI18nPlugin(app);
}
