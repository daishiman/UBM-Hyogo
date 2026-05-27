---
workflow_id: issue-265-forms-api-quota-sa-governance
phase: 1
taskType: docs-only
visualEvidence: NON_VISUAL
state: spec_created
---

# Phase 1 — 要件整理 / 実装区分判定

## 1. 実装区分判定（CONST_004 準拠）

**判定: `[実装区分: ドキュメントのみ]`**

判定根拠:

- 旧 U-UT01-06 が前提とした「Sheets API pull」は **Google Forms API** に移行済（`packages/integrations/google/`、`apps/api/src/jobs/sync-forms-responses.ts`）。
- ランタイム backoff / 429 retry は `apps/api/src/sync/sheets-client.ts:71-93`（指数バックオフ）と `apps/api/src/jobs/sync-forms-responses.ts:460`（`QUOTA` 分類）で既実装。本 spec の AC-1〜AC-5 は実装で達成済の振る舞いを runtime 変更なく governance 文書として固定する作業のみ。
- 旧申し送り先 UT-03 は CLOSED（`docs/30-workflows/completed-tasks/ut-03-sheets-api-auth-setup/`）。申し送り先が無くなったため、本 spec は **standalone governance doc** として確立する。
- 出力は新規 docs のみ（24 ファイル）。`apps/`, `packages/`, `scripts/`, `.github/`, `.claude/` 配下のコード/設定変更は行わない。

## 2. 親タスク / 起票元

| 項目 | 値 |
| --- | --- |
| 親タスク | UT-01（旧 Sheets→D1 同期方式定義） |
| 起票元 unassigned-task | `docs/30-workflows/unassigned-task/U-UT01-06-gcp-quota-allocation-handoff.md` |
| 起票元の起点 | UT-01 phase-12 `unassigned-task-detection.md` の MINOR-M-Q-01 |
| 旧申し送り先 | UT-03（CLOSED） → standalone 化 |

## 3. 現状コード調査結果（再調査不要・引用のみ）

| 項目 | 現状 | パス |
| --- | --- | --- |
| API 種別 | Google Forms API（Sheets API から移行済） | `packages/integrations/google/` |
| 同期ジョブ | Forms responses pull + D1 upsert | `apps/api/src/jobs/sync-forms-responses.ts` |
| Cron | `*/5 * * * *` / `*/15 * * * *` / `0 18 * * *` | `apps/api/wrangler.toml` の `[triggers]` |
| Runtime backoff | 429/5xx 指数 retry | `apps/api/src/sync/sheets-client.ts:71-93` |
| Quota 分類 | `QUOTA` 分類で metric 記録 | `apps/api/src/jobs/sync-forms-responses.ts:460` |
| SA 構成 | Forms API 用 1 SA を `packages/integrations/google` 内で使用 | （実値は op 参照のみ） |
| Form ID（固定値） | `119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg` | `CLAUDE.md` |

## 4. AC 5 件（Forms API 文脈に再フレーム）

- **AC-1**: Forms API quota 配分表（per-project 500 req/100s / per-user 60 req/min 等）を完成し、現 cron `*/5 * * * *` × batch 100 の余裕率 70% 以下に収まることを数値で固定。
- **AC-2**: SA JSON 分離原則（rotation 単位 / 監査単位 / 最小権限）を明文化。現 1 SA 構成への判断軸を併記。
- **AC-3**: 別 GCP project 切替 trigger 条件を事前 trigger ベースで明文化（70% 連続超過 / 監査境界 / billing 分離）。
- **AC-4**: ops runbook 雛形（SA メール / scope / Form ID / Secrets キー名）を運用コピー可能形式で配置。
- **AC-5**: 本 spec 配下に SA JSON / API Token / project ID の実値非混入を grep で確認（op 参照 / Secrets キー名のみ）。

## 5. スコープ外

- API 認証フロー実装（既実装 / 変更なし）
- 同期ジョブ実装と quota backoff コード（既実装 / 変更なし）
- Cloudflare Secrets への SA JSON 配置作業（運用作業 / 本 spec は雛形のみ）
- D1 物理スキーマ / migration

## 6. 入力リソース

- `docs/30-workflows/unassigned-task/U-UT01-06-gcp-quota-allocation-handoff.md`
- `docs/30-workflows/completed-tasks/01c-parallel-google-workspace-bootstrap/`
- `docs/30-workflows/completed-tasks/ut-03-sheets-api-auth-setup/`
- `docs/30-workflows/completed-tasks/01b-parallel-zod-view-models-and-google-forms-api-client/`
- `CLAUDE.md`
