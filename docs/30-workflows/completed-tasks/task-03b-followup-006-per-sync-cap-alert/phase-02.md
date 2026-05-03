[実装区分: 実装仕様書]

# Phase 2: スコープ確定 / アーキテクチャ整合 — task-03b-followup-006-per-sync-cap-alert

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 / 13 |
| task_id | TASK-03B-FOLLOWUP-006-PER-SYNC-CAP-ALERT |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local |

## 実行タスク

- 本 Phase の契約、境界、成果物を確認する。
- 後続 Phase が参照する前提を明文化する。
- user 承認が必要な実装、commit、push、PR、deploy を実行しない。

## 参照資料

- index.md
- artifacts.json
- phase-01.md

## 成果物

- phase-02.md

## 統合テスト連携

| 判定項目 | 結果 |
| --- | --- |
| NON_VISUAL spec-created gate | DOC_PASS |
| Runtime test execution | PENDING_IMPLEMENTATION_APPROVAL |

## 目的

Phase 1 で確定した要件を、UBM-Hyogo の不変条件・既存アーキテクチャ・無料枠制約と突き合わせ、scope in / out を最終化する。

## アーキテクチャ整合チェック

| 観点 | 整合性確認 |
| --- | --- |
| 不変条件 #5（D1 直接アクセスは apps/api 限定） | OK: detector / emit はすべて `apps/api/src/jobs/` 内 |
| 不変条件 #4（admin-managed data の分離） | 影響なし（sync_jobs は system metrics、PII を含まない既存設計） |
| Cloudflare Workers binding 制約 | Analytics Engine binding は wrangler.toml に追加し `Env` 型に反映 |
| 無料枠（D1 write 100k/day） | 200 × 96 = 19,200 write/day（19.2% 占有） |
| 無料枠（Analytics Engine 25M write/month） | 96 cron × 30 day × 1 emit ≈ 2,880/month（0.012% 占有） |
| Cron upper bound（free plan account 上限） | 既存 2 本構成を維持、追加 cron を作らない |

## scope 確定

### in

- `metrics_json.writeCapHit` フィールド追加（zod 拡張 + 既存 succeed() 経路に反映）
- detector helper 新規（`apps/api/src/jobs/cap-alert.ts`）
- Analytics Engine binding 追加（`wrangler.toml` × prod / staging）
- 単体テスト追加 / 既存テスト更新
- specs 追記（observability / cost guardrail 節）
- runbook 1 ページ
- DoD evidence: grep / SQL log / vitest pass log / staging dry-run log

### out

- 通知チャネル本体の構築（GitHub issue auto-creation script / Slack webhook 等）
- production deploy / cron 間隔変更
- per-sync cap = 200 値そのもののチューニング
- `sync_jobs` の DDL migration

## CONST_007 確認

本タスクは 1 サイクルで完結する。「通知チャネル本体構築」は 05a-parallel-observability cluster の独立スコープ（外部 secret 配備が必要）であり、CONST_007 例外条件に該当する旨は phase-12 unassigned-task-detection に記録する。

## 完了条件

- scope in / out 表が更新され、index.md と整合する
- アーキテクチャ整合チェックの全項目が OK
- CONST_007 例外（通知チャネル本体）が phase-12 unassigned 検出予定として明記されている
