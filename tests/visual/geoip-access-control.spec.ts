import { expect, test } from '@playwright/test';
import { attachConsoleDiagnostics, collectLayoutIssues, login, openVisualScenario } from './helpers';

test.describe('GeoIP Access Control visual layout', () => {
  test.beforeEach(async ({ page }) => {
    attachConsoleDiagnostics(page);
    await login(page);
  });

  for (const scenario of [
    { name: 'english desktop', url: '/#/en/geoip-access-control/settings', width: 1440, height: 900, dark: false },
    { name: 'chinese desktop', url: '/#/zh-cn/geoip-access-control/settings', width: 1440, height: 900, dark: false },
    { name: 'english tablet', url: '/#/en/geoip-access-control/settings', width: 768, height: 1024, dark: false },
    { name: 'english mobile', url: '/#/en/geoip-access-control/settings', width: 390, height: 844, dark: false },
    { name: 'english mobile dark', url: '/#/en/geoip-access-control/settings', width: 390, height: 844, dark: true },
  ]) {
    test(`${scenario.name} has no page-level layout overflow`, async ({ page }) => {
      await openVisualScenario(page, scenario);
      await expect(page.locator('.geoip-settings')).toBeVisible();
      await expect(page.locator('.geoip-settings__header')).toBeVisible();
      await expect(page.locator('.geoip-settings__form')).toBeVisible();
      await expect(page.locator('.geoip-settings__runtime')).toBeVisible();

      const issues = await collectLayoutIssues(page, {
        rootSelector: '.geoip-settings',
        ignoredOverflowSelectors: ['.el-table', '.el-scrollbar', '.geoip-settings__form'],
        markerSelectors: {
          form: '.geoip-settings__form',
          runtime: '.geoip-settings__runtime',
        },
      });
      expect(issues.rootCount).toBe(1);
      expect(issues.markerCounts.form).toBe(1);
      expect(issues.markerCounts.runtime).toBe(1);
      expect(issues.pageOverflow).toBe(0);
      expect(issues.bodyOverflow).toBe(0);
      expect(issues.realOverflow, JSON.stringify(issues.realOverflow, null, 2)).toEqual([]);
      expect(issues.textClips, JSON.stringify(issues.textClips, null, 2)).toEqual([]);
    });
  }

  for (const scenario of [
    { name: 'provider switch desktop', url: '/#/en/geoip-access-control/settings', width: 1440, height: 900, dark: false },
    { name: 'provider switch mobile', url: '/#/en/geoip-access-control/settings', width: 390, height: 844, dark: false },
  ]) {
    test(`${scenario.name} keeps token field and lookup controls stable`, async ({ page }) => {
      await openVisualScenario(page, scenario);
      await expect(page.locator('.geoip-settings')).toBeVisible();
      await expect(page.locator('.swal2-container')).toHaveCount(0);

      await page.locator('.geoip-settings__provider-card').filter({ hasText: 'ipinfo.io' }).click();
      await expect(page.getByLabel('ipinfo token')).toBeVisible();
      await page.locator('.geoip-settings__test .el-input__inner').fill('1.1.1.1');

      const issues = await collectLayoutIssues(page, {
        rootSelector: '.geoip-settings',
        ignoredOverflowSelectors: ['.el-table', '.el-scrollbar', '.geoip-settings__form'],
        markerSelectors: { testControls: '.geoip-settings__test' },
      });
      expect(issues.rootCount).toBe(1);
      expect(issues.markerCounts.testControls).toBe(1);
      expect(issues.pageOverflow).toBe(0);
      expect(issues.bodyOverflow).toBe(0);
      expect(issues.realOverflow, JSON.stringify(issues.realOverflow, null, 2)).toEqual([]);
      expect(issues.textClips, JSON.stringify(issues.textClips, null, 2)).toEqual([]);
    });
  }
});
