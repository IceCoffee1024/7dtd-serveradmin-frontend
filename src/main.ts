import { createApp } from 'vue';
import App from './App.vue';

import { setupAuthEventHandler } from './plugins/authEventHandler';
import { setupAutoAnimate } from './plugins/autoAnimate';

import { setupElementPlus } from './plugins/elementPlus';
import { setupI18n } from './plugins/i18n';
import { setupPinia } from './plugins/pinia';
import router from './router';

import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css';
import 'virtual:uno.css';
import './styles/index.scss';

const app = createApp(App);

setupPinia(app);
setupI18n(app);

app.use(router);
setupAuthEventHandler(router);

setupElementPlus(app);
setupAutoAnimate(app);

app.mount('#app');
