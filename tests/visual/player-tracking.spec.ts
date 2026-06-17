import { expect, test } from '@playwright/test';
import { attachConsoleDiagnostics, collectLayoutIssues, login, openVisualScenario } from './helpers';

async function resolveVisualPlayerId(page: import('@playwright/test').Page): Promise<string> {
  const playerId = await page.evaluate(async () => {
    const headers: Record<string, string> = { Accept: 'application/json' };
    const raw = sessionStorage.getItem('userInfo.auth_data') ?? localStorage.getItem('userInfo.auth_data');
    const token = raw ? (JSON.parse(raw) as { accessToken?: string }).accessToken : undefined;
    if (token)
      headers.Authorization = `Bearer ${token}`;

    const response = await fetch('/api/GameServer/HistoryPlayers?pageNumber=1&pageSize=1', {
      headers,
    });
    if (!response.ok)
      return null;

    const payload = await response.json().catch(() => null) as { items?: Array<{ playerId?: string | null }> } | null;
    return payload?.items?.[0]?.playerId || null;
  }).catch(() => null);
  if (!playerId)
    return 'visual-player';
  return playerId;
}

test.describe('Player Tracking visual layout', () => {
  test.beforeEach(async ({ page }) => {
    attachConsoleDiagnostics(page);
    await login(page);
  });

  for (const scenario of [
    { name: 'english desktop', url: '/#/en/player-tracking/settings', width: 1440, height: 900, dark: false },
    { name: 'chinese desktop', url: '/#/zh-cn/player-tracking/settings', width: 1440, height: 900, dark: false },
    { name: 'english tablet', url: '/#/en/player-tracking/settings', width: 768, height: 1024, dark: false },
    { name: 'english mobile', url: '/#/en/player-tracking/settings', width: 390, height: 844, dark: false },
    { name: 'english mobile dark', url: '/#/en/player-tracking/settings', width: 390, height: 844, dark: true },
  ]) {
    test(`${scenario.name} has no page-level layout overflow`, async ({ page }) => {
      await openVisualScenario(page, scenario);
      await expect(page.locator('.player-tracking-settings')).toBeVisible();
      await expect(page.locator('.player-tracking-settings__overview')).toBeVisible();
      await expect(page.locator('.player-tracking-settings__form')).toBeVisible();
      await expect(page.locator('.player-tracking-settings__runtime')).toBeVisible();

      const issues = await collectLayoutIssues(page, {
        rootSelector: '.player-tracking-settings',
        ignoredOverflowSelectors: ['.el-scrollbar', '.el-input-number', '.player-tracking-settings__form'],
        markerSelectors: {
          form: '.player-tracking-settings__form',
          runtime: '.player-tracking-settings__runtime',
          overview: '.player-tracking-settings__overview',
        },
      });
      expect(issues.rootCount).toBe(1);
      expect(issues.markerCounts.form).toBe(1);
      expect(issues.markerCounts.runtime).toBe(1);
      expect(issues.markerCounts.overview).toBe(1);
      expect(issues.pageOverflow).toBe(0);
      expect(issues.bodyOverflow).toBe(0);
      expect(issues.realOverflow, JSON.stringify(issues.realOverflow, null, 2)).toEqual([]);
      expect(issues.textClips, JSON.stringify(issues.textClips, null, 2)).toEqual([]);
    });
  }

  for (const scenario of [
    { name: 'location controls desktop', url: '/#/en/player-tracking/settings', width: 1440, height: 900, dark: false },
    { name: 'location controls mobile', url: '/#/en/player-tracking/settings', width: 390, height: 844, dark: false },
  ]) {
    test(`${scenario.name} remain stable when optional tracking is enabled`, async ({ page }) => {
      await openVisualScenario(page, scenario);
      await expect(page.locator('.player-tracking-settings')).toBeVisible();
      await expect(page.locator('.swal2-container')).toHaveCount(0);

      const panels = page.locator('.player-tracking-settings__form .player-tracking-settings__panel');
      await panels.nth(1).locator('.el-switch').click();
      await panels.nth(2).locator('.el-switch').click();

      const issues = await collectLayoutIssues(page, {
        rootSelector: '.player-tracking-settings',
        ignoredOverflowSelectors: ['.el-scrollbar', '.el-input-number', '.player-tracking-settings__form'],
        markerSelectors: { panels: '.player-tracking-settings__panel' },
      });
      expect(issues.rootCount).toBe(1);
      expect(issues.markerCounts.panels).toBe(4);
      expect(issues.pageOverflow).toBe(0);
      expect(issues.bodyOverflow).toBe(0);
      expect(issues.realOverflow, JSON.stringify(issues.realOverflow, null, 2)).toEqual([]);
      expect(issues.textClips, JSON.stringify(issues.textClips, null, 2)).toEqual([]);
    });
  }

  for (const scenario of [
    { name: 'profile tracking desktop', width: 1440, height: 900, dark: false },
    { name: 'profile tracking mobile', width: 390, height: 844, dark: false },
  ]) {
    test(`${scenario.name} has no page-level layout overflow`, async ({ page }) => {
      const playerId = await resolveVisualPlayerId(page);
      await openVisualScenario(page, {
        ...scenario,
        url: `/#/en/player-profile/${encodeURIComponent(playerId)}`,
      });
      await expect(page.locator('.player-profile-page')).toBeVisible();
      await page.getByRole('tab', { name: 'Tracking' }).click();
      const trackingPanel = page.locator('.profile-tracking-panel');
      await expect(trackingPanel).toBeVisible();
      await expect(trackingPanel.locator('.profile-panel').first()).toBeVisible();
      await expect(trackingPanel.locator('.profile-panel').filter({ hasText: 'Inventory Diff' })).toBeVisible();
      await expect(trackingPanel.locator('.profile-panel').filter({ hasText: 'Location Track' })).toBeVisible();
      await expect(trackingPanel.locator('.profile-panel').filter({ hasText: 'Region Search' })).toBeVisible();

      const issues = await collectLayoutIssues(page, {
        rootSelector: '.profile-tracking-panel',
        ignoredOverflowSelectors: ['.el-table', '.el-scrollbar', '.el-input', '.el-input-number', '.el-select', '.el-segmented'],
        markerSelectors: {
          panels: '.profile-tracking-panel .profile-panel',
          controls: '.profile-tracking-panel .tracking-controls',
        },
      });
      expect(issues.rootCount).toBe(1);
      expect(issues.markerCounts.panels).toBeGreaterThanOrEqual(8);
      expect(issues.markerCounts.controls).toBeGreaterThanOrEqual(4);
      expect(issues.pageOverflow).toBe(0);
      expect(issues.bodyOverflow).toBe(0);
      expect(issues.realOverflow, JSON.stringify(issues.realOverflow, null, 2)).toEqual([]);
      expect(issues.textClips, JSON.stringify(issues.textClips, null, 2)).toEqual([]);
    });
  }
});
