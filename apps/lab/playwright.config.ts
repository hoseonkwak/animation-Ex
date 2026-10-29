import { defineConfig, devices } from '@playwright/test'

const chromiumExecutablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  reporter: [['html', { outputFolder: '../../playwright-report', open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(chromiumExecutablePath
          ? { launchOptions: { executablePath: chromiumExecutablePath } }
          : {}),
      },
    },
    ...(process.env.KWAK_CROSS_BROWSER === '1'
      ? [
          {
            name: 'firefox',
            testMatch: '**/practice.spec.ts',
            use: { ...devices['Desktop Firefox'] },
          },
          {
            name: 'webkit',
            testMatch: '**/practice.spec.ts',
            use: { ...devices['Desktop Safari'] },
          },
        ]
      : []),
  ],
})
