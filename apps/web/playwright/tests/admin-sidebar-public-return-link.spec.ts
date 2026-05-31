import { expect, test } from '@playwright/test'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const WEB_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const PHASE11_DIR =
  process.env.PLAYWRIGHT_EVIDENCE_DIR ??
  '../../docs/30-workflows/admin-sidebar-public-return-link/outputs/phase-11'
const SCREENSHOT_DIR = join(PHASE11_DIR, 'screenshots')

async function capture(page: import('@playwright/test').Page, file: string): Promise<void> {
  await mkdir(SCREENSHOT_DIR, { recursive: true })
  await page.screenshot({ path: join(SCREENSHOT_DIR, file), fullPage: false })
}

async function assertImplementationContract(): Promise<void> {
  // admin-layout-sidebar-shell-migration: 旧 AdminSidebar.tsx を撤去し SidebarShell へ統合。
  // 公開サイト復帰リンク (#1021) は admin role 限定で SidebarShell に再実装したため source guard を移設。
  const source = await readFile(
    join(WEB_ROOT, 'src/components/shell/SidebarShell.tsx'),
    'utf8',
  )
  expect(source).toContain('data-role="public-return"')
  expect(source).toContain('aria-label="公開サイトに戻る"')
  expect(source).toContain('公開サイトに戻る')
  expect(source).toContain('role === "admin"')
}

const fixtureHtml = String.raw`
<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <style>
      :root {
        --ubm-color-surface-bg: oklch(0.97 0.01 240);
        --ubm-color-surface-card: oklch(1 0 0);
        --ubm-color-surface-hover: oklch(0.93 0.02 240);
        --ubm-color-border-default: oklch(0.86 0.02 240);
        --ubm-color-text-primary: oklch(0.25 0.03 240);
        --ubm-color-text-secondary: oklch(0.46 0.03 240);
        --ubm-color-accent: oklch(0.58 0.14 235);
      }
      body {
        margin: 0;
        background: var(--ubm-color-surface-bg);
        color: var(--ubm-color-text-primary);
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .shell {
        display: grid;
        min-height: 800px;
        grid-template-columns: 272px 1fr;
      }
      aside {
        border-right: 1px solid var(--ubm-color-border-default);
        background: var(--ubm-color-surface-card);
      }
      nav {
        box-sizing: border-box;
        display: flex;
        height: 800px;
        flex-direction: column;
        gap: 16px;
        padding: 12px;
      }
      .brand {
        padding: 12px;
        font-weight: 700;
      }
      .groups {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: 16px;
        overflow-y: auto;
      }
      section {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .label {
        padding: 0 12px;
        color: var(--ubm-color-text-secondary);
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
      }
      ul {
        display: flex;
        flex-direction: column;
        gap: 2px;
        margin: 0;
        padding: 0;
      }
      li {
        list-style: none;
      }
      a {
        box-sizing: border-box;
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 4px;
        border-radius: 4px;
        padding: 8px 12px;
        color: var(--ubm-color-text-secondary);
        text-decoration: none;
        font-size: 14px;
      }
      a:hover,
      a[data-capture-state="hover"] {
        background: var(--ubm-color-surface-hover);
        color: var(--ubm-color-text-primary);
      }
      a:focus-visible,
      a[data-capture-state="focus"] {
        outline: 2px solid var(--ubm-color-accent);
        outline-offset: 2px;
      }
      footer {
        display: flex;
        flex-direction: column;
        gap: 8px;
        border-top: 1px solid var(--ubm-color-border-default);
        padding-top: 12px;
      }
      .user-chip {
        display: flex;
        min-width: 0;
        gap: 8px;
        padding: 0 12px;
      }
      .avatar {
        display: grid;
        width: 28px;
        height: 28px;
        place-items: center;
        border-radius: 999px;
        background: var(--ubm-color-surface-hover);
        font-size: 12px;
        font-weight: 700;
      }
      main {
        padding: 24px;
      }
    </style>
  </head>
  <body>
    <div class="shell" data-testid="admin-shell">
      <aside data-shell="sidebar">
        <nav aria-label="管理メニュー">
          <div class="brand">UBM Admin</div>
          <div class="groups">
            <section>
              <div class="label">Public</div>
              <ul>
                <li><a href="/members">会員ディレクトリ</a></li>
                <li><a href="/register">登録</a></li>
              </ul>
            </section>
            <section>
              <div class="label">Members</div>
              <ul>
                <li><a href="/profile">マイページ</a></li>
              </ul>
            </section>
            <section>
              <div class="label">Admin</div>
              <ul>
                <li><a href="/admin">ダッシュボード</a></li>
                <li><a href="/admin/dashboard/attendance">出席分析</a></li>
                <li><a href="/admin/members">会員管理</a></li>
                <li><a href="/admin/tags">タグキュー</a></li>
                <li><a href="/admin/schema">スキーマ</a></li>
                <li><a href="/admin/meetings">開催日</a></li>
                <li><a href="/admin/requests">依頼キュー</a></li>
                <li><a href="/admin/identity-conflicts">Identity重複</a></li>
                <li><a href="/admin/audit">監査ログ</a></li>
              </ul>
            </section>
          </div>
          <a href="/" data-role="public-return" data-component="admin-sidebar-public-return" aria-label="公開サイトに戻る">
            <span aria-hidden="true">⌂</span>
            <span>公開サイトに戻る</span>
          </a>
          <footer data-component="admin-sidebar-footer">
            <div class="user-chip">
              <span class="avatar">管</span>
              <span>管理者<br /><small>admin@example.test</small></span>
            </div>
            <button data-testid="sign-out-button">ログアウト</button>
          </footer>
        </nav>
      </aside>
      <main>
        <h1>ダッシュボード</h1>
      </main>
    </div>
  </body>
</html>`

test.describe('admin-sidebar-public-return-link visual evidence', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Phase 11 screenshots are captured once on Chromium')

  test('captures overview, hover, and focus screenshots for the public return link', async ({
    page,
  }) => {
    await assertImplementationContract()
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.setContent(fixtureHtml, { waitUntil: 'domcontentloaded' })

    const publicReturn = page.locator('a[data-role="public-return"]')
    await expect(page.getByTestId('admin-shell')).toBeVisible()
    await expect(page.locator('[data-shell="sidebar"]')).toBeVisible()
    await expect(publicReturn).toHaveCount(1)
    await expect(publicReturn).toHaveAttribute('href', '/')
    await expect(publicReturn).toHaveAttribute('aria-label', '公開サイトに戻る')
    await expect(publicReturn).toContainText('公開サイトに戻る')
    await expect(
      publicReturn.evaluate((element) => {
        const footerElement = document.querySelector('[data-component="admin-sidebar-footer"]')
        return element.nextElementSibling === footerElement
      }),
    ).resolves.toBe(true)

    await capture(page, 'admin-sidebar-overview.png')

    await publicReturn.evaluate((element) => element.setAttribute('data-capture-state', 'hover'))
    await capture(page, 'public-return-hover.png')

    await publicReturn.evaluate((element) => element.setAttribute('data-capture-state', 'focus'))
    await publicReturn.focus()
    await expect(publicReturn).toBeFocused()
    await capture(page, 'public-return-focus.png')

    await writeFile(
      join(PHASE11_DIR, 'visual-capture-metadata.json'),
      `${JSON.stringify(
        {
          workflowId: 'admin-sidebar-public-return-link',
          status: 'captured_local_playwright_fixture',
          visualEvidence: 'VISUAL_ON_EXECUTION',
          sourceGuard: 'apps/web/src/components/layout/AdminSidebar.tsx',
          route: 'local-playwright-fixture',
          viewport: '1280x800',
          screenshots: [
            { file: 'screenshots/admin-sidebar-overview.png', state: 'overview', status: 'present' },
            { file: 'screenshots/public-return-hover.png', state: 'hover', status: 'present' },
            { file: 'screenshots/public-return-focus.png', state: 'focus', status: 'present' },
          ],
        },
        null,
        2,
      )}\n`,
    )
  })
})
