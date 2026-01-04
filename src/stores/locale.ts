import type { LocaleType } from '~/locales/constant';
import { useStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import { LOCALE_CONFIGS, STORAGE_LOCALE_KEY, SUPPORT_LOCALES } from '~/locales/constant';
import { setDayjsLanguage } from '~/plugins/dayjs';
import { setElementLanguage } from '~/plugins/element-plus';
import { i18n, setI18nLanguage } from '~/plugins/i18n';
import { setValibotLanguage } from '~/plugins/valibot';

export const useLocaleStore = defineStore('locale', () => {
  const storedLocale = useStorage<LocaleType>(STORAGE_LOCALE_KEY, i18n.global.locale.value as LocaleType);
  let lastLoadedLocale: string = '';

  const languageEnglishName = computed(() => {
    return LOCALE_CONFIGS[storedLocale.value].englishName;
  });

  const localeOptions = computed(() =>
    SUPPORT_LOCALES.map(locale => ({
      label: LOCALE_CONFIGS[locale]?.nativeName ?? locale,
      value: locale,
    })),
  );

  const applyLocale = async (locale: LocaleType) => {
    if (locale === lastLoadedLocale) {
      return;
    }

    await Promise.all([setI18nLanguage(locale), setElementLanguage(locale), setDayjsLanguage(locale), setValibotLanguage(locale)]);

    storedLocale.value = locale;
    lastLoadedLocale = locale;
    return nextTick();
  };

  return { currentLocale: storedLocale, languageEnglishName, localeOptions, applyLocale };
});
