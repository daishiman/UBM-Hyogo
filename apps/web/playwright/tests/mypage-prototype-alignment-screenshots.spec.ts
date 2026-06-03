import { expect, test } from '../fixtures/auth'
import { mkdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

const PHASE11_DIR = resolve(
  '../../docs/30-workflows/mypage-prototype-alignment/outputs/phase-11',
)
const SCREENSHOT_DIR = join(PHASE11_DIR, 'screenshots')

async function prepare(page: import('@playwright/test').Page): Promise<void> {
  // WebKit は Report-Only CSP の style-src でも addStyleTag を reject するため try/catch で許容する。
  // 注入は animation 停止目的の screenshot 安定化で機能アサーションには影響しない。
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

async function screenshot(
  locator: import('@playwright/test').Locator,
  file: string,
): Promise<void> {
  await mkdir(SCREENSHOT_DIR, { recursive: true })
  await locator.screenshot({ path: join(SCREENSHOT_DIR, file) })
}

test.describe('mypage-prototype-alignment Phase 11 screenshots', () => {
  test.setTimeout(120_000)
  test.use({ viewport: { width: 1280, height: 800 } })

  test('captures canonical profile screenshots', async ({ memberPage, mockApi }) => {
    void mockApi
    await memberPage.goto('/profile', { waitUntil: 'domcontentloaded', timeout: 90_000 })
    await expect(memberPage.locator('main[data-route="member"]')).toBeVisible()
    await prepare(memberPage)

    await mkdir(SCREENSHOT_DIR, { recursive: true })
    await memberPage.screenshot({
      path: join(SCREENSHOT_DIR, 'profile-page-default.png'),
      fullPage: true,
    })
    await screenshot(memberPage.locator('[data-region="status-banner"]'), 'status-banner-public.png')
    await screenshot(memberPage.locator('[data-region="visibility-summary"]'), 'visibility-summary.png')
    // task-c: 旧 MemberHeader nav は SidebarShell の sidebar へ統合（member-header testid 撤去）。
    await screenshot(memberPage.locator('[data-shell="sidebar"]'), 'member-header-nav.png')

    // task-c: 旧 header 版 edit CTA は撤去。revalidate dialog は inline CTA から開く。
    // EditCta.client の onClick(setOpen) は hydration 完了後にアタッチされるため、
    // SSR 直後（特に firefox の cold-start で hydration が遅い環境）に click すると
    // state が動かず dialog が開かない race がある。members-ux-clarity.spec の確立済み
    // パターンに倣い、dialog が visible になるまで再 click を試行する。
    const editCtaInline = memberPage.locator('[data-cta="edit-cta-inline"]')
    const revalidateDialog = memberPage.getByRole('dialog', { name: '情報を最新化しますか？' })
    for (let attempt = 0; attempt < 5; attempt++) {
      await editCtaInline.click()
      try {
        await expect(revalidateDialog).toBeVisible({ timeout: 3_000 })
        break
      } catch {
        // 次の試行へフォールスルー (hydration がまだの場合)
      }
    }
    await expect(revalidateDialog).toBeVisible()
    await screenshot(memberPage.getByRole('dialog'), 'revalidate-modal-open.png')

    await writeFile(
      join(PHASE11_DIR, 'phase11-capture-metadata.json'),
      JSON.stringify(
        {
          taskId: 'mypage-prototype-alignment',
          mode: 'VISUAL',
          captureDate: '2026-05-23',
          environment: 'local-playwright-fixture',
          status: 'captured',
          screenshots: [
            { tc: 'TC-11-01', file: 'profile-page-default.png', output: 'screenshots/profile-page-default.png', status: 'present', route: '/profile', viewport: '1280x800' },
            { tc: 'TC-11-02', file: 'status-banner-public.png', output: 'screenshots/status-banner-public.png', status: 'present', route: '/profile', viewport: '1280x800' },
            { tc: 'TC-11-03', file: 'visibility-summary.png', output: 'screenshots/visibility-summary.png', status: 'present', route: '/profile', viewport: '1280x800' },
            { tc: 'TC-11-04', file: 'revalidate-modal-open.png', output: 'screenshots/revalidate-modal-open.png', status: 'present', route: '/profile', viewport: '1280x800', action: 'openRevalidateModal' },
            { tc: 'TC-11-05', file: 'member-header-nav.png', output: 'screenshots/member-header-nav.png', status: 'present', route: '/profile', viewport: '1280x800' },
          ],
        },
        null,
        2,
      ),
    )
  })
})
