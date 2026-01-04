import type { LocaleType } from '~/locales/constant';
import * as v from 'valibot';
import { LOCALE_TYPE } from '~/locales/constant';

const locales: Partial<Record<LocaleType, () => Promise<any>>> = {
  [LOCALE_TYPE.DE]: () => import('@valibot/i18n/de'),
  // [LOCALE_TYPE.EN]: () => import('@valibot/i18n/en'),
  [LOCALE_TYPE.ES]: () => import('@valibot/i18n/es'),
  [LOCALE_TYPE.FR]: () => import('@valibot/i18n/fr'),
  [LOCALE_TYPE.IT]: () => import('@valibot/i18n/it'),
  [LOCALE_TYPE.JA]: () => import('@valibot/i18n/ja'),
  [LOCALE_TYPE.KO]: () => import('@valibot/i18n/kr'),
  [LOCALE_TYPE.PL]: () => import('@valibot/i18n/pl'),
  [LOCALE_TYPE.PT_BR]: () => import('@valibot/i18n/pt'),
  [LOCALE_TYPE.RU]: () => import('@valibot/i18n/ru'),
  [LOCALE_TYPE.TR]: () => import('@valibot/i18n/tr'),
  [LOCALE_TYPE.ZH_CN]: () => import('@valibot/i18n/zh-CN'),
  [LOCALE_TYPE.ZH_TW]: () => import('@valibot/i18n/zh-TW'),
} as const;

const langMap: Record<string, string> = {
  [LOCALE_TYPE.KO]: 'kr',
  [LOCALE_TYPE.PT_BR]: 'pt',
  [LOCALE_TYPE.ZH_CN]: 'zh-CN',
  [LOCALE_TYPE.ZH_TW]: 'zh-TW',
} as const;

// Set the language configuration globally
export async function setValibotLanguage(locale: LocaleType) {
  const loader = locales[locale];
  if (!loader) {
    v.setGlobalConfig({ lang: LOCALE_TYPE.EN });
    return;
  }

  try {
    await loader();
    v.setGlobalConfig({ lang: langMap[locale] ?? locale });
  }
  catch (error) {
    console.error('Failed to load Valibot locale', error);
    v.setGlobalConfig({ lang: LOCALE_TYPE.EN });
  }
}

export default v;
