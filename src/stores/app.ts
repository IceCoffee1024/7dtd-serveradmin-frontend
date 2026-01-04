import type { PartialDeep } from 'type-fest';
import { useStorage } from '@vueuse/core';
import { cloneDeep, merge } from 'es-toolkit';
import { defineStore } from 'pinia';

const STORAGE_THEME_SETTINGS_KEY = 'app.theme-settings';

const DEFAULT_THEME = 'blue';

const BASE_THEME_SETTINGS = {
  appearance: {
    mode: 'system',
    grayscale: false,
    colorWeakness: false,
    colors: {
      primary: 'blue',
      info: 'gray',
      warning: 'amber',
      success: 'green',
      danger: 'red',
      surface: 'neutral',
    },
  },
  layout: {
    mode: 'side-menu',
    header: {
      height: 56,
      showLogo: true,
      showTitle: true,
      showMenuCollapseBtn: true,
      showBreadcrumb: false,
      showBreadcrumbIcon: true,
      topMenuAlignment: 'left',
      // showGlobalSearchBtn: true,
      showFullscreenBtn: true,
      showLanguageSwitchBtn: true,
      showThemeConfigBtn: true,
    },
    sidebar: {
      collapsed: false,
      width: 250,
      collapsedWidth: 64,
    },
    tab: {
      visible: true,
      height: 40,
      showIcon: true,
      style: 'google',
    },
    footer: {
      visible: true,
      height: 48,
    },
  },
  general: {
    showTransitionAnimation: true,
    tableSize: 'default',
    scrollMode: 'outer',
    contextMenuStyle: 'default',
    popBoxStyle: 'element-plus',
  },
} as const satisfies App.ThemeSettings;

const THEME_PRESETS: Record<string, PartialDeep<App.ThemeSettings>> = {
  blue: {
  },

  violet: {
    appearance: {
      colors: {
        primary: 'violet',
        surface: 'slate',
      },
    },
  },

  teal: {
    appearance: {
      colors: {
        primary: 'teal',
        success: 'green',
        surface: 'gray',
      },
    },
  },

  pink: {
    appearance: {
      colors: {
        primary: 'pink',
        surface: 'stone',
      },
    },
  },

  tan: {
    appearance: {
      colors: {
        primary: 'tan',
        surface: 'stone',
        info: 'blue',
        warning: 'amber',
        success: 'emerald',
        danger: 'rose',
      },
    },
  },

  zinc: {
    appearance: {
      colors: {
        primary: 'zinc',
        info: 'zinc',
        surface: 'zinc',
      },
    },
  },

} as const;

export const useAppStore = defineStore('app', () => {
  const createThemePreset = (overrides: PartialDeep<App.ThemeSettings>): App.ThemeSettings => {
    return merge(cloneDeep(BASE_THEME_SETTINGS), overrides);
  };

  const getThemePresets = () => {
    return Object.fromEntries(
      Object.entries(THEME_PRESETS).map(([key, value]) => [
        key,
        createThemePreset(value),
      ]),
    );
  };

  const themeSettings = useStorage<App.ThemeSettings>(
    STORAGE_THEME_SETTINGS_KEY,
    createThemePreset(THEME_PRESETS[DEFAULT_THEME]),
    localStorage,
    { mergeDefaults: (storeValue, defaults) => merge(defaults, storeValue) },
  );

  return { themeSettings, getThemePresets };
});
