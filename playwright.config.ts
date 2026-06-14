import { defineConfig, devices } from '@playwright/test';

const runtimeEnv = (globalThis as unknown as { "process"?: { env?: Record<string, string | undefined> } })["process"]?.env ?? {};
const baseURL = runtimeEnv.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5174';
const useExternalServer = Boolean(runtimeEnv.PLAYWRIGHT_BASE_URL);

function toWebServerEnv(env: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(Object.entries(env).filter((entry): entry is [string, string] => entry[1] != null));
}

export default defineConfig({
  testDir: './tests/visual',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  webServer: useExternalServer
    ? undefined
    : {
        command: 'pnpm exec vite --host 127.0.0.1 --port 5174 --strictPort',
        url: baseURL,
        reuseExistingServer: !runtimeEnv.CI,
        timeout: 120_000,
        env: {
          ...toWebServerEnv(runtimeEnv),
          BROWSER: 'none',
        },
      },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
