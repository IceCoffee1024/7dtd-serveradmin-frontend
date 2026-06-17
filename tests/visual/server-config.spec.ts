import { expect, test } from '@playwright/test';
import { attachConsoleDiagnostics, collectLayoutIssues, login, openVisualScenario } from './helpers';

test.describe('Server Config visual layout', () => {
  test.beforeEach(async ({ page }) => {
    attachConsoleDiagnostics(page);
    await login(page);
  });

  for (const scenario of [
    { name: 'english desktop', url: '/#/en/server-config', width: 1440, height: 900, dark: false },
    { name: 'chinese desktop', url: '/#/zh-cn/server-config', width: 1440, height: 900, dark: false },
    { name: 'english tablet', url: '/#/en/server-config', width: 768, height: 1024, dark: false },
    { name: 'english mobile', url: '/#/en/server-config', width: 390, height: 844, dark: false },
    { name: 'english mobile dark', url: '/#/en/server-config', width: 390, height: 844, dark: true },
  ]) {
    test(`${scenario.name} has no page-level layout overflow`, async ({ page }) => {
      await openVisualScenario(page, scenario);
      await expect(page.locator('.server-config-page')).toBeVisible();
      await expect(page.locator('.server-config-collapse')).toBeVisible();
      await expect(page.locator('.server-config-collapse .el-collapse-item')).not.toHaveCount(0);

      const issues = await collectLayoutIssues(page, {
        rootSelector: '.server-config-page',
        ignoredOverflowSelectors: ['.el-table', '.el-scrollbar', '.el-collapse-item__content'],
        textClipSelectors: [
          '.server-config-page .el-collapse-item__header',
          '.server-config-page .el-tag',
          '.server-config-page button',
        ],
        markerSelectors: {
          page: '.server-config-page',
          collapse: '.server-config-collapse',
        },
      });

      expect(issues.rootCount).toBe(1);
      expect(issues.markerCounts.page).toBe(1);
      expect(issues.markerCounts.collapse).toBe(1);
      expect(issues.pageOverflow).toBe(0);
      expect(issues.bodyOverflow).toBe(0);
      expect(issues.realOverflow, JSON.stringify(issues.realOverflow, null, 2)).toEqual([]);
      expect(issues.textClips, JSON.stringify(issues.textClips, null, 2)).toEqual([]);
    });
  }
});
