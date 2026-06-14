import type { Page } from '@playwright/test';
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

export interface LayoutCheckOptions {
  rootSelector: string;
  ignoredOverflowSelectors?: string[];
  textClipSelectors?: string[];
  markerSelectors?: Record<string, string>;
}

const runtimeEnv = (globalThis as unknown as { "process"?: { env?: Record<string, string | undefined> } })["process"]?.env ?? {};
const username = runtimeEnv.VITE_DEFAULT_USERNAME || 'admin';
const password = runtimeEnv.VITE_DEFAULT_PASSWORD || 'password';

/**
 * Signs in through the real login screen so visual tests exercise the same route guards as users.
 * @param page - Playwright page under test.
 */
export async function login(page: Page): Promise<void> {
  await page.goto('/#/login');
  await page.getByRole('textbox', { name: 'Username' }).fill(username);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.locator('.el-message, .swal2-popup').filter({ hasText: /Welcome Back|successfully signed in/i })).toBeVisible();
}

/**
 * Records browser console diagnostics as an attachment for each visual scenario.
 * @param page - Playwright page under test.
 */
export function attachConsoleDiagnostics(page: Page): void {
  const consoleMessages: string[] = [];
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type()))
      consoleMessages.push(`${message.type()}: ${message.text()}`);
  });
  page.on('pageerror', error => consoleMessages.push(`pageerror: ${error.message}`));

  test.info().attach('console-messages', {
    body: consoleMessages.join('\n'),
    contentType: 'text/plain',
  });
}

/**
 * Collects page-level overflow and text clipping issues while ignoring table internals.
 * @param page - Playwright page under test.
 * @param options - Root and selector options for the page under test.
 * @returns Layout issue summary suitable for strict assertions.
 */
export async function collectLayoutIssues(page: Page, options: LayoutCheckOptions) {
  return await page.evaluate((layoutOptions) => {
    const isVisible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    };
    const isTableInternal = (element: Element) => Boolean(element.closest('.el-table'));
    const shouldIgnoreOverflow = (element: Element) => (layoutOptions.ignoredOverflowSelectors ?? []).some(selector => element.matches(selector) || Boolean(element.closest(selector)));
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

    const root = document.querySelector(layoutOptions.rootSelector);
    const realOverflow = root
      ? Array.from(root.querySelectorAll('*'))
          .filter(isVisible)
          .filter(element => !isTableInternal(element))
          .filter(element => !shouldIgnoreOverflow(element))
          .filter((element) => {
            const htmlElement = element as HTMLElement;
            const rect = element.getBoundingClientRect();
            const isLongTextInput = element.classList.contains('el-input__inner');
            return rect.left < -2 || rect.right > window.innerWidth + 2 || (!isLongTextInput && htmlElement.scrollWidth > htmlElement.clientWidth + 4);
          })
          .map(describe)
      : [];

    const textClipSelector = layoutOptions.textClipSelectors?.join(', ') || `${layoutOptions.rootSelector} button, ${layoutOptions.rootSelector} .el-tag, ${layoutOptions.rootSelector} .el-form-item__label, ${layoutOptions.rootSelector} h2, ${layoutOptions.rootSelector} h3, ${layoutOptions.rootSelector} strong, ${layoutOptions.rootSelector} small`;
    const textClips = Array.from(document.querySelectorAll(textClipSelector))
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
      rootCount: document.querySelectorAll(layoutOptions.rootSelector).length,
      markerCounts: Object.fromEntries(Object.entries(layoutOptions.markerSelectors ?? {}).map(([key, selector]) => [key, document.querySelectorAll(selector).length])),
      realOverflow,
      textClips,
    };
  }, options);
}

/**
 * Applies viewport, locale URL and theme options for one visual scenario.
 * @param page - Playwright page under test.
 * @param scenario - Scenario options.
 */
export async function openVisualScenario(page: Page, scenario: { url: string; width: number; height: number; dark: boolean }): Promise<void> {
  await page.setViewportSize({ width: scenario.width, height: scenario.height });
  await page.goto(scenario.url);
  await page.evaluate((enabled) => document.documentElement.classList.toggle('dark', enabled), scenario.dark);
}
