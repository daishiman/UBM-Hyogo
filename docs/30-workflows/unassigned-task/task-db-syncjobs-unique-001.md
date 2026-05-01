# task-db-syncjobs-unique-001 - sync_jobs running guard DB constraint

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-db-syncjobs-unique-001 |
| タスク名 | sync_jobs running guard DB constraint |
| 分類 | database / reliability / sync |
| 優先度 | 中 |
| ステータス | 未実施 |
| 発見元 | `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/outputs/phase-12/unassigned-task-detection.md` |
| 発見日 | 2026-05-01 |

## Why

09b runbook は `sync_jobs.status='running'` を確認して同種 job の二重起動を避ける運用を記載している。一方で DB 層の partial unique index や同等制約は未確定で、cron と手動 sync が競合した場合の最終防衛線が workflow 実装に寄っている。

## What

- D1 / SQLite で `sync_jobs(type, status)` の `status='running'` partial unique index が利用可能か検証する
- 利用不可の場合は `sync_locks` など既存 lock 実装との責務境界を明確にする
- migration、rollback、staging smoke、負荷時 race test を作成する
- 09b runbook の SQL 例を実装後の正本に合わせて更新する

## 苦戦箇所【記入必須】

D1 / SQLite の partial unique index 可否と Workers runtime の同時実行挙動を混同しやすい。DB constraint を採用できるか、既存 `sync_locks` を正本にするかを実機 smoke で分け、09b runbook の SQL 例を実装後に同期する。

## スコープ

含む:
- `apps/api/migrations/*.sql` の追加または代替 lock 方針
- sync manual / scheduled / Forms response sync の race test
- aiworkflow-requirements の database / deployment / runbook spec 同期

含まない:
- Forms API client の機能追加
- Slack / Sentry 通知
- legacy Sheets cron 撤回（UT21-U05）

## リスクと対策

| リスク | 対策 |
| --- | --- |
| D1 が想定 SQL を受け付けない | staging D1 migration dry-run / apply evidence を残す |
| DB constraint と `sync_locks` が二重正本になる | どちらを最終防衛線にするかを implementation guide に明記する |
| race test が local-only で false green になる | staging D1 で同時起動 smoke を実施する |

## 検証方法

- D1 migration dry-run / apply
- scheduled + manual sync の race smoke
- `sync_jobs` / `sync_locks` の状態確認 SQL
- 09b runbook SQL と実 migration / repository contract の grep 照合

## 完了条件

- [ ] 同種 `running` job の二重起動が DB constraint または同等 lock で防止される
- [ ] staging D1 で race smoke が PASS
- [ ] rollback 手順が migration runbook にある
- [ ] 09b release / incident runbook の `sync_jobs` 確認 SQL が実装と一致している
