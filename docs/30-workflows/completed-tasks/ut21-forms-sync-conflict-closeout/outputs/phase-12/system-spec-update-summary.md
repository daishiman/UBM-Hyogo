# Phase 12 Output: System Spec Update Summary

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | task-ut21-forms-sync-conflict-closeout-001 |
| Phase | 12 |
| タスク種別 | docs-only / specification-cleanup / legacy-umbrella close-out |
| visualEvidence | NON_VISUAL |
| workflow_state | `spec_created`（据え置き） |
| 作成日 | 2026-04-30 |

本書は task-specification-creator skill `references/spec-update-workflow.md` に準拠し、Step 1-A / 1-B / 1-C と Step 2 の判定（本タスクでは not required）を網羅する。

---

## Step 1-A: 完了タスク記録 + 関連 doc リンク + 変更履歴 + LOGS ×2 + topic-map

| # | 同期対象 | パス | 反映内容 |
| --- | --- | --- | --- |
| 1 | task-level LOGS | `docs/30-workflows/LOGS.md` | UT-21 close-out（本タスク）の Phase 1〜12 完了行を 2026-04-30 付で追記 |
| 2 | LOGS skill #1 | `.claude/skills/aiworkflow-requirements/LOGS.md`（または `LOGS/_legacy.md`） | `task-workflow.md` current facts への「UT-21 は legacy umbrella として close-out 済」追記イベントを記録 |
| 3 | LOGS skill #2 | `.claude/skills/task-specification-creator/LOGS.md`（または `LOGS/_legacy.md`） | legacy umbrella close-out（UT-09 姉妹形式）の再利用例として記録 |
| 4 | SKILL #1 変更履歴 | `.claude/skills/aiworkflow-requirements/SKILL.md` | `v2026.04.30-ut21-forms-sync-closeout` 行を変更履歴テーブルに追加 |
| 5 | SKILL #2 変更履歴 | `.claude/skills/task-specification-creator/SKILL.md` | legacy umbrella 再利用例の参照行を任意項目として追加 |
| 6 | references current facts【最重要】 | `.claude/skills/aiworkflow-requirements/references/task-workflow.md` | 下記「current facts 追記文言」を line 9 付近に固定文として記載 |
| 7 | indexes 再生成 | `.claude/skills/aiworkflow-requirements/indexes/{resource-map,quick-reference,topic-map}.md` / `keywords.json` | `node scripts/generate-index.js` 経由で「UT-21 close-out」「Forms sync 正本」「sync_jobs ledger」「legacy umbrella」キーワードを追加し同一 wave で再生成 |
| 8 | topic-map | `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | 「legacy umbrella close-out 一覧」観点で UT-09 / UT-21 を横断参照可能化 |
| 9 | 関連 doc リンク | 03a / 03b / 04c / 09b / 02c / 姉妹 close-out（`task-sync-forms-d1-legacy-umbrella-001`）/ 後続 U02 / U04 / U05 | 各 index.md の関連タスク欄に本 close-out への双方向 cross-link |
| 10 | Cloudflare deployment stale note | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | Sheets 由来 cron / `runSync` / Sheets API v4 記述を legacy current-fact 残存として注記し、runtime cron / wrangler 整理を UT21-U05 へ委譲 |

### `task-workflow.md` current facts 追記文言（固定文・コピペ用）

> 「UT-21（Sheets sync direct 実装）は legacy umbrella として close-out 済（2026-04-30）。Forms sync（`forms.get` / `forms.responses.list` + `sync_jobs` ledger + `apps/api/src/jobs/sync-forms-responses.ts` / `apps/api/src/sync/schema/*`）が現行正本。`POST /admin/sync` / `GET /admin/sync/audit` / `sync_audit_logs` / `sync_audit_outbox` は新設しない（要否判定は U02 後まで保留）。close-out 仕様書: `docs/30-workflows/ut21-forms-sync-conflict-closeout/`」

---

## Step 1-B: 実装状況テーブル更新（spec_created 据え置き）

| 対象 | 旧状態 | 新状態 | 備考 |
| --- | --- | --- | --- |
| 本タスク `index.md` / `artifacts.json` | spec_created | **spec_created（据え置き）** | docs-only / legacy umbrella close-out のため `implemented` 昇格は禁止 |
| `metadata.docsOnly` | true | true（維持） | 実コード混入時の implemented 再判定ルートには入らない |
| UT-21 当初仕様書状態欄（`docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md`） | active | **legacy / close-out 済** | line 11 / 14 付近に「現行 Forms sync を正本とする / 本 close-out 仕様書 → `docs/30-workflows/ut21-forms-sync-conflict-closeout/`」をパッチ追記 |
| 派生 implementation タスク（03a/03b/04c/09b） | 各タスク状態を尊重 | 変更なし | 本 PR は cross-link のみ。実 patch 適用は各タスクの Phase 内 |

> **据え置きルール**: 本タスク完了時点でも `workflow_state` を `implemented` に昇格させない。`implemented` 昇格は派生 03a / 03b / 04c / 09b および後続 U02 / U04 / U05 完了後の責務とする。

---

## Step 1-C: 関連タスクテーブル更新

| 対象 index.md | 反映内容 |
| --- | --- |
| `docs/30-workflows/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md` | 関連タスクに本 close-out 追記。受入条件 patch（Bearer 認可境界 / 409 排他 / D1 retry）の引き渡しを cross-link |
| `docs/30-workflows/03b-parallel-forms-response-sync-and-current-response-resolver/index.md` | 同上（Forms response sync 側 patch 案を cross-link） |
| `docs/30-workflows/04c-parallel-admin-backoffice-api-endpoints/index.md`（存在時） | Bearer guard 移植先として cross-link。未存在時は U05 / 04c 起票時に追記指示を documentation-changelog に残置 |
| `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md` | manual smoke + runbook の引き渡し先として cross-link |
| `docs/30-workflows/02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary/index.md` | `sync_jobs` ledger / D1 直接アクセス境界の整合確認を双方向リンク |
| `docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` | 姉妹 close-out として相互参照（フォーマット参考の双方向化） |
| `docs/30-workflows/unassigned-task/task-ut21-{sync-audit-tables-necessity-judgement-001,phase11-smoke-rerun-real-env-001,impl-path-boundary-realignment-001}.md` | U02 / U04 / U05 への双方向 cross-link |

> 実 patch 適用は各タスクの Phase で行う。本 PR は cross-link のみで完結する。

> **実体確認注記**: 03a / 03b / 04c / 09b / 02c の `index.md` が本ワークツリーに存在しない場合、本 close-out から直接 patch しない。移植先の実体追記は U05 または各タスク起票/再開時の Phase 内で行い、本タスクでは片方向 cross-link と U05 scope 追補で閉じる。

---

## Step 2: 新規インターフェース追加判定

**判定: not required**

| 観点 | 状態 |
| --- | --- |
| 新規 REST endpoint 追加 | なし（`POST /admin/sync` / `GET /admin/sync/audit` の **新設禁止** が成果物そのもの） |
| 新規 D1 schema 追加 | なし（`sync_audit_logs` / `sync_audit_outbox` は U02 判定後まで保留） |
| 新規 Worker binding 追加 | なし |
| 新規 IPC / Cron handler 追加 | なし（既存 `apps/api/src/jobs/*` + `apps/api/src/sync/schema/*` 構成を正本確定） |
| 新規 Secret 導入 | なし（`SYNC_ADMIN_TOKEN` / `GOOGLE_FORMS_API_KEY` は既存 / 参照のみ） |

> 本タスクは docs-only / legacy umbrella close-out であり、IF 追加 PR ではない。Step 2（新規 IF の specs 反映）は not required。pitfalls #8 を遵守。

---

## 4条件 最終判定

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | Step 1-A current facts 追記文言と本仕様書の差分表が一致（Phase 11 spec-integrity-check.md と同値） |
| 漏れなし | PASS | LOGS ×2 + SKILL ×2 + references + indexes 4 + topic-map + UT-21 状態欄 + 関連 6 タスク index を網羅 |
| 整合性あり | PASS | Forms sync 正本 / `sync_jobs` ledger / `apps/api` 境界（不変条件 #5）に統一 |
| 依存関係整合 | PASS | 03a/03b/04c/09b/02c + U02/U04/U05 + 姉妹 close-out への cross-link 完備 |

---

## Phase 11 引き継ぎとの紐付け

- Phase 11 `manual-smoke-log.md` の rg 出力（impl + refs 計 40 件・新設前提 0 件）を本書 Step 1-A の整合根拠として参照
- Phase 11 `spec-integrity-check.md` の 13 phase × 2 ledger 整合 PASS を本書 Step 1-B の据え置き根拠として参照
- Phase 11 `link-checklist.md`（32 OK / 1 N/A / 0 MISSING）を Step 1-C の cross-link 設計根拠として参照
