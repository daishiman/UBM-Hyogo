import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '../fixtures/auth'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const ROOT = resolve(process.cwd(), '../..')
const PHASE11_DIR = resolve(
  ROOT,
  'docs/30-workflows/issue-776-schema-alias-bulk-resolve/outputs/phase-11',
)

const shotNames: string[] = []

async function capture(page: import('@playwright/test').Page, name: string) {
  await mkdir(PHASE11_DIR, { recursive: true })
  await page.screenshot({ path: resolve(PHASE11_DIR, name), fullPage: true })
  shotNames.push(name)
}

async function openBulkModal(page: import('@playwright/test').Page) {
  await page.goto('/admin/schema')
  await expect(page.getByRole('heading', { name: 'schema 差分' })).toBeVisible()
  await page.getByRole('button', { name: 'Bulk Resolve' }).click()
  await page.getByLabel('全選択 未解決').click()
  await page.getByLabel('全選択 変更').click()
  await expect(page.getByTestId('bulk-selection-summary')).toContainText('30 件選択中')
  await page.getByRole('button', { name: 'Bulk Resolve 確定' }).click()
  await expect(page.getByTestId('bulk-resolve-modal')).toBeVisible()
}

test.describe('Issue #776 schema alias bulk resolve evidence', () => {
  test('desktop screenshots and perf/a11y logs', async ({ adminPage }) => {
    await adminPage.route('**/api/admin/schema/aliases', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback()
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          mode: 'apply',
          confirmed: true,
          backfill: { status: 'completed' },
        }),
      })
    })

    await adminPage.goto('/admin/schema')
    await expect(adminPage.getByRole('heading', { name: 'schema 差分' })).toBeVisible()
    await adminPage.getByRole('button', { name: 'Bulk Resolve' }).click()
    await adminPage.getByLabel('全選択 未解決').click()
    await adminPage.getByLabel('全選択 変更').click()
    await capture(adminPage, 'bulk-select-desktop-1280.png')

    await adminPage.getByRole('button', { name: 'Bulk Resolve 確定' }).click()
    await expect(adminPage.getByTestId('bulk-resolve-modal')).toBeVisible()
    await capture(adminPage, 'bulk-modal-desktop-1280.png')

    const startedAt = Date.now()
    await adminPage.getByTestId('bulk-resolve-modal').getByRole('button', { name: '確定' }).click()
    await expect(adminPage.getByTestId('bulk-resolve-modal')).toBeHidden()
    const elapsedMs = Date.now() - startedAt
    await capture(adminPage, 'bulk-success-desktop-1280.png')
    expect(elapsedMs).toBeLessThan(30_000)

    const axe = await new AxeBuilder({ page: adminPage })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    const serious = axe.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    )
    expect(serious).toHaveLength(0)

    await writeFile(
      resolve(PHASE11_DIR, 'perf-30rows.md'),
      [
        '# perf-30rows',
        '',
        `- mode: local Playwright fixture`,
        `- selected rows: 30`,
        `- elapsedMs: ${elapsedMs}`,
        `- NFR-5: ${elapsedMs < 30_000 ? 'PASS' : 'FAIL'}`,
        '',
      ].join('\n'),
    )
    await writeFile(
      resolve(PHASE11_DIR, 'a11y-manual-check.md'),
      [
        '# a11y-manual-check',
        '',
        '- automated axe serious/critical violations: 0',
        '- focus trap / Esc close: covered by Modal component tests',
        '- manual screen-reader runtime check: pending staging hardware pass',
        '',
      ].join('\n'),
    )
  })

  test('desktop partial failure screenshot', async ({ adminPage }) => {
    await adminPage.route('**/api/admin/schema/aliases', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback()
      const body = JSON.parse(route.request().postData() ?? '{}')
      if (body.questionId === 'q_issue776_03') {
        return route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ ok: false, error: 'alias conflict' }),
        })
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          mode: 'apply',
          confirmed: true,
          backfill: { status: 'completed' },
        }),
      })
    })
    await openBulkModal(adminPage)
    await adminPage.getByTestId('bulk-resolve-modal').getByRole('button', { name: '確定' }).click()
    await expect(adminPage.getByTestId('bulk-resolve-modal').getByText('alias conflict')).toBeVisible()
    await capture(adminPage, 'bulk-partial-failure-desktop-1280.png')
  })

  test('mobile select and modal screenshots', async ({ adminPage }) => {
    await adminPage.setViewportSize({ width: 375, height: 667 })
    await adminPage.goto('/admin/schema')
    await expect(adminPage.getByRole('heading', { name: 'schema 差分' })).toBeVisible()
    await adminPage.getByRole('button', { name: 'Bulk Resolve' }).click()
    await adminPage.getByLabel('全選択 未解決').click()
    await capture(adminPage, 'bulk-select-mobile-375.png')
    await adminPage.getByRole('button', { name: 'Bulk Resolve 確定' }).click()
    await expect(adminPage.getByTestId('bulk-resolve-modal')).toBeVisible()
    await capture(adminPage, 'bulk-modal-mobile-375.png')
  })
})

test.afterAll(async () => {
  await mkdir(PHASE11_DIR, { recursive: true })
  await writeFile(
    resolve(PHASE11_DIR, 'phase11-capture-metadata.json'),
    `${JSON.stringify(
      {
        taskId: 'issue-776-schema-alias-bulk-resolve',
        mode: 'local Playwright fixture',
        status: 'captured',
        capturedAt: new Date().toISOString(),
        screenshots: shotNames,
      },
      null,
      2,
    )}\n`,
  )
})
