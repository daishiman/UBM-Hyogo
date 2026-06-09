import { expect, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { test } from '../fixtures/auth'

const PHASE11_DIR =
  process.env.PLAYWRIGHT_EVIDENCE_DIR ??
  '../../docs/30-workflows/issue-1116-admin-tag-master-code-edit-ui/outputs/phase-11'
const SCREENSHOT_DIR = join(PHASE11_DIR, 'screenshots')

async function capture(page: Page, name: string): Promise<void> {
  await mkdir(SCREENSHOT_DIR, { recursive: true })
  await page.screenshot({ path: join(SCREENSHOT_DIR, name), fullPage: true })
}

test.describe('issue-1116 admin tag master code edit UI Phase 11 screenshots', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Phase 11 evidence screenshots are captured once on Chromium')
  test.setTimeout(120_000)

  test('captures list, edit form, and conflict states', async ({ adminPage, mockApi }) => {
    void mockApi

    await adminPage.setViewportSize({ width: 1280, height: 720 })
    await adminPage.route('**/api/admin/tags/*', async (route) => {
      if (route.request().method() !== 'PATCH') {
        await route.fallback()
        return
      }
      const body = route.request().postDataJSON() as { code?: string; label?: string; category?: string }
      if (body.code === 'vip') {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ ok: false, error: 'tag_code_conflict' }),
        })
        return
      }
      if (body.code === 'mentor_stale') {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ ok: false, error: 'tag_stale_conflict' }),
        })
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tagId: 'tag_mentor',
          code: body.code ?? 'mentor',
          label: body.label ?? 'メンター',
          category: body.category ?? 'role',
        }),
      })
    })
    await adminPage.goto('/admin/tag-master', { waitUntil: 'networkidle' })
    await expect(adminPage.getByRole('heading', { name: 'タグ定義' })).toBeVisible()
    await expect(adminPage.getByTestId('admin-tag-definition-list')).toBeVisible()
    await capture(adminPage, 'tag-master-list.png')

    await adminPage.getByRole('button', { name: '編集対象' }).first().click()
    await expect(adminPage.getByRole('form', { name: /メンター を編集/ })).toBeVisible()
    await capture(adminPage, 'tag-master-edit-form.png')

    await adminPage.getByLabel('コード').fill('vip')
    await adminPage.getByRole('button', { name: '保存' }).click()
    await expect(adminPage.locator('.tag-master-error')).toContainText('同じコード')
    await capture(adminPage, 'tag-master-code-conflict.png')

    await adminPage.getByLabel('コード').fill('mentor_stale')
    await adminPage.getByRole('button', { name: '保存' }).click()
    await expect(adminPage.locator('.tag-master-error')).toContainText('別の変更')
    await capture(adminPage, 'tag-master-stale-conflict.png')
  })
})
