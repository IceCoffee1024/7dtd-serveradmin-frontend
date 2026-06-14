import { expect, test } from '@playwright/test';

interface LayoutIssue {
  tag: string;
  className: string;
  text: string;
  clientWidth: number;
  scrollWidth: number;
  left: number;
  right: number;
  width: number;
}

const username = process.env.VITE_DEFAULT_USERNAME || 'admin';
const password = process.env.VITE_DEFAULT_PASSWORD || 'password';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/#/login');
  await page.getByRole('textbox', { name: 'Username' }).fill(username);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.locator('.el-message, .swal2-popup').filter({ hasText: /Welcome Back|successfully signed in/i })).toBeVisible();
}

async function collectLayoutIssues(page: import('@playwright/test').Page) {
  return await page.evaluate(() => {
    const isVisible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    };
    const isTableInternal = (element: Element) => Boolean(element.closest('.el-table'));
    const describe = (element: Element): LayoutIssue => {
      const rect = element.getBoundingClientRect();
      return {
        tag: element.tagName.toLowerCase(),
        className: String((element as HTMLElement).className || '').slice(0, 90),
        text: (element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120),
        clientWidth: (element as HTMLElement).clientWidth,
        scrollWidth: (element as HTMLElement).scrollWidth,
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
      };
    };

    const realOverflow = Array.from(document.querySelectorAll('.discord-settings *'))
      .filter(isVisible)
      .filter(element => !isTableInternal(element))
      .filter(element => !element.classList.contains('discord-settings__form'))
      .filter((element) => {
        const htmlElement = element as HTMLElement;
        const rect = element.getBoundingClientRect();
        const isLongTextInput = element.classList.contains('el-input__inner');
        return rect.left < -2 || rect.right > window.innerWidth + 2 || (!isLongTextInput && htmlElement.scrollWidth > htmlElement.clientWidth + 4);
      })
      .map(describe);

    const textClips = Array.from(document.querySelectorAll('.discord-settings button, .discord-settings .el-tag, .discord-settings .el-form-item__label, .discord-settings h2, .discord-settings h3, .discord-settings strong, .discord-settings small'))
      .filter(isVisible)
      .filter(element => !isTableInternal(element))
      .filter((element) => {
        const htmlElement = element as HTMLElement;
        return htmlElement.scrollWidth > htmlElement.clientWidth + 3;
      })
      .map(describe);

    return {
      pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      bodyOverflow: document.body.scrollWidth - document.body.clientWidth,
      settingsCount: document.querySelectorAll('.discord-settings').length,
      heroCount: document.querySelectorAll('.discord-settings-hero').length,
      realOverflow,
      textClips,
    };
  });
}

test.describe('Discord Integration visual layout', () => {
  test.beforeEach(async ({ page }) => {
    const consoleMessages: string[] = [];
    page.on('console', (message) => {
      if (['error', 'warning'].includes(message.type()))
        consoleMessages.push(`${message.type()}: ${message.text()}`);
    });
    page.on('pageerror', error => consoleMessages.push(`pageerror: ${error.message}`));

    await login(page);

    test.info().attach('console-messages', {
      body: Buffer.from(consoleMessages.join('\n')),
      contentType: 'text/plain',
    });
  });

  for (const scenario of [
    { name: 'english desktop', url: '/#/en/discord-integration/settings', width: 1440, height: 900, dark: false },
    { name: 'chinese desktop', url: '/#/zh-cn/discord-integration/settings', width: 1440, height: 900, dark: false },
    { name: 'english tablet', url: '/#/en/discord-integration/settings', width: 768, height: 1024, dark: false },
    { name: 'english mobile', url: '/#/en/discord-integration/settings', width: 390, height: 844, dark: false },
    { name: 'english mobile dark', url: '/#/en/discord-integration/settings', width: 390, height: 844, dark: true },
  ]) {
    test(`${scenario.name} has no page-level layout overflow`, async ({ page }) => {
      await page.setViewportSize({ width: scenario.width, height: scenario.height });
      await page.goto(scenario.url);
      await page.evaluate((enabled) => document.documentElement.classList.toggle('dark', enabled), scenario.dark);
      await expect(page.locator('.discord-settings')).toBeVisible();
      await expect(page.locator('.discord-settings-hero')).toBeVisible();
      await expect(page.locator('.discord-settings-hero__actions .el-button')).toHaveCount(3);
      await expect(page.locator('.discord-settings__diagnostics .el-button')).toBeVisible();

      const issues = await collectLayoutIssues(page);
      expect(issues.settingsCount).toBe(1);
      expect(issues.heroCount).toBe(1);
      expect(issues.pageOverflow).toBe(0);
      expect(issues.bodyOverflow).toBe(0);
      expect(issues.realOverflow, JSON.stringify(issues.realOverflow, null, 2)).toEqual([]);
      expect(issues.textClips, JSON.stringify(issues.textClips, null, 2)).toEqual([]);
    });
  }
});
