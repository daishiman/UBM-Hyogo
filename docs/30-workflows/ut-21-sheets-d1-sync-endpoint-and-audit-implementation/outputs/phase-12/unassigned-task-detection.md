# Unassigned Task Detection

## 検出結果

| ID | 対象 | 種別 | 影響度 | 対応方針 |
| --- | --- | --- | --- | --- |
| UT21-U01 | UT-21 Sheets sync と現行 Forms sync の二重正本 | 仕様矛盾 | High | UT-21 を直接実装済みにせず、現行 03a / 03b / 04c / 09b へ吸収する差分だけを整理 |
| UT21-U02 | `GET /admin/sync/audit` / `sync_audit_logs` / `sync_audit_outbox` | API/DB 追加候補 | High | `sync_jobs` で足りない監査要件を抽出し、追加テーブルが本当に必要な場合だけ新規タスク化 |
| UT21-U03 | Phase 12 成果物欠落 | ドキュメント品質 | Medium | 本ディレクトリに Phase 12 必須6成果物を追加済み |
| UT21-U04 | Phase 11 smoke 証跡が TBD を含む | 検証不足 | Medium | 実環境 secrets / D1 が揃う環境で smoke を再実行。UI ではないため screenshot は不要 |
| UT21-U05 | `apps/api/src/sync/*` 想定と実ファイル構成の不一致 | 実装境界 | Medium | 現行 `apps/api/src/jobs/*` / `apps/api/src/sync/schema/*` へ合わせてタスク仕様を再作成 |

## 推奨タスク

### task-ut21-forms-sync-conflict-closeout-001

UT-21 を Sheets direct implementation として進めず、現行 Forms sync 正本へ吸収する close-out タスクを作る。

含むもの:

- UT-21 の有効な品質要件（Bearer guard、409 排他、D1 retry、manual smoke）を 03a / 03b / 04c / 09b へ移植する。
- `sync_audit_logs` / `sync_audit_outbox` が必要かを `sync_jobs` の不足分析として再判定する。
- `POST /admin/sync` と `GET /admin/sync/audit` を追加しない方針を明確化する。

含まないもの:

- 正本仕様へ Sheets API v4 を復活させること。
- commit、PR 作成。

## 0 件判定について

未タスクは 0 件ではない。正本仕様と UT-21 の前提衝突は大きく、対応すると問題が生じる恐れがあるため、未タスクとして明示する。
