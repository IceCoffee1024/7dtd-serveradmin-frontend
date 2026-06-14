import { expect, test } from '@playwright/test';
import { attachConsoleDiagnostics, collectLayoutIssues, login, openVisualScenario } from './helpers';

test.describe('Critical interaction visual layout', () => {
  test.beforeEach(async ({ page }) => {
    attachConsoleDiagnostics(page);
    await login(page);
  });

  for (const scenario of [
    { name: 'desktop', url: '/#/en/feature-modules', width: 1440, height: 900, dark: false },
    { name: 'mobile', url: '/#/en/feature-modules', width: 390, height: 844, dark: false },
    { name: 'mobile dark', url: '/#/en/feature-modules', width: 390, height: 844, dark: true },
  ]) {
    test(`feature module detail drawer ${scenario.name} has no layout overflow`, async ({ page }) => {
      await openVisualScenario(page, scenario);
      await expect(page.locator('.feature-modules-page-root')).toBeVisible();
      await expect(page.locator('.feature-modules-page__table .el-table__row').first()).toBeVisible();

      await page.locator('.feature-modules-page__actions .el-button').first().click();
      await expect(page.locator('.el-drawer .feature-module-detail')).toBeVisible();
      await expect(page.locator('.feature-module-detail__section').first()).toBeVisible();
      await page.waitForFunction(() => {
        const drawer = document.querySelector('.el-drawer .feature-module-detail');
        const rect = drawer?.getBoundingClientRect();
        return rect != null && rect.left >= -2 && rect.right <= window.innerWidth + 2;
      });

      const issues = await collectLayoutIssues(page, {
        rootSelector: '.el-drawer .feature-module-detail',
        ignoredOverflowSelectors: ['.el-table', '.el-scrollbar'],
        textClipSelectors: [
          '.el-drawer[aria-modal="true"] .feature-module-detail h3',
          '.el-drawer[aria-modal="true"] .feature-module-detail .el-tag',
          '.el-drawer[aria-modal="true"] .feature-module-detail .el-button',
          '.el-drawer[aria-modal="true"] .feature-module-detail strong',
        ],
        markerSelectors: { detail: '.el-drawer .feature-module-detail' },
      });
      expect(issues.rootCount).toBe(1);
      expect(issues.markerCounts.detail).toBe(1);
      expect(issues.pageOverflow).toBe(0);
      expect(issues.bodyOverflow).toBe(0);
      expect(issues.realOverflow, JSON.stringify(issues.realOverflow, null, 2)).toEqual([]);
      expect(issues.textClips, JSON.stringify(issues.textClips, null, 2)).toEqual([]);
    });
  }

  for (const scenario of [
    { name: 'desktop', url: '/#/en/event-automation/rules', width: 1440, height: 900, dark: false },
    { name: 'mobile', url: '/#/en/event-automation/rules', width: 390, height: 844, dark: false },
    { name: 'mobile dark', url: '/#/en/event-automation/rules', width: 390, height: 844, dark: true },
  ]) {
    test(`event automation rule dialog ${scenario.name} has no layout overflow`, async ({ page }) => {
      await openVisualScenario(page, scenario);
      await expect(page.locator('.event-automation-rules-page')).toBeVisible();

      await page.locator('.event-automation-rules-page__table .table-toolbar .icon-button').first().click();
      await expect(page.locator('.event-automation-rule-dialog')).toBeVisible();
      await expect(page.locator('.event-automation-rule-dialog__body')).toBeVisible();
      await expect(page.locator('.event-automation-rule-dialog__footer .el-button')).toHaveCount(4);

      const issues = await collectLayoutIssues(page, {
        rootSelector: '.event-automation-rule-dialog',
        ignoredOverflowSelectors: ['.event-automation-json textarea', '.el-scrollbar', '.el-select-dropdown', '.el-tabs__nav-wrap', '.el-tabs__nav-scroll'],
        textClipSelectors: [
          '.event-automation-rule-dialog button',
          '.event-automation-rule-dialog .el-tag',
          '.event-automation-rule-dialog .el-form-item__label',
          '.event-automation-rule-dialog h3',
          '.event-automation-rule-dialog strong',
          '.event-automation-rule-dialog small',
        ],
        markerSelectors: { dialog: '.event-automation-rule-dialog', body: '.event-automation-rule-dialog__body' },
      });
      expect(issues.rootCount).toBe(1);
      expect(issues.markerCounts.dialog).toBe(1);
      expect(issues.markerCounts.body).toBe(1);
      expect(issues.pageOverflow).toBe(0);
      expect(issues.bodyOverflow).toBe(0);
      expect(issues.realOverflow, JSON.stringify(issues.realOverflow, null, 2)).toEqual([]);
      expect(issues.textClips, JSON.stringify(issues.textClips, null, 2)).toEqual([]);
    });
  }
});
