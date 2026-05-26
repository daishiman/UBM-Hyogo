---
phase: 5
title: 実装 — scrape spec 追加・evidence 取得・親台帳更新
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-03-followup-002-admin-runtime-evidence
status: spec_created
taskType: implementation
visualEvidence: NON_VISUAL
implementation_mode: verify_existing
---

# Phase 5 — 実装

[実装区分: 実装仕様書]

## 1. 変更ファイル一覧（新規作成 / 編集）

| 種別 | パス | 内容 |
|------|------|------|
| 新規作成 | `apps/web/playwright/tests/parallel-03-admin-shell-scrape.spec.ts` | admin shell DOM scrape spec |
| 編集 | `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/phase-11-evidence-inventory.md` | EV-12 Status=present、EV-12 grep 最適化、EV-13/15/16 委譲注記 |
| 生成（実行成果物） | `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-11/dom-scrape-admin.txt` | spec 実行で生成 |

> production code（`apps/web/src` / `apps/web/app`）は変更しない（verify_existing）。

## 2. S-01: scrape spec 実装

```ts
// apps/web/playwright/tests/parallel-03-admin-shell-scrape.spec.ts
import { test, expect } from '../fixtures/auth'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const EV12_PATH =
  '../../docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-11/dom-scrape-admin.txt'

const CONTRACT_ATTR = /data-(theme|route-group|shell|route|testid)="[^"]*"/g

function extractContractLines(html: string): string[] {
  const matches = html.match(CONTRACT_ATTR) ?? []
  return Array.from(new Set(matches)).sort()
}

test.describe('parallel-03 admin AppShell runtime evidence (EV-12)', () => {
  test('scrapes data-* contract attributes from /admin', async ({ adminPage }) => {
    await adminPage.goto('/admin')
    await adminPage.waitForSelector('[data-testid="admin-shell"]', { state: 'attached' })

    const html = await adminPage.content()
    const lines = extractContractLines(html)
    const joined = lines.join('\n')

    // TC-02..06 contract assertions（0 hit = contract regression）
    expect(joined).toMatch(/data-theme="cool"/)
    expect(joined).toMatch(/data-route-group="admin"/)
    expect(joined).toMatch(/data-route="admin"/)
    expect(joined).toMatch(/data-shell="sidebar"/)
    expect(joined).toMatch(/data-shell="topbar"/)
    expect(joined).toMatch(/data-testid="admin-shell"/)

    // TC-07 OKLch 維持 sanity（契約属性行に HEX 直書きが無い）
    expect(joined).not.toMatch(/#[0-9a-fA-F]{3,6}\b/)

    // TC-08 evidence write
    await mkdir(dirname(EV12_PATH), { recursive: true })
    const header = `# EV-12 admin AppShell DOM scrape (parallel-03-followup-002)\n# captured via apps/web/playwright/tests/parallel-03-admin-shell-scrape.spec.ts\n# route: /admin (admin session fixture, mock API)\n\n`
    await writeFile(EV12_PATH, header + joined + '\n', 'utf8')
    expect(lines.length).toBeGreaterThan(0)
  })
})
```

> `dirname`/`join` は path 安全のため使用。`OUT_DIR` 相対基準は `task15-admin-screenshots.spec.ts`（`'../../docs/...'`）に合わせる。実行時の cwd は Playwright の `apps/web`。

## 3. S-02: spec 実行（evidence 取得）

```bash
cd apps/web
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/parallel-03-admin-shell-scrape.spec.ts --project=desktop-chromium
# → docs/.../parallel-03-appshell-layouts/outputs/phase-11/dom-scrape-admin.txt が生成される
```

## 4. S-03: 親 phase-11-evidence-inventory.md の EV-12 更新

対象: `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/phase-11-evidence-inventory.md`

EV-12 行（現状 L30）を以下へ置換:

- Before:
  `| EV-12 | DOM scrape (admin) | \`outputs/phase-11/dom-scrape-admin.txt\` | pending | admin session 取得後 \`curl ...\` |`
- After:
  `| EV-12 | DOM scrape (admin) | \`outputs/phase-11/dom-scrape-admin.txt\` | present | \`playwright/tests/parallel-03-admin-shell-scrape.spec.ts\`（admin fixture + mock API）で \`/admin\` を grep \`data-(theme\|route-group\|shell\|route\|testid)=\` |`

## 5. S-04: 委譲 EV の注記（同 wave）

同ファイルの EV-13 / EV-15 / EV-16 行は status を `pending` のまま残し、取得手順列を委譲注記へ更新:

- EV-13: `member route 未整備のため serial-05-page-routes-blueprint-binding に委譲（child route 整備後に scrape）`
- EV-15: `full chrome screenshot は serial-07-regression-evidence / UT-DSF-07 (#829) に委譲`
- EV-16: `member screenshot は serial-05 route 整備 + serial-07 baseline に委譲`

さらに §2 必須/任意表の脚注と §6 フォールバック節に「EV-12 は present へ昇格済み、EV-13/15/16 は委譲 pending」を 1 行追記し台帳の現況を明示する。

## 6. canUseTool / 副作用範囲

- 本 spec の副作用は「親 outputs への evidence ファイル書き出し」のみ。production runtime / D1 への副作用なし（mock API 経由）。
- `writeFile` は repo 内 path のみを対象とし、絶対 path / path traversal を使わない。

## 7. 命名規則・status 語彙の最終確認（実装時必須）

- status は **`present`** を使用。`captured` / `done` / `deferred-*` は validator で invalid → 使用禁止。
- grep パターンは current code 実属性に一致させる（`data-shell="appshell"` 等の存在しない属性を書かない）。
