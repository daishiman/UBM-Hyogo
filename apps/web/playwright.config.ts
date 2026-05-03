import { defineConfig, devices } from '@playwright/test'

const EVIDENCE_DIR =
  '../../docs/30-workflows/08b-parallel-playwright-e2e-and-ui-acceptance-smoke/outputs/phase-11/evidence'

export default defineConfig({
  testDir: './playwright/tests',
  outputDir: `${EVIDENCE_DIR}/test-results`,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [
    ['html', { outputFolder: `${EVIDENCE_DIR}/playwright-report`, open: 'never' }],
    ['json', { outputFile: `${EVIDENCE_DIR}/playwright-report/report.json` }],
    ['list'],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'desktop-firefox',
      use: { ...devices['Desktop Firefox'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'mobile-webkit',
      use: { ...devices['iPhone 13'], viewport: { width: 390, height: 844 } },
    },
    {
      name: 'staging',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.PLAYWRIGHT_STAGING_BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL,
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter @ubm-hyogo/web dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
})
