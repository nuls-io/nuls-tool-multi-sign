import { ElMessage } from 'element-plus';
import { copys } from '@/utils/util';
import { useI18n } from 'vue-i18n';

export default function useCopy() {
  const { t } = useI18n();

  function copy(str: string) {
    copys(str);
    ElMessage.success({
      message: t('public.public2'),
      duration: 2000
    });
  }

  return {
    copy
  };
}
