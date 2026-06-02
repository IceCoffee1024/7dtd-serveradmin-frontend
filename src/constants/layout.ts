import type { LocaleType } from '~/locales/constant';
import { LOCALE_TYPE } from '~/locales/constant';

export const LAYOUT_LIMITS = {
  minHeaderHeight: 48,
  minSidebarWidth: 220,
  minNonChineseSidebarWidth: 280,
  minSidebarCollapsedWidth: 56,
  minTabHeight: 32,
  minFooterHeight: 96,
} as const;

export function isChineseLocale(locale: LocaleType): boolean {
  return locale === LOCALE_TYPE.ZH_CN || locale === LOCALE_TYPE.ZH_TW;
}

export function getExpandedSidebarMinWidth(locale: LocaleType): number {
  return isChineseLocale(locale)
    ? LAYOUT_LIMITS.minSidebarWidth
    : LAYOUT_LIMITS.minNonChineseSidebarWidth;
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
