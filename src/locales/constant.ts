export const LOCALE_TYPE = {
  DE: 'de',
  EN: 'en',
  ES: 'es',
  FR: 'fr',
  IT: 'it',
  JA: 'ja',
  KO: 'ko',
  PL: 'pl',
  PT_BR: 'pt-br',
  RU: 'ru',
  TR: 'tr',
  ZH_CN: 'zh-cn',
  ZH_TW: 'zh-tw',
} as const;
export type LocaleType = typeof LOCALE_TYPE[keyof typeof LOCALE_TYPE];

export const SUPPORT_LOCALES: LocaleType[] = [
  LOCALE_TYPE.EN,
  LOCALE_TYPE.ZH_CN,
] as const;

export const STORAGE_LOCALE_KEY = 'locale';

interface LocaleConfig {
  englishName: string;
  nativeName: string;
}

export const LOCALE_CONFIGS: Record<LocaleType, LocaleConfig> = {
  [LOCALE_TYPE.DE]: { englishName: 'german', nativeName: 'Deutsch' },
  [LOCALE_TYPE.EN]: { englishName: 'english', nativeName: 'English' },
  [LOCALE_TYPE.ES]: { englishName: 'spanish', nativeName: 'Español' },
  [LOCALE_TYPE.FR]: { englishName: 'french', nativeName: 'Français' },
  [LOCALE_TYPE.IT]: { englishName: 'italian', nativeName: 'Italiano' },
  [LOCALE_TYPE.JA]: { englishName: 'japanese', nativeName: '日本語' },
  [LOCALE_TYPE.KO]: { englishName: 'korean', nativeName: '한국어' },
  [LOCALE_TYPE.PL]: { englishName: 'polish', nativeName: 'Polski' },
  [LOCALE_TYPE.PT_BR]: { englishName: 'brazilian', nativeName: 'Português (Brasil)' },
  [LOCALE_TYPE.RU]: { englishName: 'russian', nativeName: 'Русский' },
  [LOCALE_TYPE.TR]: { englishName: 'turkish', nativeName: 'Türkçe' },
  [LOCALE_TYPE.ZH_TW]: { englishName: 'tchinese', nativeName: '繁體中文' },
  [LOCALE_TYPE.ZH_CN]: { englishName: 'schinese', nativeName: '简体中文' },
} as const;
