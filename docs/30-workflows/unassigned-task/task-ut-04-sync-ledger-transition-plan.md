# UT-04 sync ledger transition plan

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | TASK-UT04-SYNC-LEDGER-TRANSITION-001 |
| 状態 | unassigned |
| 作成日 | 2026-04-29 |
| 出典 | docs/30-workflows/ut-04-d1-schema-design/index.md |
| 優先度 | HIGH |

## 目的

`sync_jobs` と既存 `sync_job_logs` / `sync_locks` の責務を整理し、UT-09 / UT-21 が参照する同期 ledger を一意にする。

## スコープ

含む:

- `sync_jobs`、`sync_job_logs`、`sync_locks` の責務表
- 既存 migration を変更しない前提での共存・移行方針
- UT-09 sync 実装が参照するテーブルの確定

含まない:

- 既存 migration の破壊的変更
- 本番データ削除

## 苦戦箇所【記入必須】

UT-04 の正本 6 テーブルには `sync_jobs` が含まれる一方、既存 migration には `sync_job_logs` / `sync_locks` も存在する。これを legacy とだけ書くと、実 DB に存在するテーブルの扱いが曖昧になる。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| 同期履歴が複数テーブルに分散 | 書き込み先を UT-09 で一意に決め、読み取り互換が必要なら view / adapter を定義する |
| lock と job ledger の責務混同 | `sync_locks` は排他制御、`sync_jobs` は実行単位、`sync_job_logs` は履歴として分類する |

## 検証方法

- `rg -n "sync_jobs|sync_job_logs|sync_locks" apps/api packages/shared docs/30-workflows`
- UT-09 Phase 11 で実際の書き込み先を確認

## 受入条件

- 3 テーブルの owner / lifecycle / read-write policy が文書化される
- UT-09 / UT-21 の依存表が矛盾しない
