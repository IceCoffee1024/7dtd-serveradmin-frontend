import type { LocaleType } from '~/locales/constant';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import isLeapYear from 'dayjs/plugin/isLeapYear';
import relativeTime from 'dayjs/plugin/relativeTime';
import { LOCALE_TYPE } from '~/locales/constant';

const locales: Partial<Record<LocaleType, () => Promise<ILocale>>> = {
  [LOCALE_TYPE.DE]: () => import('dayjs/locale/de'),
  // [LOCALE_TYPE.EN]: () => import('dayjs/locale/en'),
  [LOCALE_TYPE.ES]: () => import('dayjs/locale/es'),
  [LOCALE_TYPE.FR]: () => import('dayjs/locale/fr'),
  [LOCALE_TYPE.IT]: () => import('dayjs/locale/it'),
  [LOCALE_TYPE.JA]: () => import('dayjs/locale/ja'),
  [LOCALE_TYPE.KO]: () => import('dayjs/locale/ko'),
  [LOCALE_TYPE.PL]: () => import('dayjs/locale/pl'),
  [LOCALE_TYPE.PT_BR]: () => import('dayjs/locale/pt-br'),
  [LOCALE_TYPE.RU]: () => import('dayjs/locale/ru'),
  [LOCALE_TYPE.TR]: () => import('dayjs/locale/tr'),
  [LOCALE_TYPE.ZH_CN]: () => import('dayjs/locale/zh-cn'),
  [LOCALE_TYPE.ZH_TW]: () => import('dayjs/locale/zh-tw'),
} as const;

// use plugin
dayjs.extend(isLeapYear);
dayjs.extend(duration);
dayjs.extend(relativeTime);

const defaultTemplate = 'YYYY-MM-DD HH:mm:ss';
dayjs.extend((_option, dayjsClass) => {
  const oldFormat = dayjsClass.prototype.format;

  dayjsClass.prototype.format = function (template?: string) {
    return oldFormat.bind(this)(template ?? defaultTemplate);
  };
});

export async function setDayjsLanguage(locale: LocaleType) {
  const loader = locales[locale];
  if (!loader) {
    dayjs.locale(LOCALE_TYPE.EN);
    return;
  }

  try {
    const preset = await loader();
    dayjs.locale(preset.name);
  }
  catch (error) {
    console.error('Failed to load Day.js locale', error);
    dayjs.locale(LOCALE_TYPE.EN);
  }
}

export default dayjs;
