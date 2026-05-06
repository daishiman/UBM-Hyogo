# Phase 8: 統合テスト

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-8/phase-8.md` |

## 目的
miniflare D1 上で seed → 時刻進行 → cron tick → dry-run → apply → 復元 round-trip を実行し、retention purge の end-to-end 動作を検証する。

## 実行タスク
詳細は `outputs/phase-8/phase-8.md` を正本とする。

## 統合テスト連携
Phase 5 の実装が runbook と整合しているか、Phase 9 品質ゲート前に確認する。

## 参照資料
- `outputs/phase-8/phase-8.md`
- `docs/runbooks/retention-physical-delete.md`

## 成果物
- `outputs/phase-8/phase-8.md`
- `apps/api/src/jobs/retention-purge.int.test.ts` (新規)

## 完了条件
- Phase 8 正本ファイルが存在する。
- 統合テストが PASS する。
- audit_log が purge 前後で不変であることが検証されている。
