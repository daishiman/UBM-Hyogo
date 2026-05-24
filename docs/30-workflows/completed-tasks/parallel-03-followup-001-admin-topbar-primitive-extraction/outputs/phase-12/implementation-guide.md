# Phase 12 Implementation Guide

## Background

parallel-03 AppShell Layouts では admin topbar を inline JSX の完了形として扱っていたが、後続 Issue #832 で AdminSidebar と同粒度の primitive 抽出が必要になった。今回の改善では仕様書だけで閉じず、実コード・テスト・正本同期まで同 wave で完了させる。

## Implementation Steps

`apps/web/src/components/layout/AdminTopbar.tsx` を追加し、`breadcrumb` / `actions` の optional slot props を持たせた。省略時は既存 inline JSX と同じ「管理」breadcrumb と `aria-hidden="true"` の空 actions slot を描画する。`apps/web/app/(admin)/layout.tsx` は import を追加し、inline `<header>` ブロックを `<AdminTopbar />` に置換した。

## Verification Commands

`mise exec -- pnpm exec vitest run apps/web/src/components/layout/__tests__/AdminTopbar.spec.tsx` と `mise exec -- pnpm exec vitest run "apps/web/app/(admin)/layout.spec.tsx"` を focused gate とする。加えて `mise exec -- pnpm typecheck`、`mise exec -- pnpm lint`、build-time env（`ENVIRONMENT=local` と API base URL 群）付きの `mise exec -- pnpm --filter @ubm-hyogo/web build`、`mise exec -- pnpm verify:tokens` を実行する。

## Screenshot Evidence

本タスクは inline JSX を同一 DOM / data-* 契約の `AdminTopbar` primitive へ移す NON_VISUAL リファクタであり、Phase 11 の screenshot 画像は対象外。視覚差分なしの根拠は `outputs/phase-11/layout-spec-unchanged.txt`、`outputs/phase-11/admin-layout-spec.log`、`outputs/phase-11/admin-topbar-spec.log`、および `outputs/phase-11/diff-stat.txt` に保存する。

## Known Limits

breadcrumb 実データ統合と actions の具体ボタン実装は本タスクのスコープ外であり、今回の未完了事項ではない。runtime mutation / deploy / D1 schema change は発生しない。admin/member full visual regression の所有者は既存 serial-07 visual evidence workflow のまま維持する。
