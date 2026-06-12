import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { expect, memberLogin, test } from '../fixtures/auth'

const PHASE11_DIR = path.resolve(
  process.cwd(),
  '../../docs/30-workflows/completed-tasks/public-member-detail-survey-fields-richness/outputs/phase-11',
)
const SCREENSHOT_DIR = path.join(PHASE11_DIR, 'screenshots')

async function stabilize(page: import('@playwright/test').Page) {
  // WebKit / Firefox は Report-Only CSP の script-src（strict-dynamic・unsafe-eval なし）でも
  // addStyleTag を reject するため try/catch で許容する。注入は animation 停止目的の screenshot
  // 安定化で機能アサーションには影響しない。
  try {
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }',
    })
  } catch {
    // CSP 拒否時は emulateMedia による reducedMotion fallback で最低限の animation 抑制を保つ
    await page.emulateMedia({ reducedMotion: 'reduce' })
  }
}

async function capture(
  page: import('@playwright/test').Page,
  fileName: string,
): Promise<void> {
  await expect(page.locator('[data-page="public-member-detail"]')).toBeVisible()
  await stabilize(page)
  await mkdir(SCREENSHOT_DIR, { recursive: true })
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, fileName), fullPage: true })
}

test.describe('public-member-detail-survey-fields-richness Phase 11 screenshots', () => {
  // 公開層は全ルート認証必須化されたため /members/:id 訪問前に会員認証する。
  test.beforeEach(async ({ page }) => {
    await memberLogin(page.context())
  })

  test('captures canonical full / sparse / message-hidden screenshots', async ({
    page,
    mockApi,
  }) => {
    await mockApi.setPublicMemberDetailScenario('full')
    await page.goto('/members/sample-001')
    await expect(page.locator('[data-component="business-overview"]')).toBeVisible()
    await expect(page.locator('[data-component="personal-section"]')).toBeVisible()
    await expect(page.locator('[data-component="member-message"]')).toBeVisible()
    await capture(page, 'member-detail-full.png')

    await mockApi.setPublicMemberDetailScenario('sparse')
    await page.goto('/members/sample-001')
    await expect(page.locator('[data-component="member-message"]')).toHaveCount(0)
    await capture(page, 'member-detail-sparse.png')

    await mockApi.setPublicMemberDetailScenario('message-hidden')
    await page.goto('/members/sample-001')
    await expect(page.locator('[data-component="business-overview"]')).toBeVisible()
    await expect(page.locator('[data-component="member-message"]')).toHaveCount(0)
    await capture(page, 'member-detail-message-hidden.png')

    await writeFile(
      path.join(PHASE11_DIR, 'screenshot-inventory.json'),
      JSON.stringify(
        {
          generatedAt: '2026-06-07T22:00:00+09:00',
          route: '/members/sample-001',
          source: 'local mock API',
          screenshots: [
            'screenshots/member-detail-full.png',
            'screenshots/member-detail-sparse.png',
            'screenshots/member-detail-message-hidden.png',
          ],
        },
        null,
        2,
      ),
    )
  })
})
