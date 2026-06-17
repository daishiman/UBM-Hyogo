# Phase 1: 要件定義

## メタ情報
正本: `outputs/phase-1/phase-1.md`

## 目的
Issue #1190 の起票時前提の再定義・5xx 経路マップ（実コード検証済み）・根本問題 F-1〜F-3・受入条件 AC-1〜AC-10 を固定する。

## 実行タスク
1. 正本ファイル `outputs/phase-1/phase-1.md` を参照する。

## 統合テスト連携
正本ファイルの統合テスト連携を参照する。

## 参照資料
- `_shared-context.md`（SSOT）
- `outputs/phase-1/phase-1.md`

## 成果物
- `outputs/phase-1/phase-1.md`

## 完了条件
- [x] 正本が存在する。

## 次 Phase への引き継ぎ
- 5xx 経路マップ P1-P8 は実コード Read で行番号検証済み（乖離なし）。Phase 2 はこのマップを設計入力とする。
- 一次データ＝P1-P3（fail-hard + `UBM-5001` 分類）、二次データ＝P4（fail-soft 化）の境界を Phase 2 で確定する。
- `ApiError` の実コンストラクタ契約（`log` 配下に `cause`/`context`）は Phase 2 正本で確定済み引用とする。
