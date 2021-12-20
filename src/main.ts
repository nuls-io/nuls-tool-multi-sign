import { createApp } from 'vue';
import App from './App.vue';
import usePlugins from '@/plugins';
// import 'element-plus/dist/index.css';

if (process.env.NODE_ENV !== 'development') {
  window.console.log = () => {};
}

setTimeout(() => {
  // 不延迟有时刷新会拿不到ethereum.selectedAddress???
  const app = createApp(App);
  app.use(usePlugins).mount('#app');
}, 500);
