import type { LocaleType } from '~/locales/constant';
import { LOCALE_TYPE } from '~/locales/constant';

export const LAYOUT_LIMITS = {
  minHeaderHeight: 48,
  minSidebarWidth: 220,
  minNonChineseSidebarWidth: 320,
  minLongTextSidebarWidth: 320,
  minSidebarCollapsedWidth: 64,
  minTabHeight: 32,
  minFooterHeight: 96,
} as const;

export function isChineseLocale(locale: LocaleType): boolean {
  return locale === LOCALE_TYPE.ZH_CN || locale === LOCALE_TYPE.ZH_TW;
}

export function isLongTextSidebarLocale(locale: LocaleType): boolean {
  return locale === LOCALE_TYPE.DE || locale === LOCALE_TYPE.RU || locale === LOCALE_TYPE.TR;
}

export function getExpandedSidebarMinWidth(locale: LocaleType): number {
  if (isChineseLocale(locale))
    return LAYOUT_LIMITS.minSidebarWidth;

  if (isLongTextSidebarLocale(locale))
    return LAYOUT_LIMITS.minLongTextSidebarWidth;

  return LAYOUT_LIMITS.minNonChineseSidebarWidth;
}

export function resolveExpandedSidebarWidth(width: number | string, locale: LocaleType): number | string {
  const minWidth = getExpandedSidebarMinWidth(locale);

  if (typeof width === 'number') {
    return Math.max(width, minWidth);
  }

  const numericWidth = Number.parseFloat(width);
  return Number.isFinite(numericWidth)
    ? `${Math.max(numericWidth, minWidth)}px`
    : width;
}
