# Phase 11: 手動テスト

## メタ情報
正本: `outputs/phase-11/phase-11.md`

## 目的
NON_VISUAL 宣言と証跡計画（focused vitest / grep gate / diff 証跡 / staging 実機確認手順）を記録する。

## 実行タスク
1. 正本ファイル `outputs/phase-11/phase-11.md` を参照する。

## 統合テスト連携
正本ファイルの統合テスト連携を参照する。

## 参照資料
- `_shared-context.md`（SSOT）
- `outputs/phase-11/phase-11.md`

## 成果物
- `outputs/phase-11/phase-11.md`
- `outputs/phase-11/manual-test-result.md`

## 完了条件
- [x] 正本が存在する。

## 次 Phase への引き継ぎ
- 本 WF は `implemented_local_evidence_captured`。focused vitest（TC-1〜TC-4）・grep gate・diff 証跡はpresent（本サイクルで取得）する。
- スクリーンショットは NON_VISUAL のため取得しない（n/a）。物理 PNG・空ディレクトリは作らない。
- staging 実機確認（`/me` 5xx 時の `UBM-5001` + scope ログ）は `manual-test-result.md` の手順に従い user-gated で実施する。
