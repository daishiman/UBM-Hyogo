# Phase 8: DRY / 責務確認 — 結果

## 実行日時
2026-05-02

## 隣接タスクとの責務分担

| タスク | 責務 | 本タスクとの境界 |
| --- | --- | --- |
| `task-issue-191-schema-aliases-implementation-001` | local migration 作成 / repository / 07b wiring / 03a lookup / contract tests | コード実装は完了済み。本タスクは production apply のみ |
| `task-issue-191-schema-questions-fallback-retirement-001` | `schema_questions.stable_key` fallback 廃止 | 本タスクの apply 完了が前提。fallback 廃止は別タスク |
| `task-issue-191-direct-stable-key-update-guard-001` | `UPDATE schema_questions SET stable_key` の guard | 本タスクの apply 完了後に実装。本タスクには含めない |
| 07b endpoint rename / apps/web 変更 | HTTP path / UI | 本タスクのスコープ外 |
| Worker bundle deploy | apps/api / apps/web の production deploy | 本タスクは D1 schema apply のみ |

## DRY 観点

| 項目 | 状態 |
| --- | --- |
| migration ファイル | `apps/api/migrations/0008_create_schema_aliases.sql` を SSOT。複製しない |
| Cloudflare CLI | `scripts/cf.sh` を共通ラッパーとして利用。wrangler 直叩きを増やさない |
| evidence template | 先行タスクの Phase 11 template を踏襲し、production 版として ID プレフィックスのみ差し替え |
| SSOT 更新箇所 | `database-schema.md` の production apply 状態 marker は本タスクのみが更新 |

## 重複検出

- 重複なし。本タスクは「production D1 への `schema_aliases` apply」のみに閉じている。
- code deploy / fallback retirement / guard 実装はスコープ外として明示し、Phase 12 unassigned-task-detection には別タスク候補として記録済み。

## 完了判定

- [x] 隣接タスクとの境界表が埋まっている
- [x] 本タスクが apply 操作 + evidence + SSOT 更新に閉じていることを確認
