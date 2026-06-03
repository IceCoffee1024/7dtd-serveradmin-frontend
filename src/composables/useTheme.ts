import { createSharedComposable, usePreferredDark } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useAppStore } from '~/stores/app';

const PALETTE_SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] as const;
const TOP_MENU_ALIGNMENT_MIGRATION_KEY = 'app.theme-settings.top-menu-center-migrated';

type PaletteVariant = '' | 'light-3' | 'light-5' | 'light-7' | 'light-8' | 'light-9' | 'dark-2';
type PaletteShade = typeof PALETTE_SHADES[number];

interface PaletteEntry {
  variant: PaletteVariant;
  shade: PaletteShade;
}

const ELEMENT_LIGHT_PALETTE_MAP = [
  { variant: '', shade: '500' }, // light-1
  { variant: 'light-3', shade: '400' },
  { variant: 'light-5', shade: '300' },
  { variant: 'light-7', shade: '200' },
  { variant: 'light-8', shade: '100' },
  { variant: 'light-9', shade: '50' },
  { variant: 'dark-2', shade: '600' },
] as const satisfies readonly PaletteEntry[];

const ELEMENT_DARK_PALETTE_MAP = [
  { variant: '', shade: '500' },
  { variant: 'light-3', shade: '600' },
  { variant: 'light-5', shade: '700' },
  { variant: 'light-7', shade: '800' },
  { variant: 'light-8', shade: '900' },
  { variant: 'light-9', shade: '950' },
  { variant: 'dark-2', shade: '400' },
] as const satisfies readonly PaletteEntry[];

export const useTheme = createSharedComposable(() => {
  const { themeSettings: currentTheme } = storeToRefs(useAppStore());

  const normalizeThemeSettings = () => {
    if (localStorage.getItem(TOP_MENU_ALIGNMENT_MIGRATION_KEY) === '1')
      return;

    const { layout } = currentTheme.value;
    if (layout.mode === 'top-menu' && layout.header.topMenuAlignment === 'left')
      layout.header.topMenuAlignment = 'center';

    localStorage.setItem(TOP_MENU_ALIGNMENT_MIGRATION_KEY, '1');
  };

  normalizeThemeSettings();

  const preferredDark = usePreferredDark();

  const isDark = computed({
    get: () => {
      const mode = currentTheme.value.appearance.mode;
      return mode === 'system' ? preferredDark.value : mode === 'dark';
    },
    set: (val: boolean) => {
      currentTheme.value.appearance.mode = val ? 'dark' : 'light';
    },
  });

  const setCssVar = (key: string, value: string) => {
    document.documentElement.style.setProperty(key, value);
  };

  const setElementColorPalette = (name: string, color: string) => {
    const palette = isDark.value ? ELEMENT_DARK_PALETTE_MAP : ELEMENT_LIGHT_PALETTE_MAP;

    palette.forEach(({ variant, shade }) => {
      setCssVar(`--el-color-${name}${variant ? `-${variant}` : ''}`, `var(--colors-${color}-${shade})`);
    });
  };

  const setColorVariables = (name: 'primary' | 'surface', color: string) => {
    setCssVar(`--colors-${name}`, `var(--colors-${color}-DEFAULT)`);
    PALETTE_SHADES.forEach((shade) => {
      setCssVar(`--colors-${name}-${shade}`, `var(--colors-${color}-${shade})`);
    });
  };

  const updateDom = (skipColorVars = false) => {
    const theme = currentTheme.value;
    const html = document.documentElement;

    html.classList.toggle('dark', isDark.value);
    html.classList.toggle('app-grayscale', theme.appearance.grayscale);
    html.classList.toggle('app-color-weak', theme.appearance.colorWeakness);

    const colors = theme.appearance.colors;
    setElementColorPalette('primary', colors.primary);
    setElementColorPalette('info', colors.info);
    setElementColorPalette('warning', colors.warning);
    setElementColorPalette('success', colors.success);
    setElementColorPalette('danger', colors.danger);

    if (!skipColorVars) {
      setColorVariables('primary', colors.primary);
      setColorVariables('surface', colors.surface);
    }
  };

  // Fast path: dark/light toggle only needs Element palette remapping (35 setProperty calls).
  // --colors-primary-* and --colors-surface-* are shade aliases that don't change between modes.
  watch(isDark, () => updateDom(true));

  // Full update when colors, grayscale, or colorWeakness change.
  watch(
    () => ({
      colors: currentTheme.value.appearance.colors,
      grayscale: currentTheme.value.appearance.grayscale,
      colorWeakness: currentTheme.value.appearance.colorWeakness,
    }),
    () => updateDom(false),
    { deep: true },
  );

  return {
    isDark,
    currentTheme,
    initTheme: updateDom,
  };
});
