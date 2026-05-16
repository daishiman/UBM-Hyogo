import { defineConfig, devices } from '@playwright/test'
import { VIEWPORTS } from './playwright/fixtures/viewports'

const isStagingSmoke = process.argv.some((arg) => arg.includes('staging-smoke'))
const isAdminRequestsRun =
  process.env.ADMIN_REQUESTS_EVIDENCE === '1' ||
  process.argv.some((arg) => arg.includes('admin-requests.spec.ts'))
const isAdminIdentityConflictsRun =
  process.env.ADMIN_IDENTITY_CONFLICTS_EVIDENCE === '1' ||
  process.argv.some((arg) => arg.includes('admin-identity-conflicts.spec.ts'))
const isAdminMemberDeleteRun =
  process.env.ADMIN_MEMBER_DELETE_EVIDENCE === '1' ||
  process.argv.some((arg) => arg.includes('admin-member-delete.spec.ts'))
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
const isTask10Followup002Evidence =
  process.env.PLAYWRIGHT_EVIDENCE_TASK === 'task-10-followup-002' ||
  process.argv.some((arg) => arg.includes('ui-primitives-visual.spec.ts'))
const isTask18RegressionGate =
  process.env.PLAYWRIGHT_EVIDENCE_TASK === 'task-18-w7' ||
  process.env.PLAYWRIGHT_EVIDENCE_TASK === 'task-18-fu' ||
  process.argv.some((arg) => arg.includes('full-smoke.spec.ts')) ||
  process.argv.some((arg) => arg.includes('/visual/')) ||
  process.argv.some((arg) => arg.includes('visual-full'))
const isTask18FullVisualEvidence =
  process.env.PLAYWRIGHT_EVIDENCE_TASK === 'task-18-fu' ||
  process.argv.some((arg) => arg.includes('visual-full'))
const isAttendanceVisualSmoke =
  process.env.PLAYWRIGHT_EVIDENCE_TASK === '07c-followup-002' ||
  process.argv.some((arg) => arg.includes('attendance.spec.ts'))

const EVIDENCE_DIR =
  process.env.PLAYWRIGHT_EVIDENCE_DIR ??
  (isAdminRequestsRun
    ? '../../docs/30-workflows/task-spec-2a-admin-requests-e2e/outputs/phase-11'
    : isAdminIdentityConflictsRun
      ? '../../docs/30-workflows/2b-admin-identity-conflicts-spec/outputs/phase-11/evidence'
      : isAdminMemberDeleteRun
        ? '../../docs/30-workflows/admin-member-delete-e2e-spec/outputs/phase-11/evidence'
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
                  : isTask10Followup002Evidence
                    ? '../../docs/30-workflows/completed-tasks/task-10-followup-002-runtime-visual-axe-evidence/outputs/phase-11/evidence'
                    : isAttendanceVisualSmoke
                      ? '../../docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11'
                      : isTask18FullVisualEvidence
                        ? '../../docs/30-workflows/task-18-fu-full-visual-regression-suite/outputs/phase-11/evidence'
                        : isTask18RegressionGate
                          ? '../../docs/30-workflows/task-18-w7-verify-tokens-and-playwright-smoke/outputs/phase-11/evidence'
                          : '../../docs/30-workflows/completed-tasks/08b-A-playwright-e2e-full-execution/outputs/phase-11/evidence')

const shouldStartLocalServer = !isStagingSmoke
const localBaseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'
const localServerReadyURL =
  isTask18RegressionGate || isAttendanceVisualSmoke ? `${localBaseURL}/login` : localBaseURL
const localPort = new URL(localBaseURL).port || '3000'
const localCoverageDir = `${process.cwd()}/coverage/v8`
const localEnv =
  'ENVIRONMENT=local SENTRY_ENVIRONMENT=local SENTRY_TRACES_SAMPLE_RATE=0 ' +
  `NODE_V8_COVERAGE=${localCoverageDir} ` +
  'PLAYWRIGHT_TEST=1 ' +
  'NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787 ' +
  'PUBLIC_API_BASE_URL=http://127.0.0.1:8787 ' +
  'INTERNAL_API_BASE_URL=http://127.0.0.1:8787 ' +
  `PLAYWRIGHT_SCREENSHOT_DIR=${EVIDENCE_DIR}/screenshots ` +
  'AUTH_URL=http://localhost:3000 ' +
  'AUTH_SECRET=playwright-e2e-auth-secret-32-bytes'

// SSR fixture mode 必須の admin spec は、対応する fixture env が立っていない場合に
// 除外する（mock API 側に対応 GET endpoint が無く、404 → 30 分タイムアウトの主因のため）。
//   - admin-identity-conflicts.spec.ts → PLAYWRIGHT_ADMIN_IDENTITY_CONFLICTS_FIXTURE=1
//   - admin-requests.spec.ts            → PLAYWRIGHT_ADMIN_REQUESTS_FIXTURE=1
const fixtureGatedTestIgnore: string[] = []
if (!isAdminIdentityConflictsRun) {
  fixtureGatedTestIgnore.push('**/admin-identity-conflicts.spec.ts')
}
if (!isAdminRequestsRun) {
  fixtureGatedTestIgnore.push('**/admin-requests.spec.ts')
}
if (!isTask17AdminEvidence) {
  fixtureGatedTestIgnore.push('**/admin-schema-conflicts-audit.spec.ts')
}
if (!isAdminMemberDeleteRun) {
  fixtureGatedTestIgnore.push('**/admin-member-delete.spec.ts')
}

export default defineConfig({
  testDir: './playwright/tests',
  testIgnore: fixtureGatedTestIgnore,
  outputDir: `${EVIDENCE_DIR}/test-results`,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // workers=1: shared mock-api (scripts/e2e-mock-api.mjs) の in-memory state を競合させないため。
  // 並列化は project (browser) shard 単位で十分。
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000, toHaveScreenshot: { maxDiffPixelRatio: 0.02 } },
  reporter: [
    ['html', { outputFolder: `${EVIDENCE_DIR}/playwright-report/html`, open: 'never' }],
    ['json', { outputFile: `${EVIDENCE_DIR}/playwright-report/results.json` }],
    ['list'],
    [
      'monocart-reporter',
      {
        name: 'UBM-Hyogo E2E',
        outputFile: `${EVIDENCE_DIR}/monocart/index.html`,
        coverage: {
          outputDir: `${process.cwd()}/coverage`,
          entryFilter: (entry: { url: string }) =>
            entry.url.includes('/_next/static/') &&
            !/(node_modules|%40sentry|sentry|next-auth|react-dom|@opentelemetry)/i.test(entry.url),
          sourceFilter: (sourcePath: string) => sourcePath.includes('apps/web/src/'),
          reports: [
            ['v8', { outputDir: 'coverage/v8' }],
            'json-summary',
            ['lcovonly', { outputFile: 'coverage/lcov.info' }],
          ],
        },
      },
    ],
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
      testIgnore: [/visual\/.*\.spec\.ts$/, /visual-full\/.*\.spec\.ts$/, /full-smoke\.spec\.ts$/, ...fixtureGatedTestIgnore],
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'smoke-chromium',
      testMatch: /full-smoke\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'visual-chromium',
      testMatch: /visual\/.*\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'desktop-firefox',
      testIgnore: [/visual\/.*\.spec\.ts$/, /visual-full\/.*\.spec\.ts$/, /full-smoke\.spec\.ts$/, ...fixtureGatedTestIgnore],
      use: { ...devices['Desktop Firefox'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'mobile-webkit',
      // admin-pages.spec.ts は desktop primary な admin UI を 5 連続ナビゲーションする構造で、
      // iPhone 13 webkit emulation (hasTouch + isMobile) では Next router prefetch と
      // navigation が race して "Navigation interrupted by another navigation" を発生させる。
      // 管理画面は desktop-chromium / desktop-firefox 側で carried されるため mobile-webkit からは除外する。
      testIgnore: [
        /visual\/.*\.spec\.ts$/,
        /visual-full\/.*\.spec\.ts$/,
        /full-smoke\.spec\.ts$/,
        /admin-pages\.spec\.ts$/,
        ...fixtureGatedTestIgnore,
      ],
      use: { ...devices['iPhone 13'], viewport: { width: 390, height: 844 } },
    },
    {
      name: 'visual-full-chromium-desktop',
      testDir: './playwright/tests/visual-full',
      use: { ...devices['Desktop Chrome'], viewport: VIEWPORTS.desktop },
    },
    {
      name: 'visual-full-chromium-tablet',
      testDir: './playwright/tests/visual-full',
      use: { ...devices['Desktop Chrome'], viewport: VIEWPORTS.tablet },
    },
    {
      name: 'visual-full-chromium-mobile',
      testDir: './playwright/tests/visual-full',
      use: { ...devices['Desktop Chrome'], viewport: VIEWPORTS.mobile },
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
              ? `${localEnv} AUTH_SECRET=playwright-auth-secret-playwright-auth-secret PLAYWRIGHT_ADMIN_REQUESTS_FIXTURE=1 pnpm --filter @ubm-hyogo/web dev:webpack`
              : isAdminIdentityConflictsRun
                ? `${localEnv} PLAYWRIGHT_ADMIN_IDENTITY_CONFLICTS_FIXTURE=1 pnpm --filter @ubm-hyogo/web dev:webpack`
                : isAdminMemberDeleteRun
                  ? `${localEnv} PLAYWRIGHT_ADMIN_MEMBER_DELETE_FIXTURE=1 pnpm --filter @ubm-hyogo/web dev:webpack`
                  : isTask17AdminEvidence
                    ? `${localEnv} PLAYWRIGHT_ADMIN_IDENTITY_CONFLICTS_FIXTURE=1 PLAYWRIGHT_TASK17_ADMIN_FIXTURE=1 pnpm --filter @ubm-hyogo/web dev:webpack`
                    : isTask10Followup002Evidence
                      ? `${localEnv} ENABLE_PRIMITIVES_HARNESS=1 pnpm --filter @ubm-hyogo/web dev:webpack`
                      : isTask18RegressionGate
                        ? `${localEnv} PLAYWRIGHT_ADMIN_REQUESTS_FIXTURE=1 PLAYWRIGHT_ADMIN_IDENTITY_CONFLICTS_FIXTURE=1 PLAYWRIGHT_TASK17_ADMIN_FIXTURE=1 pnpm --filter @ubm-hyogo/web dev:webpack`
                        : `${localEnv} pnpm --filter @ubm-hyogo/web dev:webpack`,
            url: localServerReadyURL,
            reuseExistingServer: !process.env.CI,
            timeout: isAttendanceVisualSmoke ? 180_000 : 120_000,
            env: { PORT: localPort },
          },
        ],
      }
    : {}),
})
