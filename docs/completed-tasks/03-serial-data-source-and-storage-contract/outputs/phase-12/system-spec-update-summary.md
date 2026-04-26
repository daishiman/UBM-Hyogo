# Phase 12 / system-spec-update-summary.md — system spec 更新概要

## Step 1 完了記録

| 項目 | 状態 |
| --- | --- |
| Phase 1〜11 完了 | 完了 |
| Phase 10 gate | PASS |
| Phase 11 evidence | NON_VISUAL 代替証跡で集約済み |
| 必須成果物 | Phase 4〜12 全配置 |

## Step 2 domain spec sync 判断

aiworkflow-requirements の references を更新するか否かの判定:

| reference | 判定 | 理由 |
| --- | --- | --- |
| `architecture-overview-core.md` | 更新不要 | D1 schema は本タスク outputs（phase-02 / phase-05）が正本。core ref は「D1 を canonical store として apps/api 配下に配置」の原則を既に記述しており、原則の変更なし |
| `deployment-cloudflare.md` | 更新不要 | 実 `apps/api/wrangler.toml` の `staging` / top-level production と D1 database 名に runbook を同期済み。上位原則の変更なし |
| `deployment-core.md` | 更新不要 | rollback 基本方針（dump→restore + Sheets 真として再 backfill）は既存方針を踏襲 |
| `environment-variables.md` | 更新不要 | `GOOGLE_SERVICE_ACCOUNT_JSON` は Cloudflare Secrets canonical / 1Password local canonical / GitHub Secrets は CI 用、という既存原則と整合 |
| `doc/00-getting-started-manual/specs/08-free-database.md` | 更新不要 | D1 schema 正本は既存の `member_responses` / `member_identities` / `member_status` と一致するよう本タスク runbook 側を補正 |

判断根拠: 本タスクは原則を新設せず、既存原則を data contract 形式で具体化したもの。ゆえに references の本文更新は不要。

## doc/00-getting-started-manual/specs/ への影響

| spec | 判定 | 理由 |
| --- | --- | --- |
| 01-api-schema.md | 影響なし（不変条件 1 / 31 問・6 section を変更しない） | schema drift は raw_payload で吸収（A7） |
| 02-auth.md | 影響なし | 認証経路は別タスクで継続 |
| 08-free-database.md | 補完関係 | 本タスクの constants（cron 1h / batch 100）が無料枠内であることを QA で確認 |
| 13-mvp-auth.md | 影響なし | |

## downstream への通知事項

- 04: env / Secrets 正本表（refactor-record §2）を参照。Cloudflare env 名は `staging` / top-level production。
- 05a: sync constants（refactor-record §3）を観測閾値の前提に。`sync_audit` は `audit_id` / `failed_reason` / `inserted_count` 系列。
- 05b: phase-05 runbook 群を smoke 入力に。DB 名は `ubm-hyogo-db-staging` / `ubm-hyogo-db-prod`。

## 完了条件

- [x] Step 1 完了記録
- [x] Step 2 domain spec sync 判断（更新要否を全 ref で記録）
- [x] downstream 通知事項を明記
