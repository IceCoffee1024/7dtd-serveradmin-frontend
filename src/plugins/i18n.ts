import type { App } from 'vue';
import type { LocaleType } from '~/locales/constant';

/*
 * All i18n resources specified in the plugin `include` option can be loaded
 * at once using the import syntax
 */
// import messages from '@intlify/unplugin-vue-i18n/messages';
import { createI18n } from 'vue-i18n';
import { LOCALE_TYPE, STORAGE_LOCALE_KEY, SUPPORT_LOCALES } from '~/locales/constant';
import en from '../locales/en.json';
import zhCN from '../locales/zh-cn.json';
import zhTW from '../locales/zh-tw.json';

type LocaleMessages = Record<string, any>;

const getResourceMessages = (r: any) => r.default || r;

const staticMessages: Partial<Record<LocaleType, LocaleMessages>> = {
  [LOCALE_TYPE.EN]: en,
  [LOCALE_TYPE.ZH_CN]: zhCN,
  [LOCALE_TYPE.ZH_TW]: zhTW,
};

const lazyMessageLoaders: Partial<Record<LocaleType, () => Promise<LocaleMessages>>> = {
  [LOCALE_TYPE.DE]: () => import('../locales/de.json').then(getResourceMessages),
  [LOCALE_TYPE.ES]: () => import('../locales/es.json').then(getResourceMessages),
  [LOCALE_TYPE.FR]: () => import('../locales/fr.json').then(getResourceMessages),
  [LOCALE_TYPE.IT]: () => import('../locales/it.json').then(getResourceMessages),
  [LOCALE_TYPE.JA]: () => import('../locales/ja.json').then(getResourceMessages),
  [LOCALE_TYPE.KO]: () => import('../locales/ko.json').then(getResourceMessages),
  [LOCALE_TYPE.PL]: () => import('../locales/pl.json').then(getResourceMessages),
  [LOCALE_TYPE.PT_BR]: () => import('../locales/pt-br.json').then(getResourceMessages),
  [LOCALE_TYPE.RU]: () => import('../locales/ru.json').then(getResourceMessages),
  [LOCALE_TYPE.TR]: () => import('../locales/tr.json').then(getResourceMessages),
};

function isSupportedLocale(locale: unknown): locale is LocaleType {
  return typeof locale === 'string' && (SUPPORT_LOCALES as readonly string[]).includes(locale);
}

function resolveSupportedLocale(locale: unknown): LocaleType {
  return isSupportedLocale(locale) ? locale : LOCALE_TYPE.EN;
}

/**
 * Parse the browser's language settings to find a supported language
 */
function parseBrowserLanguage(): LocaleType | null {
  try {
    // Get the list of browser languages (in order of preference)
    const browserLangs = navigator.languages || [navigator.language];
    console.log('🌐 Browser languages:', browserLangs);

    // Iterate over the list of browser languages
    for (const browserLang of browserLangs) {
      const locale = new Intl.Locale(browserLang);

      // Build possible language codes
      const codes: string[] = [];

      // Full code (if region is present)
      if (locale.region) {
        codes.push(`${locale.language}-${locale.region}`.toLowerCase());
      }

      // Language code only
      codes.push(locale.language.toLowerCase());

      console.log(`Trying:  ${browserLang} → ${codes.join(', ')}`);

      // Find a match
      for (const code of codes) {
        // Exact match
        if (isSupportedLocale(code)) {
          return code;
        }

        // Fuzzy match only against locales that this app can actually load.
        const fuzzyMatch = SUPPORT_LOCALES.find(supported =>
          supported.startsWith(code),
        );
        if (fuzzyMatch) {
          return fuzzyMatch;
        }
      }
    }
  }
  catch (error) {
    console.error('Failed to parse browser language:', error);
  }

  return null;
}

/**
 * Detect the user's preferred locale
 */
function detectPreferredLocale(): LocaleType {
  const savedLang = localStorage.getItem(STORAGE_LOCALE_KEY);
  const normalizedSavedLang = savedLang?.toLowerCase();

  // 1. Check saved language preference
  if (isSupportedLocale(normalizedSavedLang)) {
    console.log('✅ Using saved language:', normalizedSavedLang);
    return normalizedSavedLang;
  }

  if (savedLang) {
    localStorage.removeItem(STORAGE_LOCALE_KEY);
  }

  // 2. Parse browser language
  const browserLang = parseBrowserLanguage();
  if (browserLang) {
    console.log('✅ Detected browser language:', browserLang);
    return browserLang;
  }

  // 3. Default to English
  console.log('⚠️ Using default language:', LOCALE_TYPE.EN);
  return LOCALE_TYPE.EN;
}

const i18n = createI18n({
  locale: detectPreferredLocale(),
  fallbackLocale: LOCALE_TYPE.EN,
  legacy: false,
  messages: staticMessages as Record<string, LocaleMessages>,
  globalInjection: true, // In <template> can use $t
});

async function loadLocaleMessages(locale: LocaleType) {
  const messages = staticMessages[locale] ?? await lazyMessageLoaders[locale]?.();
  if (!messages) {
    throw new Error(`Unsupported locale: ${locale}`);
  }

  // set locale and locale message
  i18n.global.setLocaleMessage(locale, messages);
}

async function setI18nLanguage(locale: LocaleType) {
  const resolvedLocale = resolveSupportedLocale(locale);

  try {
    if (!i18n.global.availableLocales.includes(resolvedLocale)) {
      await loadLocaleMessages(resolvedLocale);
    }

    i18n.global.locale.value = resolvedLocale;

    /**
     * NOTE:
     * If you need to specify the language setting for headers, such as the `fetch` API, set it here.
     * The following is an example for axios.
     *
     * axios.defaults.headers.common['Accept-Language'] = locale
     */

    document.querySelector('html')!.setAttribute('lang', resolvedLocale);
  }
  catch (error) {
    console.error(`Failed to load locale messages for language: ${resolvedLocale}`, error);
  }
}

function setupI18n(app: App) {
  app.use(i18n);
}

if (import.meta.hot) {
  const localeFiles = import.meta.glob<Record<string, any>>('../locales/*.json');
  const localePaths = Object.keys(localeFiles);

  import.meta.hot.accept(localePaths, (modules) => {
    if (!modules) {
      return;
    }
    localePaths.forEach((filePath, index) => {
      const mod = modules[index];
      if (!mod) {
        return;
      }
      const locale = filePath.match(/\/([^/]+)\.json$/)?.[1];
      if (locale && isSupportedLocale(locale) && i18n.global.availableLocales.includes(locale)) {
        i18n.global.setLocaleMessage(locale, mod.default ?? mod);
      }
    });
  });
}

export { i18n, isSupportedLocale, resolveSupportedLocale, setI18nLanguage, setupI18n };
