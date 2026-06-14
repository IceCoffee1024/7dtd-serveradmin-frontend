import { expect, test } from '@playwright/test';
import { attachConsoleDiagnostics, collectLayoutIssues, login, openVisualScenario } from './helpers';

test.describe('Event Automation Rules visual layout', () => {
  test.beforeEach(async ({ page }) => {
    attachConsoleDiagnostics(page);
    await login(page);
  });

  for (const scenario of [
    { name: 'english desktop', url: '/#/en/event-automation/rules', width: 1440, height: 900, dark: false },
    { name: 'english mobile', url: '/#/en/event-automation/rules', width: 390, height: 844, dark: false },
    { name: 'english mobile dark', url: '/#/en/event-automation/rules', width: 390, height: 844, dark: true },
  ]) {
    test(`${scenario.name} has stable rules dashboard layout`, async ({ page }) => {
      await openVisualScenario(page, scenario);
      await expect(page.locator('.event-automation-rules-page')).toBeVisible();
      await expect(page.locator('.event-automation-run-stats')).toBeVisible();
      await expect(page.locator('.el-table')).toBeVisible();

      const issues = await collectLayoutIssues(page, {
        rootSelector: '.event-automation-rules-page',
        ignoredOverflowSelectors: ['.el-table', '.el-scrollbar', '.event-automation-run-stats'],
      });
      expect(issues.rootCount).toBe(1);
      expect(issues.pageOverflow).toBe(0);
      expect(issues.bodyOverflow).toBe(0);
      expect(issues.realOverflow, JSON.stringify(issues.realOverflow, null, 2)).toEqual([]);
      expect(issues.textClips, JSON.stringify(issues.textClips, null, 2)).toEqual([]);
    });
  }
});
