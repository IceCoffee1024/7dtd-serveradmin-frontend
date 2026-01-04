import type { Language } from 'element-plus/es/locale';
import type { App } from 'vue';
import type { LocaleType } from '~/locales/constant';
import ElementPlus from 'element-plus';
import { LOCALE_TYPE } from '~/locales/constant';
import 'element-plus/theme-chalk/dark/css-vars.css';

export function setupElementPlus(app: App) {
  app.use(ElementPlus);
};

const locales: Partial<Record<LocaleType, () => Promise<Language>>> = {
  [LOCALE_TYPE.DE]: () => import('element-plus/es/locale/lang/de').then(m => m.default),
  [LOCALE_TYPE.EN]: () => import('element-plus/es/locale/lang/en').then(m => m.default),
  [LOCALE_TYPE.ES]: () => import('element-plus/es/locale/lang/es').then(m => m.default),
  [LOCALE_TYPE.FR]: () => import('element-plus/es/locale/lang/fr').then(m => m.default),
  [LOCALE_TYPE.IT]: () => import('element-plus/es/locale/lang/it').then(m => m.default),
  [LOCALE_TYPE.JA]: () => import('element-plus/es/locale/lang/ja').then(m => m.default),
  [LOCALE_TYPE.KO]: () => import('element-plus/es/locale/lang/ko').then(m => m.default),
  [LOCALE_TYPE.PL]: () => import('element-plus/es/locale/lang/pl').then(m => m.default),
  [LOCALE_TYPE.PT_BR]: () => import('element-plus/es/locale/lang/pt-br').then(m => m.default),
  [LOCALE_TYPE.RU]: () => import('element-plus/es/locale/lang/ru').then(m => m.default),
  [LOCALE_TYPE.TR]: () => import('element-plus/es/locale/lang/tr').then(m => m.default),
  [LOCALE_TYPE.ZH_CN]: () => import('element-plus/es/locale/lang/zh-cn').then(m => m.default),
  [LOCALE_TYPE.ZH_TW]: () => import('element-plus/es/locale/lang/zh-tw').then(m => m.default),
} as const;

export const currentLanguage = ref<Language>();

export async function setElementLanguage(locale: LocaleType) {
  let loader = locales[locale];
  if (!loader) {
    loader = locales[LOCALE_TYPE.EN]!;
  }

  try {
    currentLanguage.value = await loader();
  }
  catch (error) {
    console.error('Failed to load Element Plus locale', error);
  }
}
