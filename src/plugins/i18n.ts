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

function isSupportedLocale(locale: unknown): locale is LocaleType {
  return typeof locale === 'string' && (SUPPORT_LOCALES as readonly string[]).includes(locale);
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

        // Fuzzy match (starts with the code)
        const fuzzyMatch = Object.values(LOCALE_TYPE).find(supported =>
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

  // 1. Check saved language preference
  if (savedLang && isSupportedLocale(savedLang)) {
    console.log('✅ Using saved language:', savedLang);
    return savedLang;
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
  messages: {
    en,
  } as Record<string, any>,
  globalInjection: true, // In <template> can use $t
});

const getResourceMessages = (r: any) => r.default || r;
async function loadLocaleMessages(locale: LocaleType) {
  // load locale messages with dynamic import
  const messages = await import(`../locales/${locale}.json`).then(getResourceMessages);

  // set locale and locale message
  i18n.global.setLocaleMessage(locale, messages);
}

async function setI18nLanguage(locale: LocaleType) {
  try {
    if (!i18n.global.availableLocales.includes(locale)) {
      await loadLocaleMessages(locale);
    }

    i18n.global.locale.value = locale;

    /**
     * NOTE:
     * If you need to specify the language setting for headers, such as the `fetch` API, set it here.
     * The following is an example for axios.
     *
     * axios.defaults.headers.common['Accept-Language'] = locale
     */

    document.querySelector('html')!.setAttribute('lang', locale);
  }
  catch (error) {
    console.error(`Failed to load locale messages for language: ${locale}`, error);
  }
}

function setupI18n(app: App) {
  app.use(i18n);
}

export { i18n, isSupportedLocale, setI18nLanguage, setupI18n };
