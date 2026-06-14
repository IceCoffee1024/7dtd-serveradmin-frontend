import { expect, test } from '@playwright/test';
import { attachConsoleDiagnostics, collectLayoutIssues, login, openVisualScenario } from './helpers';

test.describe('Economy Shop visual layout', () => {
  test.beforeEach(async ({ page }) => {
    attachConsoleDiagnostics(page);
    await login(page);
  });

  for (const scenario of [
    { name: 'english desktop', url: '/#/en/economy/shop', width: 1440, height: 900, dark: false },
    { name: 'english mobile', url: '/#/en/economy/shop', width: 390, height: 844, dark: false },
    { name: 'english mobile dark', url: '/#/en/economy/shop', width: 390, height: 844, dark: true },
  ]) {
    test(`${scenario.name} has stable table and dialog layout`, async ({ page }) => {
      await openVisualScenario(page, scenario);
      await expect(page.locator('.my-table-root')).toBeVisible();
      await expect(page.locator('.el-table')).toBeVisible();
      await expect(page.locator('.my-table-root .table-toolbar')).toBeVisible();

      const issues = await collectLayoutIssues(page, {
        rootSelector: '.my-table-root',
        ignoredOverflowSelectors: ['.el-table', '.el-scrollbar'],
      });
      expect(issues.rootCount).toBe(1);
      expect(issues.pageOverflow).toBe(0);
      expect(issues.bodyOverflow).toBe(0);
      expect(issues.realOverflow, JSON.stringify(issues.realOverflow, null, 2)).toEqual([]);
      expect(issues.textClips, JSON.stringify(issues.textClips, null, 2)).toEqual([]);
    });
  }
});
