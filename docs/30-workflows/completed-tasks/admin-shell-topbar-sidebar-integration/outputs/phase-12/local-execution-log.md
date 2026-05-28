# Local execution log (2026-05-26)

## 実装サマリ

実装区分: 実装仕様書 (CONST_004) どおり実コードへ反映。

### 変更ファイル

| パス | 種別 |
|------|------|
| `apps/web/app/(admin)/layout.tsx` | 編集 (AdminTopbar 撤去 + safeServerFetch + AdminSidebar props 注入) |
| `apps/web/src/components/layout/AdminSidebar.tsx` | 書き直し (3 group + props 化 + user-chip footer) |
| `apps/web/src/components/layout/AdminSidebarNavItem.tsx` | 新規 (client / `usePathname` + active 判定 + Chip badge) |
| `apps/web/src/components/layout/AdminBrandBlock.tsx` | 新規 (brand mark + title 2 ライン) |
| `apps/web/src/components/layout/isActive.ts` | 新規 (純関数) |
| `apps/web/src/components/layout/__tests__/isActive.spec.ts` | 新規 (4 ケース) |
| `apps/web/src/components/layout/__tests__/AdminSidebarNavItem.spec.tsx` | 新規 (5 ケース) |
| `apps/web/src/components/layout/__tests__/AdminSidebar.spec.tsx` | 新規 (7 ケース) |
| `apps/web/src/components/layout/__tests__/AdminSidebar.component.spec.tsx` | 退役 marker (AdminSidebar.spec.tsx に置換) |
| `apps/web/app/(admin)/layout.spec.tsx` | 拡充 (AC-1 / schemaDiffCount fetch / mock 失敗) |
| `apps/web/src/lib/admin/server-fetch.ts` | 拡充 (Playwright fixture の dashboard / members deterministic data) |
| `apps/web/playwright/tests/admin-shell-topbar-sidebar-integration.spec.ts` | 新規 (Phase 11 screenshot 6 枚 + metadata 生成) |

### AC 達成

| AC | 状況 | 検証 |
|----|------|------|
| AC-1 | green | `grep -F '管理' apps/web/app/(admin)/layout.tsx` = 0 件 / layout.spec.tsx 「admin-breadcrumb-slot / admin-topbar-actions が消えている」test pass |
| AC-2 | green | AdminSidebar.spec.tsx で `/admin/members/123` → `/admin/members` only active pass |
| AC-3 | green | AdminSidebar.spec.tsx で Public / Members / Admin の 3 label を順に DOM 検証 |
| AC-4 | green | AdminSidebar.spec.tsx + layout.spec.tsx で `status="queued"` count=0/2 の DOM 比較 |
| AC-5 | green | AdminSidebar.spec.tsx で user-chip-name/email/SignOutButton DOM 検証 |
| AC-6 | green | Task C 依存である旨は phase-8 / phase-13 に既記載。本 task では Breadcrumb 直貼り撤去なし |
| AC-7 | green | `pnpm verify:tokens` → `design tokens in sync (88 tracked)` |
| AC-8 | green | typecheck / lint / web vitest 全 pass (詳細下記) |

### コマンド実行結果

```text
mise exec -- pnpm typecheck   → 全パッケージ Done (0 error)
mise exec -- pnpm lint        → 全パッケージ Done (0 violation / dependency-cruiser 0 / stablekey OK)
mise exec -- pnpm verify:tokens → design tokens in sync (88 tracked)
mise exec -- pnpm --filter web test → 1168 passed | 2 skipped (164 files / 0 regression)
PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/completed-tasks/admin-shell-topbar-sidebar-integration/outputs/phase-11 PLAYWRIGHT_EVIDENCE_TASK=task-17-admin-schema-conflicts-audit pnpm -F @ubm-hyogo/web exec playwright test --project=desktop-chromium playwright/tests/admin-shell-topbar-sidebar-integration.spec.ts → 1 passed / 6 PNG captured
```

層別 spec の対象結果:

```text
apps/web/src/components/layout/__tests__/isActive.spec.ts             → 4 passed
apps/web/src/components/layout/__tests__/AdminSidebarNavItem.spec.tsx → 5 passed
apps/web/src/components/layout/__tests__/AdminSidebar.spec.tsx        → 7 passed
apps/web/app/(admin)/layout.spec.tsx                                  → 7 passed
apps/web/src/components/layout/__tests__/AdminTopbar.spec.tsx         → 9 passed (legacy primitive 単体テストは無傷)
```

### 視覚検証 (Phase 11) について

`visualEvidence: VISUAL_ON_EXECUTION` について、local Playwright admin fixture で 4 viewport / 6 PNG を `outputs/phase-11/` に保存済み。staging visual baseline は Task E / Phase 13 user-gated のまま維持する。

### 未対応 / user-gated

- staging deploy + staging authenticated baseline (Task E スコープ)
- commit / push / PR (CONST_002 によりユーザー指示まで保留)
- Breadcrumb 直貼り撤去 (Task C スコープ・本 task 範囲外)

### Definition of Done

- [x] 実コード反映 (`git status` で apps/web 配下 9 ファイル変更確認済)
- [x] typecheck / lint / web vitest / verify:tokens すべて green
- [x] AC-1..AC-5, AC-7, AC-8 達成
- [x] AC-6 (Task C 依存) は phase-8 / phase-13 に既明記
- [ ] commit / push / PR (user-gated)
- [x] local authenticated Playwright fixture screenshots
