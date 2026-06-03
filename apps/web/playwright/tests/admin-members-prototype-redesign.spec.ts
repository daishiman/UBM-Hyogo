import { expect } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { adminLogin, test } from '../fixtures/auth'

const OUT_DIR =
  '../../docs/30-workflows/completed-tasks/admin-ui-prototype-alignment-followup-003-admin-members-prototype-redesign/outputs/phase-11/screenshots'
const PHASE11_DIR =
  '../../docs/30-workflows/completed-tasks/admin-ui-prototype-alignment-followup-003-admin-members-prototype-redesign/outputs/phase-11'

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 834, height: 1112 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'desktop', width: 1440, height: 900 },
] as const

async function capture(
  page: import('@playwright/test').Page,
  state: string,
  viewport: (typeof VIEWPORTS)[number],
): Promise<string> {
  await mkdir(OUT_DIR, { recursive: true })
  const file = `admin-members-${state}-${viewport.name}.png`
  await page.screenshot({ path: join(OUT_DIR, file), fullPage: true })
  return `outputs/phase-11/screenshots/${file}`
}

const STATES = [
  { name: 'loaded', path: '/admin/members', text: '青木 太郎' },
  { name: 'empty', path: '/admin/members?q=zzzzz', text: '該当する会員はいません' },
  { name: 'published', path: '/admin/members?filter=published', text: '青木 太郎' },
  { name: 'hidden', path: '/admin/members?filter=hidden', text: '兵庫 花子' },
] as const

// mobile-webkit では前ページの client-side navigation（URL 正規化等）と
// 競合して "interrupted by another navigation" が発生することがあるため retry する。
// 機能アサーションには影響しない navigation 安定化のみ。
async function gotoState(page: import('@playwright/test').Page, path: string): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto(path)
      return
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (attempt === 2 || !message.includes('interrupted by another navigation')) throw error
    }
  }
}

test.describe('followup-003 admin members prototype screenshots', () => {
  test('captures four local list states across four viewports', async ({ page, context }) => {
    test.slow()
    await adminLogin(context)
    const screenshots: Array<{ state: string; viewport: string; path: string }> = []

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })

      for (const state of STATES) {
        await gotoState(page, state.path)
        await expect(page.locator('#admin-members-h')).toBeAttached()
        await expect(page.getByText(state.text).first()).toBeVisible()
        screenshots.push({
          state: state.name,
          viewport: viewport.name,
          path: await capture(page, state.name, viewport),
        })
      }
    }

    await mkdir(PHASE11_DIR, { recursive: true })
    await writeFile(
      join(PHASE11_DIR, 'screenshot-inventory.json'),
      JSON.stringify(
        {
          taskId: 'admin-ui-prototype-alignment-followup-003-admin-members-prototype-redesign',
          capturedAt: '2026-05-27T00:00:00+09:00',
          environment: 'local-playwright-fixture',
          note: 'Drawer behavior is covered by focused component tests; visual matrix captures loaded, empty, published-filter, and hidden-filter states.',
          screenshots,
        },
        null,
        2,
      ),
    )
  })
})
