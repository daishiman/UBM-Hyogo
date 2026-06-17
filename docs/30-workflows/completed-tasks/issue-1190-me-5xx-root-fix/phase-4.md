# Phase 4: I/O 契約

## メタ情報
正本: `outputs/phase-4/phase-4.md`

## 目的
T01/T02 のエラー shape（problem+json・`UBM-5001`）・logError payload 仕様・fail パターン D1 Proxy の契約・テスト期待値表（TC-1〜TC-4）を固定する。

## 実行タスク
1. 正本ファイル `outputs/phase-4/phase-4.md` を参照する。

## 統合テスト連携
正本ファイルの統合テスト連携を参照する。

## 参照資料
- `_shared-context.md`（SSOT）
- `outputs/phase-4/phase-4.md`

## 成果物
- `outputs/phase-4/phase-4.md`

## 完了条件
- [x] 正本が存在する。

## 次 Phase への引き継ぎ
- problem+json shape（`UBM-5001` meta）・logError payload（errorHandler 経由 / 直接 `logError` の 2 形）・failing D1 Proxy の fail パターン 3 値を契約として固定済み。
- TC-2 の fail パターンは builder 実 SQL の確認により **`/response_fields/` の 1 テーブルへ確定**（Phase 3 R2 解消）。
- Phase 5 は本契約を参照して T01-T04 の実装手順を固定する。
