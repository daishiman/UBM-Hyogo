# Phase 1 成果物 — 要件定義

## 1. 背景

issue #1054（`issue-57-followup-001-wrangler-binding-drift-ci-gate`）は、issue #57 の Phase 12 で「将来 follow-up」として分離された CI gate タスクである。issue #57 は「正本仕様（`deployment-cloudflare.md`）が稼働中の R2 binding を『未適用』と断言していた」ドリフトを、棚卸し表の手動新設で一度是正した。しかし棚卸し表は static snapshot であり、binding を追加・削除すると再びズレる。

## 2. 現状コード分析（解析対象 3 ソース・2026-06-02）

### 2.1 `apps/api/wrangler.toml`

- applied R2（env-prefixed のみ・top-level R2 無し）:
  - `UBM_AUDIT_COLD_STORAGE`（:121 / :209）
  - `UBM_AUDIT_APP_COLD_STORAGE`（:128 / :215）
  - `MEMBER_PHOTOS`（:134 / :222）← issue-983 で追加
- applied D1: `DB`（top + env.*）/ applied analytics: `SYNC_ALERTS`（top + env.*）
- コメントアウト（applied:false）: `SCHEMA_ALIAS_BACKFILL_QUEUE`（queue・:38 等）/ `ALERT_DEDUP_KV`（KV・:141 / :230）

### 2.2 `apps/api/src/env.ts`

`Env` interface に binding property: `DB` / `SYNC_ALERTS?` / `UBM_AUDIT_COLD_STORAGE?` / `UBM_AUDIT_APP_COLD_STORAGE?` / `MEMBER_PHOTOS?` / `SCHEMA_ALIAS_BACKFILL_QUEUE?` / `ALERT_DEDUP_KV?`。加えて secrets（`R2_ACCOUNT_ID?` 他多数）と vars。冒頭コメントで「wrangler.toml の binding 定義と本ファイルの `Env` interface を一対一対応として運用する」と宣言。

### 2.3 `deployment-cloudflare.md`「Current Cloudflare binding inventory」（:308〜）

| Binding | state |
| --- | --- |
| `UBM_AUDIT_COLD_STORAGE` | active |
| `UBM_AUDIT_APP_COLD_STORAGE` | active |
| `ALERT_DEDUP_KV` | optional/commented |
| `SESSION_KV` | not applied |
| `R2_BUCKET` | not applied |

→ **`MEMBER_PHOTOS` 行が欠落 = 三者ドリフトが現実化**。

## 3. binding 棚卸し（current code facts）

index.md の「binding 棚卸し（current code facts: 2026-06-02）」表（9 件）を正本とする。要点:

- 検出すべき DRIFT: `MEMBER_PHOTOS`（R2・applied・棚卸し表欠落）= `INVENTORY_MISSING`。
- fail させない: `SCHEMA_ALIAS_BACKFILL_QUEUE` / `ALERT_DEDUP_KV`（applied:false）。
- 突合除外: secrets（toml binding なし）。

## 4. スコープ

index.md「スコープ」を正本とする。含む = gate スクリプト / 回帰 spec / CI workflow / package script / 棚卸し表 MEMBER_PHOTOS 追記。含まない = 新規 binding 適用 / vars 整理 / KV ID guard / alert policy 連動 / Issue 状態変更。

## 5. 受入条件 AC-1〜AC-11

index.md「受入条件 (AC)」を正本とする（本 Phase で確定）。

## 6. 4 条件評価

| 観点 | 判定 |
| --- | --- |
| 価値性 | PASS |
| 実現性 | PASS |
| 整合性 | PASS |
| 運用性 | PASS |

## 7. 命名規則

- スクリプト: `scripts/verify-wrangler-binding-drift.mjs`
- package script: `verify:wrangler-binding-drift`
- workflow: `.github/workflows/verify-wrangler-binding-drift.yml`
- test: `scripts/__tests__/verify-wrangler-binding-drift.spec.ts`（不変条件 #8）
- ログ接頭辞: `[verify-wrangler-binding-drift]`

## 8. 結論

issue #1054 は他タスクで未解決。最新コードで `MEMBER_PHOTOS` の現存ドリフトが既に発生しており、本タスクは検出 gate 新設 + 現存ドリフト是正を 1 サイクルで完了する（CONST_007）。Phase 2 設計へ進む。
