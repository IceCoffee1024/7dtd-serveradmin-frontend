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
      await expect(page.locator('.discord-settings__tabs')).toBeVisible();
      await expect(page.locator('.discord-settings__tabs .el-tabs__item')).toHaveCount(6);

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

  for (const scenario of [
    { name: 'bot diagnostics desktop', url: '/#/en/discord-integration/settings', width: 1440, height: 900, dark: false },
    { name: 'bot diagnostics mobile', url: '/#/en/discord-integration/settings', width: 390, height: 844, dark: false },
  ]) {
    test(`${scenario.name} tab has no page-level layout overflow`, async ({ page }) => {
      await openVisualScenario(page, scenario);
      await expect(page.locator('.discord-settings')).toBeVisible();
      await page.getByRole('tab', { name: 'Bot & commands' }).click();
      await expect(page.locator('.discord-settings__diagnostics .el-button')).toBeVisible();

      const issues = await collectLayoutIssues(page, {
        rootSelector: '.discord-settings',
        ignoredOverflowSelectors: ['.discord-settings__form'],
        markerSelectors: { diagnostics: '.discord-settings__diagnostics' },
      });
      expect(issues.rootCount).toBe(1);
      expect(issues.markerCounts.diagnostics).toBe(1);
      expect(issues.pageOverflow).toBe(0);
      expect(issues.bodyOverflow).toBe(0);
      expect(issues.realOverflow, JSON.stringify(issues.realOverflow, null, 2)).toEqual([]);
      expect(issues.textClips, JSON.stringify(issues.textClips, null, 2)).toEqual([]);
    });
  }

  for (const scenario of [
    { name: 'alerts desktop', url: '/#/en/discord-integration/settings', width: 1440, height: 900, dark: false },
    { name: 'alerts mobile', url: '/#/en/discord-integration/settings', width: 390, height: 844, dark: false },
  ]) {
    test(`${scenario.name} tab has no page-level layout overflow`, async ({ page }) => {
      await openVisualScenario(page, scenario);
      await expect(page.locator('.discord-settings')).toBeVisible();
      await page.getByRole('tab', { name: 'Alerts & diagnostics' }).click();
      await expect(page.locator('.discord-settings__section').filter({ hasText: 'Automation failure alerts' })).toBeVisible();
      await expect(page.locator('.discord-settings__section').filter({ hasText: 'Relay tests' })).toBeVisible();

      const issues = await collectLayoutIssues(page, {
        rootSelector: '.discord-settings',
        ignoredOverflowSelectors: ['.discord-settings__form'],
        markerSelectors: { tabs: '.discord-settings__tabs' },
      });
      expect(issues.rootCount).toBe(1);
      expect(issues.markerCounts.tabs).toBe(1);
      expect(issues.pageOverflow).toBe(0);
      expect(issues.bodyOverflow).toBe(0);
      expect(issues.realOverflow, JSON.stringify(issues.realOverflow, null, 2)).toEqual([]);
      expect(issues.textClips, JSON.stringify(issues.textClips, null, 2)).toEqual([]);
    });
  }
});
