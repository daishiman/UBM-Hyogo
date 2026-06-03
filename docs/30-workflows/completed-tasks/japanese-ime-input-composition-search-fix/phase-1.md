# Phase 1: 要件定義

> 正本は `outputs/phase-1/requirements.md`。本ファイルは root index からの導線兼サマリ。

## メタ情報

- taskId: `TASK-IME-INPUT-COMPOSITION-SEARCH-FIX`
- 実装区分: **実装仕様書（VISUAL）** / implementation_mode: `new` / workflow_state: `spec_created`
- 作成日: 2026-06-02

## 目的

公開会員ディレクトリのキーワード検索で日本語 IME 変換が崩れ検索できない不具合と、×アイコン重複を解消し、
IME-safe 入力ロジックを共有フック化する。

## 実行タスク

1. 現状コード anchor（`Search.tsx` / `MemberFilters.client.tsx` / `SelectedFiltersBar.client.tsx`）を verbatim 固定。
2. 受け入れ条件 AC-1〜AC-7 を確定。
3. タスク分類（UI/VISUAL）・命名規則・targeted test 対象を記録。
4. スコープ（1 サイクル）と対象外（submit 型 textarea）を固定。

## 参照資料

- `outputs/phase-1/requirements.md`（要件正本）
- 実コード: `apps/web/src/components/ui/Search.tsx` / `apps/web/src/components/public/MemberFilters.client.tsx` /
  `apps/web/src/components/public/SelectedFiltersBar.client.tsx` / 良い実装例 `apps/web/src/features/admin/components/_members/MembersFilters.tsx`

## 成果物

- `outputs/phase-1/requirements.md`
- `phase-1.md`（本ファイル）

## 統合テスト連携

AC-1〜AC-7 を Phase 4 のテストケースへ 1:1 で写像する。

## 完了条件

- [x] 根本原因 RC-1〜RC-3 を実コード anchor 付きで固定
- [x] AC-1〜AC-7 を確定
- [x] スコープ境界と targeted test 対象を確定
