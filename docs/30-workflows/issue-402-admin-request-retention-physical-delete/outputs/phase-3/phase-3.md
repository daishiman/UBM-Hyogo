# Phase 3: アーキテクチャ

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 / 13 |
| 作成日 | 2026-05-06 |
| 状態 | spec_created |

## 目的

Cloudflare Workers Cron Trigger 配下で動く retention purge job のアーキテクチャを確定する。D1 binding 取得経路、削除対象テーブル依存図、dry-run mode のデータフロー、rollback 境界を明示する。

## コンポーネント図

```
+------------------------------------+
| Cloudflare Workers (apps/api)     |
|                                    |
|  scheduled(event, env, ctx)       |
|     │                              |
|     ▼                              |
|  runRetentionPurge(env, {dryRun}) |
|     │                              |
|     ▼                              |
|  applyRetentionPolicy(db, policy) |
|     │                              |
|     ├─► env.DB (D1 binding)       |
|     │     - member_responses      |
|     │     - member_identities     |
|     │     - member_status         |
|     │     - deleted_members       |
|     │                              |
|     └─► RetentionPurgeReport      |
|         (logged via console.info) |
+------------------------------------+
```

## D1 binding 取得経路

- `wrangler.toml` の `[[d1_databases]] binding = "DB"` を再利用（既存）
- `scheduled(event, env, ctx)` で `env.DB` を `runRetentionPurge` に渡す
- Hono ルータからは独立（cron 専用 entry）

## 削除対象テーブル依存図（cascade なし前提）

```
[member_responses] ──FK──► [member_identities] ──FK──► [member_status]
                                                            │
                                                            ▼
                                                    [deleted_members]
                                                    (audit, 匿名化のみ)
```

削除/匿名化順序（policy version v1-2026-05）:

1. `member_responses` 物理削除（最も葉側）
2. `member_identities` 物理削除
3. `member_status` 物理削除
4. `deleted_members` PII 列匿名化 + `purged_at='anonymized'` + `purged_at=now`

各 step は別 transaction とし、途中失敗時に部分進行を許す（次回 cron で resume）。`purged_at` 列によって冪等化する。

## dry-run mode 設計

- `dryRun: true` のとき、すべての DELETE/UPDATE を `SELECT` に置換し candidate 件数のみ集計
- 出力: `RetentionPurgeReport` の `appliedCount === 0` かつ `candidateCount > 0` の組み合わせ
- 不変条件: `dryRun === true ⇒ ∀ summary, summary.appliedCount === 0`
- HTTP 経由 trigger (`/__scheduled?cron=...&dryRun=1`) を staging で許容

## rollback 境界

| 段階 | rollback 可否 | 経路 |
| --- | --- | --- |
| 論理削除（`deleted_members` 行作成済 / retention 期間内） | 可 | admin operation で `deleted_members` 削除 + `member_*` 復元 |
| dry-run 実行 | 副作用なし | rollback 不要 |
| apply 実行中（part complete） | 部分復元のみ可 | `purged_at` で resume。完了済 step は **D1 PITR** が唯一の復旧経路 |
| apply 完了後 | **不可逆** | D1 PITR (Point-In-Time Recovery, 30日保持) のみ。manual runbook に手順記載 |

## 失敗時挙動

- 各 table step を個別 try/catch
- error は `RetentionPurgeReport.errors[]` に追記し job は次の table へ進む（fail-soft）
- `deleted_members.purged_at='failed'` を立て、次回 cron で再試行
- 連続 N 回失敗時は admin notification（本タスクスコープ外、将来 #319 系統で吸収）

## セキュリティ / 観測性

- Cron Trigger は workers 内部呼び出しで認証不要
- HTTP 経由 manual trigger (`/__scheduled` 等) は staging のみで許可、production は wrangler.toml `routes` から外す
- 全 run は `console.info(JSON.stringify(report))` で Workers Logs に出力（PII 含まず id / count のみ）

## 成果物

- `outputs/phase-3/phase-3.md`
- `outputs/phase-3/dependency-graph.md`
- `outputs/phase-3/dry-run-data-flow.md`
- `outputs/phase-3/rollback-boundary.md`
