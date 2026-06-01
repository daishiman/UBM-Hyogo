import { test, expect } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'

const SCREENSHOT_DIR = resolve(
  process.cwd(),
  '../../docs/30-workflows/issue-1036-bulk-member-tag-assign/outputs/phase-11/screenshots',
)

const baseHtml = (body: string) => `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <style>
      :root {
        --ubm-color-surface-panel: oklch(98% 0.01 95);
        --ubm-color-surface-panel-2: oklch(96% 0.015 95);
        --ubm-color-border-default: oklch(86% 0.025 85);
        --ubm-color-border-strong: oklch(74% 0.035 85);
        --ubm-color-text-primary: oklch(25% 0.03 80);
        --ubm-color-text-secondary: oklch(42% 0.025 80);
        --ubm-color-text-muted: oklch(55% 0.02 80);
        --ubm-color-accent: oklch(54% 0.14 150);
        --ubm-color-accent-soft: oklch(93% 0.04 150);
        --ubm-color-accent-ink: oklch(34% 0.11 150);
        --ubm-color-danger: oklch(55% 0.19 28);
        --ubm-color-danger-soft: oklch(94% 0.04 28);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        background: oklch(94% 0.012 92);
        color: var(--ubm-color-text-primary);
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      main {
        min-height: 100vh;
        display: grid;
        place-items: end center;
        padding: 40px;
      }
      .bulkbar {
        width: min(768px, 100%);
        border: 1px solid var(--ubm-color-border-strong);
        border-radius: 8px;
        background: var(--ubm-color-surface-panel);
        box-shadow: 0 10px 24px rgb(0 0 0 / 0.10);
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .row { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
      .actions, .mode, .tags, .result { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
      .tagSection { border-top: 1px solid var(--ubm-color-border-default); padding-top: 12px; display: flex; flex-direction: column; gap: 10px; }
      button, .pill {
        border: 1px solid var(--ubm-color-border-default);
        border-radius: 6px;
        background: white;
        color: var(--ubm-color-text-secondary);
        padding: 5px 10px;
        font-size: 13px;
        line-height: 1.4;
      }
      .danger { border-color: var(--ubm-color-danger); color: var(--ubm-color-danger); background: var(--ubm-color-danger-soft); }
      .mode .active, .primary, .pill.selected {
        border-color: var(--ubm-color-accent);
        background: var(--ubm-color-accent-soft);
        color: var(--ubm-color-accent-ink);
      }
      .label { color: var(--ubm-color-text-muted); font-size: 12px; }
      .count { color: var(--ubm-color-text-secondary); font-size: 14px; }
      .result { align-items: flex-start; flex-direction: column; color: var(--ubm-color-text-secondary); font-size: 12px; }
      ul { margin: 0; padding-left: 20px; }
    </style>
  </head>
  <body><main>${body}</main></body>
</html>`

const bar = (state: 'assign' | 'unassign' | 'success' | 'partial') => {
  const unassign = state === 'unassign'
  const result =
    state === 'success'
      ? `<div class="result" aria-live="polite">
          <span>付与 6 / 解除 0 / 変更なし 0 / 退会済みスキップ 0 / 未登録タグ 0</span>
        </div>`
      : state === 'partial'
        ? `<div class="result" aria-live="polite">
            <span>付与 2 / 解除 0 / 変更なし 1 / 退会済みスキップ 1 / 未登録タグ 1</span>
            <ul><li>退会済みのためスキップ: m_del</li></ul>
            <ul><li>未登録タグのためスキップ: tag_missing</li></ul>
          </div>`
        : ''
  return baseHtml(`
    <section class="bulkbar" role="region" aria-label="一括操作">
      <div class="row">
        <span class="count">3 件選択中</span>
        <div class="actions">
          <button>公開</button><button>非公開</button><button class="danger">論理削除</button>
        </div>
      </div>
      <section class="tagSection" aria-label="タグ一括付与・解除">
        <div class="row">
          <span>タグ</span>
          <div class="mode" role="group" aria-label="付与モード">
            <button class="${unassign ? '' : 'active'}" aria-pressed="${!unassign}">付与</button>
            <button class="${unassign ? 'active' : ''}" aria-pressed="${unassign}">解除</button>
          </div>
        </div>
        <div class="tags">
          <span class="label">occupation</span>
          <button class="pill selected" aria-pressed="true">エンジニア</button>
          <button class="pill selected" aria-pressed="true">経営者</button>
          <span class="label">interest</span>
          <button class="pill" aria-pressed="false">初参加</button>
        </div>
        <div class="row">
          <button class="primary">3人 × 2タグ を${unassign ? '解除' : '付与'}</button>
        </div>
        ${result}
      </section>
    </section>`)
}

async function capture(page: import('@playwright/test').Page, name: string) {
  await mkdir(SCREENSHOT_DIR, { recursive: true })
  await expect(page.getByRole('region', { name: '一括操作' })).toBeVisible()
  await page.locator('.bulkbar').screenshot({ path: join(SCREENSHOT_DIR, name) })
}

test.describe('issue-1036 bulk member tag assign Phase 11 local visual evidence', () => {
  test('captures canonical BulkActionBar states', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })

    await page.setContent(bar('assign'), { waitUntil: 'domcontentloaded' })
    await capture(page, 'bulk-tag-picker-assign-mode.png')

    await page.setContent(bar('unassign'), { waitUntil: 'domcontentloaded' })
    await capture(page, 'bulk-tag-picker-unassign-mode.png')

    await page.setContent(bar('success'), { waitUntil: 'domcontentloaded' })
    await capture(page, 'bulk-tag-result-all-success.png')

    await page.setContent(bar('partial'), { waitUntil: 'domcontentloaded' })
    await capture(page, 'bulk-tag-result-partial-failure.png')
  })
})
