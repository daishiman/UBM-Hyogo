import { defineConfig, devices } from '@playwright/test'

const isStagingSmoke = process.argv.some((arg) => arg.includes('staging-smoke'))
const isAdminRequestsRun =
  process.env.ADMIN_REQUESTS_EVIDENCE === '1' ||
  process.argv.some((arg) => arg.includes('admin-requests.spec.ts'))
const isAdminIdentityConflictsRun =
  process.env.ADMIN_IDENTITY_CONFLICTS_EVIDENCE === '1' ||
  process.argv.some((arg) => arg.includes('admin-identity-conflicts.spec.ts'))
const isTask11PublicSmoke = process.argv.some((arg) => arg.includes('public-top-and-list.spec.ts'))
const isTask12PublicSmoke = process.argv.some((arg) =>
  arg.includes('public-detail-register-legal.spec.ts'),
)
const isTask12Evidence = process.env.PLAYWRIGHT_EVIDENCE_TASK === 'task-12-member-detail-register-legal'
const isTask13LoginSmoke =
  process.env.PLAYWRIGHT_EVIDENCE_TASK === 'task-13-login-rebuild' ||
  process.argv.some((arg) => arg.includes('login-smoke.spec.ts'))
const isTask17AdminEvidence =
  process.env.PLAYWRIGHT_EVIDENCE_TASK === 'task-17-admin-schema-conflicts-audit' ||
  process.argv.some((arg) => arg.includes('admin-schema-conflicts-audit.spec.ts'))

const EVIDENCE_DIR = isAdminRequestsRun
  ? '../../docs/30-workflows/task-spec-2a-admin-requests-e2e/outputs/phase-11'
  : isAdminIdentityConflictsRun
    ? '../../docs/30-workflows/2b-admin-identity-conflicts-spec/outputs/phase-11/evidence'
    : isStagingSmoke
      ? '../../docs/30-workflows/task-05-error-boundary-and-staging-smoke/outputs/phase-11/evidence'
      : isTask11PublicSmoke
        ? '../../docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-11/evidence'
        : isTask12PublicSmoke || isTask12Evidence
          ? '../../docs/30-workflows/task-12-member-detail-register-legal/outputs/phase-11/evidence'
          : isTask13LoginSmoke
            ? '../../docs/30-workflows/task-13-login-rebuild/outputs/phase-11/evidence'
            : isTask17AdminEvidence
              ? '../../docs/30-workflows/task-17-admin-schema-conflicts-audit/outputs/phase-11/evidence'
              : '../../docs/30-workflows/completed-tasks/08b-A-playwright-e2e-full-execution/outputs/phase-11/evidence'

const shouldStartLocalServer = !isStagingSmoke
const localBaseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
const localPort = new URL(localBaseURL).port || '3000'
const localEnv =
  'ENVIRONMENT=local SENTRY_ENVIRONMENT=local SENTRY_TRACES_SAMPLE_RATE=0 ' +
  'NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787 ' +
  'PUBLIC_API_BASE_URL=http://127.0.0.1:8787 ' +
  'INTERNAL_API_BASE_URL=http://127.0.0.1:8787 ' +
  'AUTH_URL=http://localhost:3000 ' +
  'AUTH_SECRET=playwright-e2e-auth-secret-32-bytes'

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
            command: isAdminRequestsRun
              ? `${localEnv} AUTH_SECRET=playwright-auth-secret-playwright-auth-secret PLAYWRIGHT_ADMIN_REQUESTS_FIXTURE=1 pnpm --filter @ubm-hyogo/web dev`
              : isAdminIdentityConflictsRun
                ? `${localEnv} PLAYWRIGHT_ADMIN_IDENTITY_CONFLICTS_FIXTURE=1 pnpm --filter @ubm-hyogo/web dev`
                : isTask17AdminEvidence
                  ? `${localEnv} PLAYWRIGHT_ADMIN_IDENTITY_CONFLICTS_FIXTURE=1 PLAYWRIGHT_TASK17_ADMIN_FIXTURE=1 pnpm --filter @ubm-hyogo/web dev`
                : `${localEnv} pnpm --filter @ubm-hyogo/web dev`,
            url: localBaseURL,
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,
            env: { PORT: localPort },
          },
        ],
      }
    : {}),
})
