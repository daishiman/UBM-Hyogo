import { expect } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { test } from '../fixtures/auth'

const MEMBER_ID = 'mem_alpha'
const WORKFLOW_ROOT =
  '../../docs/30-workflows/completed-tasks/admin-members-timestamp-jst-and-identity-label-clarity'
const PHASE11_DIR = join(WORKFLOW_ROOT, 'outputs/phase-11')
const SCREENSHOT_DIR = join(PHASE11_DIR, 'screenshots')

const screenshot = async (page: import('@playwright/test').Page, file: string) => {
  await mkdir(SCREENSHOT_DIR, { recursive: true })
  await page.screenshot({ path: join(SCREENSHOT_DIR, file), fullPage: true })
}

const memberDetail = {
  identityMemberId: MEMBER_ID,
  identityEmail: 'alpha@example.test',
  status: {
    publicConsent: 'consented',
    rulesConsent: 'consented',
    publishState: 'public',
    isDeleted: false,
    notificationOptOut: false,
  },
  profile: {
    memberId: MEMBER_ID,
    responseId: 'res_alpha',
    responseEmail: 'alpha@example.test',
    publicConsent: 'consented',
    rulesConsent: 'consented',
    publishState: 'public',
    isDeleted: false,
    summary: {
      fullName: '青木 太郎',
      nickname: 'aoki',
      location: '兵庫県',
      occupation: '経営者',
      ubmZone: '0_to_1',
      ubmMembershipType: 'member',
    },
    sections: [],
    attendance: [],
    attendanceMeta: { hasMore: false, nextCursor: null },
    tags: [],
    lastSubmittedAt: '2026-06-09T10:34:19.996603Z',
    editResponseUrl: null,
  },
  audit: [
    {
      actor: 'admin@example.test',
      action: 'admin.member.status_updated',
      occurredAt: '2026-06-09T10:34:19.000Z',
      note: 'fixture',
    },
  ],
}

test.describe('admin members timestamp and system field label evidence', () => {
  test('captures local fixture screenshots for JST timestamp and Japanese system labels', async ({
    adminPage,
  }) => {
    await adminPage.route(`**/api/admin/members/${MEMBER_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(memberDetail),
      })
    })
    await adminPage.route(`**/api/admin/members/${MEMBER_ID}/tags`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ assigned: [], available: [] }),
      })
    })

    await adminPage.goto('/admin/members', { waitUntil: 'domcontentloaded' })
    await expect(adminPage.locator('#admin-members-h')).toBeAttached()
    await expect(adminPage.getByText('2026年5月9日 21:00:00')).toBeVisible()
    await expect(adminPage.getByText('2026-05-09T12:00:00.000Z')).toHaveCount(0)
    await screenshot(adminPage, 'members-last-updated-jst.png')

    await adminPage
      .getByTestId('admin-members-row-mem_alpha')
      .getByRole('button')
      .first()
      .click()
    const drawer = adminPage.getByRole('dialog', { name: '会員詳細' })
    await expect(drawer).toBeVisible()
    await expect(drawer.getByText('本人情報（システム項目）')).toBeVisible()
    await expect(drawer.getByText('会員ID')).toBeVisible()
    await expect(drawer.getByText('memberId')).toBeVisible()
    await expect(drawer.getByText('退会済み')).toBeVisible()
    await expect(drawer.getByText('いいえ').first()).toBeVisible()
    await screenshot(adminPage, 'member-drawer-identity-ja.png')

    await expect(drawer.getByText('診断情報')).toBeVisible()
    await expect(drawer.getByText('公開ディレクトリに表示')).toBeVisible()
    await expect(drawer.getByText('public visible')).toBeVisible()
    await expect(drawer.getByText('未入力の項目あり')).toBeVisible()
    await expect(drawer.getByText('はい').first()).toBeVisible()
    await screenshot(adminPage, 'member-diagnostics-ja.png')

    await mkdir(PHASE11_DIR, { recursive: true })
    await writeFile(
      join(PHASE11_DIR, 'screenshot-inventory.json'),
      JSON.stringify(
        {
          taskId: 'admin-members-timestamp-jst-and-identity-label-clarity',
          mode: 'VISUAL',
          captureDate: '2026-06-10',
          environment: 'local-playwright-fixture',
          screenshots: [
            {
              id: 'TC-11-1',
              file: 'screenshots/members-last-updated-jst.png',
              route: '/admin/members',
              viewport: '1280x720',
            },
            {
              id: 'TC-11-2-3',
              file: 'screenshots/member-drawer-identity-ja.png',
              route: '/admin/members',
              viewport: '1280x720',
            },
            {
              id: 'TC-11-4-5',
              file: 'screenshots/member-diagnostics-ja.png',
              route: '/admin/members',
              viewport: '1280x720',
            },
          ],
        },
        null,
        2,
      ),
    )
  })
})
