import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import { expect, test, type Page } from '@playwright/test'

const screenshotDir = path.resolve(
  process.cwd(),
  '../../docs/30-workflows/completed-tasks/issue-1006-members-selected-filters-chip-ux-hardening/outputs/phase-11/screenshots',
)

async function renderHarness(page: Page, options: { mobile?: boolean; focused?: boolean } = {}) {
  await page.setContent(`
    <!doctype html>
    <html lang="ja">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          :root {
            --ubm-space-2: 8px;
            --ubm-space-3: 12px;
            --ubm-color-accent: #2f6f5e;
            --ubm-color-accent-soft: #e8f4ef;
            --ubm-color-accent-ink: #164235;
            --ubm-color-border-default: #cfd8d4;
            --ubm-color-surface-bg: #ffffff;
            --ubm-color-text-secondary: #33443f;
            --ubm-text-sm: 14px;
          }
          body {
            margin: 0;
            padding: 32px;
            background: #f6f8f7;
            color: #17211d;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }
          main {
            max-width: 1040px;
            margin: 0 auto;
          }
          [data-component="member-filters"] {
            border: 1px solid var(--ubm-color-border-default);
            border-radius: 8px;
            padding: 20px;
            background: var(--ubm-color-surface-bg);
          }
          [data-component="selected-filters-bar"] {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--ubm-space-3);
            margin-top: var(--ubm-space-3);
          }
          [data-component="member-filters"] [data-role="active-filters"] {
            display: flex;
            flex-wrap: wrap;
            gap: var(--ubm-space-2);
            list-style: none;
            padding: 0;
            margin: 0;
          }
          [data-component="member-filters"] [data-component="filter-chip"] {
            border: 1px solid var(--ubm-color-border-default);
            border-radius: 999px;
            background: var(--ubm-color-surface-bg);
            color: var(--ubm-color-text-secondary);
            cursor: pointer;
            padding: 5px var(--ubm-space-3);
            font-size: var(--ubm-text-sm);
          }
          [data-component="member-filters"] [data-role="clear-all"] {
            border-color: var(--ubm-color-accent);
            background: var(--ubm-color-accent-soft);
            color: var(--ubm-color-accent-ink);
            border-radius: 999px;
            padding: 6px 12px;
          }
          button:focus-visible {
            outline: 3px solid #0b57d0;
            outline-offset: 3px;
          }
          @media (max-width: 640px) {
            [data-component="selected-filters-bar"] {
              flex-direction: column;
              align-items: stretch;
              gap: var(--ubm-space-2);
            }
            [data-component="selected-filters-bar"] [data-role="active-filters"] {
              width: 100%;
            }
            [data-component="selected-filters-bar"] [data-role="clear-all"] {
              align-self: flex-end;
            }
          }
        </style>
      </head>
      <body>
        <main data-page="members">
          <h1>メンバー一覧</h1>
          <form data-component="member-filters" role="search" aria-label="メンバー絞り込み">
            <p data-role="result-count">1 件中 1 件を表示しています</p>
            <div data-component="selected-filters-bar">
              <ul data-role="active-filters" aria-label="適用中の絞り込み条件">
                <li><button type="button" data-component="filter-chip" aria-label="区画絞り込みを解除">区画: ${options.mobile ? '1→10' : '0→1'} ×</button></li>
                <li><button type="button" data-component="filter-chip" aria-label="種別絞り込みを解除">種別: 正会員 ×</button></li>
                <li><button type="button" data-component="filter-chip" aria-label="AI タグ絞り込みを解除">#AI ×</button></li>
                <li><button type="button" data-component="filter-chip" aria-label="スタートアップ タグ絞り込みを解除">#スタートアップ ×</button></li>
              </ul>
              <button type="button" data-role="clear-all">絞り込みをクリア</button>
            </div>
          </form>
        </main>
      </body>
    </html>
  `)
  if (options.focused) {
    await page.getByRole('button', { name: 'AI タグ絞り込みを解除' }).focus()
  }
}

test.describe('members selected filters chip UX evidence', () => {
  test.beforeEach(async () => {
    await mkdir(screenshotDir, { recursive: true })
  })

  test('captures desktop tag labels screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await renderHarness(page)

    const bar = page.locator('[data-component="selected-filters-bar"]')
    await expect(bar).toBeVisible()
    await expect(page.getByRole('button', { name: 'AI タグ絞り込みを解除' })).toBeVisible()
    await expect(page.getByText('#AI ×')).toBeVisible()

    await page.screenshot({
      path: path.join(screenshotDir, 'selected-filters-bar-desktop-labels.png'),
      fullPage: true,
    })
  })

  test('captures mobile stacked selected filters screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await renderHarness(page, { mobile: true })

    const bar = page.locator('[data-component="selected-filters-bar"]')
    await expect(bar).toBeVisible()
    await expect(bar).toHaveCSS('flex-direction', 'column')
    await expect(bar).toHaveCSS('align-items', 'stretch')
    await expect(bar).toHaveCSS('gap', '8px')
    await expect(page.getByRole('button', { name: 'AI タグ絞り込みを解除' })).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'スタートアップ タグ絞り込みを解除' }),
    ).toBeVisible()

    await page.screenshot({
      path: path.join(screenshotDir, 'selected-filters-bar-mobile-stacked.png'),
      fullPage: true,
    })
  })

  test('captures focus restoration after chip removal screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await renderHarness(page, { focused: true })

    await expect(page.getByRole('button', { name: 'AI タグ絞り込みを解除' })).toBeFocused()

    await page.screenshot({
      path: path.join(screenshotDir, 'selected-filters-bar-focus-after-remove.png'),
      fullPage: true,
    })
  })
})
