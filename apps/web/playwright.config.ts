import { defineConfig, devices } from '@playwright/test'

const EVIDENCE_DIR =
  process.env.ADMIN_REQUESTS_EVIDENCE === '1' ||
  process.argv.some((arg) => arg.includes('admin-requests.spec.ts'))
    ? '../../docs/30-workflows/task-spec-2a-admin-requests-e2e/outputs/phase-11'
    : process.argv.some((arg) => arg.includes('staging-smoke'))
      ? '../../docs/30-workflows/task-05-error-boundary-and-staging-smoke/outputs/phase-11/evidence'
      : '../../docs/30-workflows/completed-tasks/08b-A-playwright-e2e-full-execution/outputs/phase-11/evidence'

const shouldStartLocalServer = !process.argv.some((arg) => arg.includes('staging-smoke'))
const isAdminRequestsRun = process.argv.some((arg) => arg.includes('admin-requests.spec.ts'))
const localEnv =
  'ENVIRONMENT=local NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787 PUBLIC_API_BASE_URL=http://127.0.0.1:8787 INTERNAL_API_BASE_URL=http://127.0.0.1:8787 AUTH_URL=http://127.0.0.1:3000 SENTRY_ENVIRONMENT=local SENTRY_TRACES_SAMPLE_RATE=1'

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
            command:
              isAdminRequestsRun
                ? `${localEnv} AUTH_SECRET=playwright-auth-secret-playwright-auth-secret PLAYWRIGHT_ADMIN_REQUESTS_FIXTURE=1 pnpm --filter @ubm-hyogo/web dev`
                : 'pnpm --filter @ubm-hyogo/web dev',
            url: 'http://localhost:3000',
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,
          },
        ],
      }
    : {}),
})
