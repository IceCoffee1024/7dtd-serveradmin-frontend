import { expect, test } from '@playwright/test';
import { attachConsoleDiagnostics, collectLayoutIssues, login, openVisualScenario } from './helpers';

test.describe('Discord Integration visual layout', () => {
  test.beforeEach(async ({ page }) => {
    attachConsoleDiagnostics(page);
    await login(page);
  });

  for (const scenario of [
    { name: 'english desktop', url: '/#/en/discord-integration/settings', width: 1440, height: 900, dark: false },
    { name: 'chinese desktop', url: '/#/zh-cn/discord-integration/settings', width: 1440, height: 900, dark: false },
    { name: 'english tablet', url: '/#/en/discord-integration/settings', width: 768, height: 1024, dark: false },
    { name: 'english mobile', url: '/#/en/discord-integration/settings', width: 390, height: 844, dark: false },
    { name: 'english mobile dark', url: '/#/en/discord-integration/settings', width: 390, height: 844, dark: true },
  ]) {
    test(`${scenario.name} has no page-level layout overflow`, async ({ page }) => {
      await openVisualScenario(page, scenario);
      await expect(page.locator('.discord-settings')).toBeVisible();
      await expect(page.locator('.discord-settings-hero')).toBeVisible();
      await expect(page.locator('.discord-settings-hero__actions .el-button')).toHaveCount(3);
      await expect(page.locator('.discord-settings__diagnostics .el-button')).toBeVisible();

      const issues = await collectLayoutIssues(page, {
        rootSelector: '.discord-settings',
        ignoredOverflowSelectors: ['.discord-settings__form'],
        markerSelectors: { hero: '.discord-settings-hero' },
      });
      expect(issues.rootCount).toBe(1);
      expect(issues.markerCounts.hero).toBe(1);
      expect(issues.pageOverflow).toBe(0);
      expect(issues.bodyOverflow).toBe(0);
      expect(issues.realOverflow, JSON.stringify(issues.realOverflow, null, 2)).toEqual([]);
      expect(issues.textClips, JSON.stringify(issues.textClips, null, 2)).toEqual([]);
    });
  }
});
