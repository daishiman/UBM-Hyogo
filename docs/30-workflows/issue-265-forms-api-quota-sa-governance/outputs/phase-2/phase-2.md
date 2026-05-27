---
workflow_id: issue-265-forms-api-quota-sa-governance
phase: 2
taskType: docs-only
visualEvidence: NON_VISUAL
state: spec_created
---

# Phase 2 — 既存資産棚卸し

本 spec は **既決定資産の文書化** が主軸のため、本 phase で完了済タスクから「決まっている SA 構成 / cron 設定 / Secrets キー名 / Form ID」を棚卸して固定する。新規決定は Phase 3 以降で行う。

## 1. 完了済ワークフロー参照表

| ワークフロー | 確定事項 | 本 spec での参照場所 |
| --- | --- | --- |
| `completed-tasks/01c-parallel-google-workspace-bootstrap/` | GCP project / SA / OAuth client の作成元 | Phase 3 配分表 |
| `completed-tasks/ut-03-sheets-api-auth-setup/` | （CLOSED）旧 Sheets API 認証方式 — 申し送り先なし | Phase 7 stale ref 補修対象 |
| `completed-tasks/01b-parallel-zod-view-models-and-google-forms-api-client/` | Forms API client / view-model zod | Phase 3 quota 計算前提 |
| `completed-tasks/03a-parallel-forms-*` / `03b-parallel-forms-*` | Forms API 同期ジョブの batch size / cron 確定値 | Phase 3 余裕率算出 |

## 2. ランタイム実装の現状（コード参照）

| 項目 | 値 | 出典 |
| --- | --- | --- |
| Cron 1 | `*/5 * * * *`（5 分） | `apps/api/wrangler.toml` `[triggers]` |
| Cron 2 | `*/15 * * * *`（15 分） | 同上 |
| Cron 3 | `0 18 * * *`（日次 18:00 UTC） | 同上 |
| Batch size | 100 件 | `apps/api/src/jobs/sync-forms-responses.ts` |
| Backoff | 指数（1s/2s/4s/8s/16s/32s） | `apps/api/src/sync/sheets-client.ts:71-93` |
| Quota 分類 | `QUOTA` カテゴリで metric 計上 | `apps/api/src/jobs/sync-forms-responses.ts:460` |

## 3. SA / Secrets / Form ID 棚卸（実値は op 参照のみ）

| 項目 | 現状 | 記録欄（実値禁止） |
| --- | --- | --- |
| SA メール | Forms API 用 1 SA | `op://Vault/google-sa-forms/email` |
| SA JSON | Cloudflare Secrets 経由で同期ジョブに注入 | Cloudflare Secret 名: `GOOGLE_SERVICE_ACCOUNT_JSON`（キー名のみ・実値禁止） |
| OAuth scope | `https://www.googleapis.com/auth/forms.responses.readonly` 想定 | （Phase 3 で確定） |
| Form ID | `119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg` | `CLAUDE.md` 固定値（公開情報） |
| GCP project ID | （op 参照のみ） | `op://Vault/gcp/project-id` |

## 4. Forms API quota（Google 公開仕様）

| quota 種別 | 上限値 | 律速の可能性 |
| --- | --- | --- |
| per-project | 500 req / 100s / project | 主律速候補（同 project に複数 API 同居時） |
| per-user | 60 req / min / user | SA 単位で律速になり得る |
| per-method (forms.responses.list) | 個別上限あり（Google 側で変動） | 副次 |

## 5. 棚卸ギャップ

- AC-1（配分表）/ AC-3（project 切替 trigger）は docs 全域で未充足。
- AC-2 は `01c-parallel-google-workspace-bootstrap` で「用途分離原則」のみ言及あり、判断フローは未配置。
- AC-4 は旧 UT-03 申し送り雛形を **現行 ops runbook** に置換する必要。
- AC-5 は本 spec の grep gate で達成する。

このギャップは Phase 3（設計）で埋める。
