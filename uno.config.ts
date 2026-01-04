import type { Theme } from 'unocss/preset-wind4';
import {
  defineConfig,
  presetTypography,
  presetWind4,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss';

const cssPropMap: Record<string, string> = {
  text: 'color',
  bg: 'background-color',
  border: 'border-color',
} as const;

export default defineConfig({
  shortcuts: [
    {
      'flex-center': 'flex justify-center items-center',
    },
    {
      'ellipsis-text': 'overflow-hidden whitespace-nowrap text-ellipsis',
      'text-overflow': 'overflow-hidden text-ellipsis',
    },
    {
      // theme colors
      'shadow-card': 'shadow-[var(--el-box-shadow)]',
      'bg-base': 'bg-surface-50 dark:bg-surface-950',
      'bg-card': 'bg-surface-100 dark:bg-surface-900',
      'bg-overlay': 'bg-surface-200 dark:bg-surface-800',
      'border-base': 'border-solid border-[#f0f0f0] dark:border-[#1f1f1f]',
      'border-card': 'border-solid border-el-dark dark:border-el-light',
    },
  ],
  presets: [
    presetWind4({
      preflights: {
        theme: {
          mode: true,
        },
      },
    }),
    presetTypography(),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
  extendTheme: (theme: Theme) => {
    theme.colors = {
      ...theme.colors,
      tan: {
        50: '#faf4f0',
        100: '#f2e4d9',
        200: '#e6cdba',
        300: '#d6b194',
        400: '#cc966c',
        500: '#c57a45',
        600: '#b26532',
        700: '#944f29',
        800: '#7a4124',
        900: '#643621',
        950: '#3b1d10',
      },
    };

    // Change the DEFAULT value of each color to shade 500 for easier usage.
    Object.values(theme.colors as Required<Theme>['colors']).forEach((color) => {
      if (typeof color !== 'string' && color !== undefined) {
        color.DEFAULT = color[500] as string;
      }
    });

    theme.breakpoint = {
      ...theme.breakpoint,
      '3xl': '112rem',
      '4xl': '128rem',
    };
  },
  safelist: 'prose prose-sm m-auto text-left'.split(' '), // These classes are included by force, even if they are not used in the code.
  rules: [
    [
      /^(text|bg|border)-el-(.*)$/,
      ([_, type, color]) => {
        return { [cssPropMap[type]]: color === 'base' ? `var(--el-${type}-color)` : `var(--el-${type}-color-${color})` };
      },
    ],
    [
      /^(text|bg|border)-(primary|surface)-(.*)$/,
      ([_, type, color, shade]) => {
        return { [cssPropMap[type]]: `var(--colors-${color}-${shade})` };
      },
    ],
    [
      /^(text|bg|border)-(primary|surface)$/,
      ([_, type, color]) => {
        return { [cssPropMap[type]]: `var(--colors-${color})` };
      },
    ],
  ],
});
