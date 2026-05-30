# Phase 11: Manual Test / Evidence Inventory

**[実装区分: 実装仕様書]**

## visualEvidence: `VISUAL_ON_EXECUTION`

実行時に staging または local Playwright fixture で screenshot を取得する。今回サイクルではローカル DOM/grep/focused test evidence と source-contract guard 付き screenshot evidence を `present` とし、staging authenticated observation のみ user-gated に分離する。

## 4. Phase 11 evidence file inventory

| # | 種別 | Path | Status |
|---|------|------|--------|
| 1 | typecheck log | `outputs/phase-11/evidence/typecheck.log` | present |
| 2 | lint log | `outputs/phase-11/evidence/lint.log` | present |
| 3 | vitest run log（AdminSidebar.spec） | `outputs/phase-11/evidence/vitest-adminsidebar.log` | present |
| 4 | grep gate 結果 | `outputs/phase-11/evidence/grep-gate.log` | present |
| 5 | screenshot: `/admin` sidebar 全景 | `outputs/phase-11/screenshots/admin-sidebar-overview.png` | present |
| 6 | screenshot: 「公開サイトに戻る」hover 状態 | `outputs/phase-11/screenshots/public-return-hover.png` | present |
| 7 | screenshot: 「公開サイトに戻る」focus 状態 | `outputs/phase-11/screenshots/public-return-focus.png` | present |
| 8 | coverage summary | `outputs/phase-11/evidence/coverage-summary.json` | n/a |

> Status enum: `present` / `pending` / `n/a`。`present` は物理配置済み、`pending` は user-gated visual runtime evidence、`n/a` は focused regression で代替済みを表す。

## 手動取得手順

```bash
# 1. local dev server 起動
mise exec -- pnpm --filter @ubm-hyogo/web dev

# 2. ブラウザで /admin にアクセス（要 admin session）
#    → sidebar 最下段「公開サイトに戻る」を撮影
#    → hover / focus 状態を個別撮影

# 3. 自動 evidence 収集
mkdir -p outputs/phase-11/evidence
mise exec -- pnpm typecheck 2>&1 | tee outputs/phase-11/evidence/typecheck.log
mise exec -- pnpm lint 2>&1 | tee outputs/phase-11/evidence/lint.log
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  src/components/layout/__tests__/AdminSidebar.spec.tsx \
  2>&1 | tee outputs/phase-11/evidence/vitest-adminsidebar.log

# 4. grep gate
{
  rg -n 'data-role="public-return"' apps/web/src/components/layout/AdminSidebar.tsx
  rg -n 'label: "ホーム"' apps/web/src/components/layout/AdminSidebar.tsx || echo "OK: 0 hits"
  rg "#[0-9a-fA-F]{3,6}" apps/web/src/components/layout/AdminSidebar.tsx || echo "OK: 0 hits"
} | tee outputs/phase-11/evidence/grep-gate.log
```

## 完了条件

- inventory 表 8 行が物理配置されている（`present`）か、staging runtime gate 待ちで `pending` 明示
- screenshot は `apps/web/playwright/tests/admin-sidebar-public-return-link.spec.ts` の local Playwright fixture で取得し、実 `AdminSidebar.tsx` の DOM contract guard と併用する
