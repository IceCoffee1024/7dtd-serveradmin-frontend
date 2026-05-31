import type { Language } from '~/generated/api/types.gen';
import type { LocaleType } from '~/locales/constant';
import { useStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import { LOCALE_CONFIGS, STORAGE_LOCALE_KEY, SUPPORT_LOCALES } from '~/locales/constant';
import { setDayjsLanguage } from '~/plugins/dayjs';
import { setElementLanguage } from '~/plugins/elementPlus';
import { i18n, resolveSupportedLocale, setI18nLanguage } from '~/plugins/i18n';
import { setValibotLanguage } from '~/plugins/valibot';

export const useLocaleStore = defineStore('locale', () => {
  const storedLocale = useStorage<LocaleType>(STORAGE_LOCALE_KEY, resolveSupportedLocale(i18n.global.locale.value));
  let lastLoadedLocale: string = '';

  storedLocale.value = resolveSupportedLocale(storedLocale.value);

  const languageEnglishName = computed(() => {
    return LOCALE_CONFIGS[resolveSupportedLocale(storedLocale.value)].englishName as Language;
  });

  const localeOptions = computed(() =>
    SUPPORT_LOCALES.map(locale => ({
      label: LOCALE_CONFIGS[locale]?.nativeName ?? locale,
      value: locale,
    })),
  );

  const applyLocale = async (locale: LocaleType) => {
    const resolvedLocale = resolveSupportedLocale(locale);

    if (resolvedLocale === lastLoadedLocale) {
      return;
    }

    await Promise.all([
      setI18nLanguage(resolvedLocale),
      setElementLanguage(resolvedLocale),
      setDayjsLanguage(resolvedLocale),
      setValibotLanguage(resolvedLocale),
    ]);

    storedLocale.value = resolvedLocale;
    lastLoadedLocale = resolvedLocale;
    return nextTick();
  };

  return { currentLocale: storedLocale, languageEnglishName, localeOptions, applyLocale };
});
