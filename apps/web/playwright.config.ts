import { defineConfig, devices } from '@playwright/test'

const isStagingSmoke = process.argv.some((arg) => arg.includes('staging-smoke'))
const isTask11PublicSmoke = process.argv.some((arg) => arg.includes('public-top-and-list.spec.ts'))
const isTask12PublicSmoke = process.argv.some((arg) =>
  arg.includes('public-detail-register-legal.spec.ts'),
)
const isTask12Evidence = process.env.PLAYWRIGHT_EVIDENCE_TASK === 'task-12-member-detail-register-legal'

const EVIDENCE_DIR = isStagingSmoke
  ? '../../docs/30-workflows/task-05-error-boundary-and-staging-smoke/outputs/phase-11/evidence'
  : isTask11PublicSmoke
    ? '../../docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-11/evidence'
    : isTask12PublicSmoke || isTask12Evidence
      ? '../../docs/30-workflows/task-12-member-detail-register-legal/outputs/phase-11/evidence'
      : '../../docs/30-workflows/completed-tasks/08b-A-playwright-e2e-full-execution/outputs/phase-11/evidence'

const shouldStartLocalServer = !isStagingSmoke
const localBaseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
const localPort = new URL(localBaseURL).port || '3000'

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
    ['html', { outputFolder: `${EVIDENCE_DIR}/playwright-report/html`, open: 'never' }],
    ['json', { outputFile: `${EVIDENCE_DIR}/playwright-report/results.json` }],
    ['list'],
  ],
  use: {
    baseURL: localBaseURL,
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
    {
      name: 'staging-smoke',
      testDir: './tests/e2e',
      testMatch: /staging-smoke\.spec\.ts$/,
      retries: 2,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.STAGING_BASE_URL,
        viewport: { width: 1280, height: 800 },
        extraHTTPHeaders: process.env.STAGING_AUTH_BEARER
          ? { Authorization: `Bearer ${process.env.STAGING_AUTH_BEARER}` }
          : undefined,
      },
    },
  ],
  ...(shouldStartLocalServer
    ? {
        webServer: [
          {
            command: 'pnpm --filter @ubm-hyogo/web dev',
            url: localBaseURL,
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,
            env: { PORT: localPort },
          },
        ],
      }
    : {}),
})
