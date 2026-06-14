# Phase 2: 設計

## メタ情報
正本: `outputs/phase-2/phase-2.md`

## 目的
一次/二次データの fail-soft 境界・ApiError 分類設計（実コンストラクタ契約）・テスト戦略・validation path を固定する。

## 実行タスク
1. 正本ファイル `outputs/phase-2/phase-2.md` を参照する。

## 統合テスト連携
正本ファイルの統合テスト連携を参照する。

## 参照資料
- `_shared-context.md`（SSOT）
- `outputs/phase-2/phase-2.md`

## 成果物
- `outputs/phase-2/phase-2.md`

## 完了条件
- [x] 正本が存在する。

## 次 Phase への引き継ぎ
- fail-soft 境界（P4 のみ degrade・P1-P3 は分類 rethrow）と `ApiError({ code, log: { cause, context, stack? } })` の実契約を確定済み。
- T01/T02 の Before/After 擬似 diff・T03 のテストハーネス（onError 付き wrapper + SQL パターン選択式 failing D1）を正本に固定。
- Phase 3 は本設計を 4 条件（シンプルさ・正本整合・テスト容易性・ロールバック容易性）で評価し GO/NO-GO を判定する。
