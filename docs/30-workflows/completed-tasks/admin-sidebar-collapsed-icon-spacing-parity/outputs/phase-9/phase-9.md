# Phase 9: 品質保証

**[実装区分: 実装仕様書]**

## 0. メタ

| key | value |
|-----|-------|
| workflow_id | admin-sidebar-collapsed-icon-spacing-parity |
| phase | 9（品質保証） |
| scale | small（line budget 軽量・mirror parity 影響なし） |
| 影響層 | `apps/web` 表現層のみ |

## 実行タスク

1. QA チェック (1)〜(4) を実行し、全 PASS を確認する。
2. line budget / link / mirror parity の観点を small 前提で確認する。
3. FB-UI-02-1（ファイル削除なし）の扱いを記録する。

## 参照資料

- `outputs/phase-8/phase-8.md`（変更内容テーブル）
- `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx`
- `apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx`
- `docs/00-getting-started-manual/specs/design-tokens.md`

## 1. QA チェック項目

| # | チェック | コマンド | 想定結果 |
|---|----------|----------|----------|
| 1 | `apps/api` 差分ゼロ | `git diff --stat -- apps/api` | 出力なし（AC-6） |
| 2 | HEX 直書きゼロ | `grep -rnE '#[0-9a-fA-F]{3,6}\|bg-\[#\|text-\[#' apps/web/src/components/shell/SidebarNavItem.tsx apps/web/src/components/shell/SidebarShell.tsx` | 0 ヒット（変更は高さ class のみ・色非接触） |
| 3 | 既存＋追加 spec 全 PASS | `pnpm exec vitest run --config=vitest.config.ts apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx` | 全 PASS（既存回帰なし＋collapsed 高さ回帰テスト追加分 PASS・AC-4/AC-7） |
| 4 | typecheck / lint | `pnpm typecheck` / `pnpm lint`（または web filter） | 両 exit 0 |

## 2. line budget / link / mirror parity（small 前提）

- **line budget**: 本タスクの実コード変更は className 値2箇所＋spec のアサーション追加のみで、ファイル新規追加なし。budget 影響なし。
- **link**: 仕様書内リンクは既存ファイルへの相対参照のみ。dead link なし。
- **mirror parity**: `.claude/skills` ↔ `.agents/skills` の symlink mirror に触れる変更なし。parity 影響なし。

## 3. FB-UI-02-1: ファイル削除の扱い

本タスクは**編集のみ**（ファイル削除なし）。削除 PASS 基準は**非該当**。
