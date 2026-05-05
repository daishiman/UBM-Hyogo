# Phase 12 (2/6): System Spec Update Summary

> ステータス: spec_created / docs-only / NON_VISUAL
> 対象: 本タスクで確定した canonical 決定が、aiworkflow-requirements / UT-01 上流仕様 / 既存実装 / 既存 migration に対しどのような追補・申し送りを生むかをサマリ化する。

---

## 1. 本タスクで確定した canonical（再掲）

| 軸 | 確定値 |
| --- | --- |
| retry max | 3（既定）+ `SYNC_MAX_RETRIES` env で上書き可 |
| backoff | base 1s, factor 2, cap 32s, jitter ±20% |
| `processed_offset` | INTEGER NOT NULL DEFAULT 0、chunk index 単位 |
| migration | 列追加 1 件、backfill 不要、rollback 2 案 |
| quota worst case | 0.4%（2 req / 100s） |

## 2. 上流仕様への申し送り（UT-01）

| ファイル | 加筆内容 | 反映タイミング |
| --- | --- | --- |
| `docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-method-comparison.md` §5 | retry=3 / backoff curve に jitter ±20% 注記、U-UT01-09 で確定の参照リンク追加 | 後続 docs-update PR |
| `.../sync-log-schema.md` §2 / §9 | `processed_offset` の単位 = chunk index を明記、本タスク参照 | 後続 docs-update PR |

※ 本タスクでは `completed-tasks/` 配下を編集しない（completed の不変性維持）。後続 docs-update タスクで反映。

## 3. 実装側追補（UT-09）

| 対象 | 追補内容 |
| --- | --- |
| `apps/api/src/jobs/sync-sheets-to-d1.ts` | retry=3 既定 + chunk 進捗 UPDATE + 再開ロジック |
| `apps/api/src/utils/with-retry.ts` | base 1s / cap 32s / jitter ±20% |
| `apps/api/migrations/0003_processed_offset.sql` | 新規 |
| `apps/api/wrangler.toml` / `.dev.vars` | `SYNC_MAX_RETRIES = "3"` |

## 4. ledger 整合（U-UT01-07）

| 対象 | 追補内容 |
| --- | --- |
| `sync_log` 論理 ↔ `sync_job_logs` 物理 mapping | `processed_offset` 行追加 |

## 5. enum 整合（U-UT01-08）

直交範囲のため本タスクからの追補なし。

## 6. aiworkflow-requirements skill への反映

| 対象 | 反映内容 |
| --- | --- |
| `indexes/quick-reference.md` sync / retry 索引 | 「U-UT01-09 で retry=3, backoff 1s〜32s, processed_offset chunk index」を追補 |
| `indexes/resource-map.md` retry / offset policy | 本 workflow root と UT-09 / U-UT01-07 への委譲境界を追加 |
| `references/database-schema.md` | `processed_offset` の物理 schema 規約（chunk index 単位、INTEGER NOT NULL DEFAULT 0）を legacy Sheets sync transition note として追補 |
| `references/task-workflow-active.md` | U-UT01-09 を active/spec_created docs-only task として追加 |
| `SKILL.md` / `LOGS/_legacy.md` | same-wave sync の変更履歴を追加 |

`topic-map.md` / `keywords.json` の機械再生成はリポジトリの index generator 実行時に追従する。本 close-out では人間が最初に読む導線（quick-reference / resource-map）と正本本文を先に同期する。

## 7. 反映タイムライン

| 時期 | 作業 | 担当タスク |
| --- | --- | --- |
| 即時 | 本仕様書 PR（Phase 13）でマージ | U-UT01-09 |
| Day 1-7 | UT-09 実装 + staging 適用 | UT-09 |
| Day 8 | 過渡期 7 日経過後 production 適用 | UT-09 |
| 並行 | UT-01 上流仕様への加筆 | docs-update follow-up |
| 並行 | aiworkflow-requirements indexes 再生成 | UT-09 / docs-update |

## 8. 完了条件チェック

- [x] canonical 値の再掲
- [x] UT-01 上流加筆計画
- [x] UT-09 実装追補
- [x] U-UT01-07 ledger 申し送り
- [x] aiworkflow-requirements 追補
- [x] 反映タイムライン
