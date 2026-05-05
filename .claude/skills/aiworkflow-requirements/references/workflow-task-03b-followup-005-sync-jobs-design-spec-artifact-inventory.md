# 03b-followup-005-sync-jobs-design-spec Artifact Inventory

## メタ情報

| 項目 | 内容 |
|---|---|
| タスクID | 03b-followup-005-sync-jobs-design-spec |
| タスク種別 | spec / implementation（NON_VISUAL / verified） |
| ワークフロー | completed（Phase 1-13 完了 / Issue #198 CLOSED） |
| canonical task root | `docs/30-workflows/completed-tasks/03b-followup-005-sync-jobs-design-spec/` |
| 同期日 | 2026-05-03 |
| owner | apps/api |
| domain | sync jobs / cron / D1 cursor store / metrics |
| depends_on | 03b（response sync 既存実装）, 02c（admin notes audit sync_jobs initial schema） |
| 委譲先 | sync_jobs 物理 migration follow-up（unassigned-task）, sync_jobs literal lint enforcement follow-up（unassigned-task） |

## Acceptance Criteria

詳細は `docs/30-workflows/completed-tasks/03b-followup-005-sync-jobs-design-spec/outputs/phase-07/main.md` を正本とする（AC-matrix）。要点:

- AC-1: `_design/sync-jobs-spec.md` が論理正本として `sync_jobs` テーブル列、`job_type` enum、状態遷移、`metrics_json` shape、lock TTL、PII guard を網羅する
- AC-2: `apps/api/src/jobs/_shared/sync-jobs-schema.ts` が TS SSOT として `SYNC_JOB_TYPES` / `SYNC_LOCK_TTL_MS` / `SyncJobMetricsZ` / `parseMetricsJson` / `assertNoPii` を export する
- AC-3: TS SSOT 側 file header に「論理正本: `_design/sync-jobs-spec.md`」明記
- AC-4: markdown 正本側に「TS SSOT 同期義務」セクション明記
- AC-5: `apps/api/src/repository/syncJobs.ts` が TS SSOT を参照し、`job_type` 文字列リテラルを撤去
- AC-6: `apps/api/src/jobs/cursor-store.ts` が TS SSOT 参照に切替
- AC-7: `apps/api/src/jobs/sync-forms-responses.ts` が `RESPONSE_SYNC` 定数経由で job 起動
- AC-8: `apps/api/src/jobs/__fixtures__/d1-fake.ts` が新 schema fixture で動作
- AC-9: `repository/__tests__/syncJobs.test.ts` が `parseMetricsJson` / `assertNoPii` / lock TTL を網羅
- AC-10: `references/database-schema.md` の `sync_jobs` セクションが `_design` リンクと TS SSOT リンクを併記
- AC-11: PII guard が write (`succeed()` / `fail()`) と read (`parseMetricsJson`) の両側で適用
- AC-12: D1 物理 migration 変更は本タスクスコープ外であることが明示される

## 不変条件 Trace

| 不変条件 | 該当箇所 | 対応 |
|---|---|---|
| #1 schema 固定しすぎない | TS SSOT は enum / shape のみで Form schema には踏み込まない | `SyncJobMetricsZ` は cron job metrics に限定 |
| #4 admin-managed data 分離 | `metrics_json` に PII / member 個人情報を入れない | `assertNoPii()` を write/read 両側で適用 |
| #5 D1 直接アクセス禁止 | sync jobs / cursor store は `apps/api` 配下に閉じる | 物理ファイル配置（`apps/api/src/jobs/`、`apps/api/src/repository/syncJobs.ts`） |

## Phase Outputs

| Phase | 場所 | 主要成果物 |
|---|---|---|
| 1 | `docs/30-workflows/completed-tasks/03b-followup-005-sync-jobs-design-spec/phase-01.md` / `outputs/phase-01/main.md` | 要件定義（dual-canonical 方針） |
| 2 | `phase-02.md` / `outputs/phase-02/main.md` | 設計（job_type enum / metrics shape / lock TTL） |
| 3 | `phase-03.md` / `outputs/phase-03/main.md` | API / repository 契約 |
| 4 | `phase-04.md` / `outputs/phase-04/main.md` | テスト戦略 |
| 5 | `phase-05.md` / `outputs/phase-05/main.md` | repository / cron job 設計 |
| 6 | `phase-06.md` / `outputs/phase-06/main.md` | view-model（管理 UI なし / NON_VISUAL） |
| 7 | `phase-07.md` / `outputs/phase-07/main.md` | AC matrix 正本 |
| 8 | `phase-08.md` / `outputs/phase-08/main.md` | TS SSOT 共通化判断 |
| 9 | `phase-09.md` / `outputs/phase-09/main.md` | 不変条件 trace |
| 10 | `phase-10.md` / `outputs/phase-10/main.md` | E2E / contract 移送判断 |
| 11 | `phase-11.md` / `outputs/phase-11/main.md` | NON_VISUAL alternative evidence |
| 12 | `phase-12.md` / `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,phase12-task-spec-compliance-check,unassigned-task-detection,skill-feedback-report,documentation-changelog}.md` + `elegant-review-30-methods.md` | close-out 7 strict files |
| 13 | `phase-13.md` | ユーザー承認 / PR / Issue #198 CLOSED |

## 主要 Artifact

### 論理正本（markdown SSOT）

| ファイル | 役割 |
|---|---|
| `docs/30-workflows/_design/sync-jobs-spec.md` | sync_jobs テーブル / job_type enum / 状態遷移 / metrics_json shape / lock TTL / PII guard の人間可読仕様 |

### TS SSOT（runtime）

| ファイル | 役割 | AC trace |
|---|---|---|
| `apps/api/src/jobs/_shared/sync-jobs-schema.ts` | `SYNC_JOB_TYPES` / `SYNC_LOCK_TTL_MS` / `SyncJobMetricsZ` / `parseMetricsJson` / `assertNoPii` を export | AC-2 / AC-3 |
| `apps/api/src/jobs/_shared/__tests__/sync-jobs-schema.test.ts`（同 wave 想定） | TS SSOT の値・shape assert | AC-2 / AC-9 |

### 改修 Consumer

| ファイル | 役割 | AC trace |
|---|---|---|
| `apps/api/src/jobs/cursor-store.ts` | TS SSOT 参照に切替（job_type 定数経由） | AC-6 |
| `apps/api/src/jobs/sync-forms-responses.ts` | `SYNC_JOB_TYPES.RESPONSE_SYNC` 定数経由で job 起動 | AC-7 |
| `apps/api/src/repository/syncJobs.ts` | `succeed()` / `fail()` で `assertNoPii` 適用、TS SSOT 参照 | AC-5 / AC-11 |
| `apps/api/src/repository/__tests__/syncJobs.test.ts` | `parseMetricsJson` / `assertNoPii` / lock TTL 網羅 | AC-9 / AC-11 |
| `apps/api/src/jobs/__fixtures__/d1-fake.ts` | 新 schema 整合 fixture | AC-8 |

### Spec（正本仕様 / 同期）

| ファイル | 反映内容 | AC trace |
|---|---|---|
| `docs/30-workflows/_design/sync-jobs-spec.md` | 論理正本（新規） | AC-1 / AC-4 |
| `.claude/skills/aiworkflow-requirements/references/database-schema.md` | `sync_jobs` セクションに `_design` link / TS SSOT link / PII guard 二段適用を併記 | AC-10 |

### Unassigned-task（依存差替・follow-up）

| ファイル | 役割 |
|---|---|
| `docs/30-workflows/unassigned-task/03b-followup-006-sync-jobs-physical-migration.md`（候補） | 物理 schema 変更を別タスクに委譲 |
| `docs/30-workflows/unassigned-task/03b-followup-007-sync-jobs-literal-lint.md`（候補） | `job_type` 文字列リテラル拡散の lint enforcement |

## Skill 反映先（current canonical set）

| ファイル | 反映内容 |
|---|---|
| `.claude/skills/aiworkflow-requirements/references/database-schema.md` | `sync_jobs` セクションに dual-canonical（`_design` + TS SSOT）リンク |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 03b-followup-005 を completed として登録、follow-up 候補を未タスク参照 |
| `.claude/skills/aiworkflow-requirements/references/lessons-learned-03b-followup-005-sync-jobs-design-spec-2026-05.md` | 5 苦戦箇所（dual-canonical drift / PII 二段 guard / lock TTL 不等式 / spec vs mutation 分離 / literal lint follow-up） |
| `.claude/skills/aiworkflow-requirements/indexes/{quick-reference,resource-map,topic-map,keywords}` | 本 inventory / lessons-learned / database-schema 更新箇所への参照を追加 |
| `.claude/skills/aiworkflow-requirements/changelog/20260503-03b-followup-005-sync-jobs-design-spec.md` | 同期記録 |

## Validation Chain

| 検証項目 | 結果 |
|---|---|
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS |
| `repository/__tests__/syncJobs.test.ts` | PASS |
| TS SSOT schema test | PASS |
| 不変条件 #1 / #4 / #5 trace（`outputs/phase-09/main.md`） | PASS |
| Phase 11 NON_VISUAL alternative evidence | PASS |
| Phase 13（ユーザー承認 / PR / Issue close） | DONE（Issue #198 CLOSED） |

## 確定値・列定義

- `SYNC_JOB_TYPES`: `{ RESPONSE_SYNC: 'response_sync', SCHEMA_SYNC: 'schema_sync' }`
- `SYNC_LOCK_TTL_MS`: `10 * 60 * 1000`（10 分 / 不等式: 実行時間 < TTL < cron 周期 15 分）
- `metrics_json`: 自由形式 JSON、ただし `assertNoPii` で `email` / `responseEmail` / 個人情報キーを禁止
- `job_type` enum: `'response_sync'` / `'schema_sync'`（TS SSOT 経由参照を強制）
- `state` enum: `'queued'` / `'running'` / `'succeeded'` / `'failed'`（既存）
- 物理 migration: 本タスクスコープ外（follow-up 委譲）
