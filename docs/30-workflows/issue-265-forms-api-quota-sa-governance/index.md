# issue-265 — Forms API quota / Service Account governance

| 項目 | 値 |
| --- | --- |
| workflow_id | issue-265-forms-api-quota-sa-governance |
| Issue | [#265](https://github.com/daishiman/UBM-Hyogo/issues/265) (CLOSED 2026-05-26) |
| 起票元 unassigned-task | `docs/30-workflows/unassigned-task/U-UT01-06-gcp-quota-allocation-handoff.md` |
| 親タスク | UT-01（旧 Sheets→D1 同期方式定義 / 現 Forms API 移行済） |
| 旧申し送り先 | UT-03（CLOSED — 申し送り不能。本 spec を standalone governance doc として再フレーム） |
| 実装区分 | **ドキュメントのみ** |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| 状態 | spec_created |

---

## 目的

UT-01 当時の Sheets API 採択は **Google Forms API** へ移行済（`packages/integrations/google/`,
`apps/api/src/jobs/sync-forms-responses.ts`）。旧申し送り先 UT-03 は CLOSED のため、本 spec を
**Forms API quota / Service Account 分離方針の standalone governance doc** として確立する。

cron は `apps/api/wrangler.toml` の `[triggers]` で `*/5 * * * *` / `*/15 * * * *` / `0 18 * * *`
で稼働中。ランタイム backoff は `apps/api/src/sync/sheets-client.ts` および
`apps/api/src/jobs/sync-forms-responses.ts` で実装済 (`QUOTA` 分類)。本 spec は純粋に governance
/ ops runbook 整備であり、コード変更を伴わない。

---

## 受入条件（AC・Forms API 文脈に再フレーム済）

- **AC-1**: Forms API quota 配分表（per-project / per-user / per-method）が完成し、現 cron
  `*/5 * * * *` × batch 100 を前提に余裕率 70% 以下に収まることが数値で固定されている。
- **AC-2**: Service Account JSON の分離原則（rotation 単位 / 監査単位 / 最小権限）が文書化され、
  現状（`packages/integrations/google` の 1 SA 構成）に対する判断軸が明示されている。
- **AC-3**: 別 GCP project への切替 trigger 条件（quota 使用率 70% を 2 週連続超過 /
  監査境界分離の要件化 / billing 分離の要件化）が事前 trigger ベースで明文化されている。
- **AC-4**: ops runbook 雛形（SA メール欄 / scope / Form ID = CLAUDE.md 固定 `119ec539...` /
  Cloudflare Secrets キー名一覧）が完成し、運用時にコピーして使える形で残っている。
- **AC-5**: 本 spec 配下に SA JSON / API Token / project ID の実値が一切含まれないことが
  grep で確認されている（`op://Vault/Item/Field` 参照 / Secrets キー名のみ）。

---

## Phase 1-13 一覧

| Phase | doc | 内容 |
| --- | --- | --- |
| 1 | `phase-1.md` / `outputs/phase-1/phase-1.md` | 要件整理・実装区分判定（docs-only） |
| 2 | `phase-2.md` / `outputs/phase-2/phase-2.md` | 既存資産棚卸し（SA / cron / Secrets キー名） |
| 3 | `phase-3.md` / `outputs/phase-3/phase-3.md` | 配分表・判断フロー・runbook ToC 設計 |
| 4 | `phase-4.md` / `outputs/phase-4/phase-4.md` | 検証戦略（grep / link / 計算 walkthrough） |
| 5 | `phase-5.md` / `outputs/phase-5/phase-5.md` | doc 執筆手順 |
| 6 | `phase-6.md` / `outputs/phase-6/phase-6.md` | UT-08 / UT-25 連携 |
| 7 | `phase-7.md` / `outputs/phase-7/phase-7.md` | unassigned-task consumed trace 方針 |
| 8 | `phase-8.md` / `outputs/phase-8/phase-8.md` | 運用・リスク（実値混入 / API 同居） |
| 9 | `phase-9.md` / `outputs/phase-9/phase-9.md` | 観測 / SLO（Cloudflare logs 参照） |
| 10 | `phase-10.md` / `outputs/phase-10/phase-10.md` | go/no-go 基準 |
| 11 | `phase-11.md` / `outputs/phase-11/phase-11.md` | NON_VISUAL evidence inventory |
| 12 | `phase-12.md` / `outputs/phase-12/*` | canonical 9 headings + strict 7 |
| 13 | `phase-13.md` / `outputs/phase-13/phase-13.md` | クロージング（completed-tasks 移動 / consumed trace） |

---

## 参照

- `docs/30-workflows/unassigned-task/U-UT01-06-gcp-quota-allocation-handoff.md`
- `apps/api/wrangler.toml`（`[triggers]`）
- `apps/api/src/jobs/sync-forms-responses.ts`
- `apps/api/src/sync/sheets-client.ts`
- `packages/integrations/google/`
- `CLAUDE.md` — シークレット管理ルール
