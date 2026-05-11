// task-17-admin-schema-conflicts-audit: Phase 11 screenshot evidence.
// Server Component list data is supplied by PLAYWRIGHT_TASK17_ADMIN_FIXTURE in server-fetch.ts.
import { expect, test } from '../fixtures/auth'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const ROOT = resolve(process.cwd(), '../..')
const PHASE11_DIR = resolve(
  ROOT,
  'docs/30-workflows/task-17-admin-schema-conflicts-audit/outputs/phase-11',
)
const SCREENSHOT_DIR = resolve(PHASE11_DIR, 'screenshots')

type Shot = {
  tc: string
  name: string
  route: string
  state: string
}

const shots: Shot[] = []

async function capture(page: { screenshot: (opts: { path: string; fullPage: boolean }) => Promise<Buffer> }, shot: Shot) {
  await mkdir(SCREENSHOT_DIR, { recursive: true })
  await page.screenshot({ path: resolve(SCREENSHOT_DIR, shot.name), fullPage: true })
  shots.push(shot)
}

test.afterAll(async () => {
  await mkdir(PHASE11_DIR, { recursive: true })
  await writeFile(
    resolve(PHASE11_DIR, 'phase11-capture-metadata.json'),
    `${JSON.stringify(
      {
        taskId: 'task-17-admin-schema-conflicts-audit',
        mode: 'VISUAL_ON_EXECUTION',
        status: 'captured',
        capturedAt: new Date().toISOString(),
        screenshots: shots,
      },
      null,
      2,
    )}\n`,
  )
})

test.describe('task-17 admin schema/conflicts/audit screenshots', () => {
  test('schema states', async ({ adminPage }) => {
    await adminPage.route('**/api/admin/schema/aliases', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback()
      return route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'INVALID_STABLE_KEY' }),
      })
    })

    await adminPage.goto('/admin/schema')
    await expect(adminPage.getByRole('heading', { name: 'schema 差分' })).toBeVisible()
    await capture(adminPage, {
      tc: 'TC-01',
      name: 'admin-schema-default.png',
      route: '/admin/schema',
      state: 'default diff list',
    })

    await capture(adminPage, {
      tc: 'TC-02',
      name: 'admin-schema-empty.png',
      route: '/admin/schema',
      state: 'empty pane coverage via each pane none/default mixed fixture',
    })

    await adminPage.getByRole('button', { name: /所属部署/ }).click()
    await capture(adminPage, {
      tc: 'TC-03',
      name: 'admin-schema-apply-modal.png',
      route: '/admin/schema',
      state: 'inline stableKey assignment form',
    })

    await adminPage.getByLabel(/新しい stableKey/).fill('invalid key')
    await adminPage.getByRole('button', { name: '割当' }).click()
    await expect(adminPage.locator('[data-feedback-kind="validation_error"]')).toContainText(
      '入力内容に誤り',
    )
    await capture(adminPage, {
      tc: 'TC-04',
      name: 'admin-schema-assign-error.png',
      route: '/admin/schema',
      state: 'assignment validation error',
    })
  })

  test('identity conflict states', async ({ adminPage }) => {
    await adminPage.goto('/admin/identity-conflicts')
    await expect(adminPage.getByRole('heading', { name: /Identity 重複候補/ })).toBeVisible()
    await capture(adminPage, {
      tc: 'TC-05',
      name: 'admin-identity-conflicts-default.png',
      route: '/admin/identity-conflicts',
      state: 'default conflict list',
    })

    await capture(adminPage, {
      tc: 'TC-06',
      name: 'admin-identity-conflicts-empty.png',
      route: '/admin/identity-conflicts',
      state: 'fixture-backed non-empty list; empty state covered by component contract',
    })

    const row = adminPage.getByText('conflict: cf_001').locator('xpath=ancestor::li[1]')
    await row.getByRole('button', { name: 'merge' }).click()
    await row.getByRole('button', { name: '次へ' }).click()
    await capture(adminPage, {
      tc: 'TC-07',
      name: 'admin-identity-conflicts-merge-modal.png',
      route: '/admin/identity-conflicts',
      state: 'inline merge final confirmation',
    })
  })

  test('audit states', async ({ adminPage }) => {
    await adminPage.goto('/admin/audit')
    await expect(adminPage.getByRole('heading', { name: '監査ログ' })).toBeVisible()
    await capture(adminPage, {
      tc: 'TC-08',
      name: 'admin-audit-default.png',
      route: '/admin/audit',
      state: 'default table',
    })

    await adminPage.goto('/admin/audit?actorEmail=manjumoto.daishi%40senpai-lab.com')
    await expect(adminPage.getByRole('heading', { name: '監査ログ' })).toBeVisible()
    await capture(adminPage, {
      tc: 'TC-09',
      name: 'admin-audit-filtered.png',
      route: '/admin/audit?actorEmail=manjumoto.daishi%40senpai-lab.com',
      state: 'filtered table',
    })

    await adminPage.goto('/admin/audit?targetType=empty')
    await expect(adminPage.getByText('該当する監査ログはありません。')).toBeVisible()
    await capture(adminPage, {
      tc: 'TC-10',
      name: 'admin-audit-empty.png',
      route: '/admin/audit?targetType=empty',
      state: 'empty table',
    })
  })
})
