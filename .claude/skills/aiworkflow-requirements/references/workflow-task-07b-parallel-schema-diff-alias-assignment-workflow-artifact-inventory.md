# 07b-parallel-schema-diff-alias-assignment-workflow Artifact Inventory

## メタ情報

| 項目 | 内容 |
|---|---|
| タスクID | 07b-parallel-schema-diff-alias-assignment-workflow |
| タスク種別 | implementation（apps/api workflow + service / NON_VISUAL） |
| ワークフロー | Phase 1-12 completed / Phase 13 pending（user approval 待ち） |
| canonical task root | `docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/` |
| wave | 07 admin schema wave（同 wave: 07a tag queue / 07c TBD） |
| 実装日 | 2026-04-30 |
| owner | apps/api（workflow / service / route handler / repository 拡張） |
| domain | schema diff resolution / alias assignment / response back-fill / audit log |
| visualEvidence | NON_VISUAL（UI route なし。`/admin/schema` 画面側は 06c で実装済み） |
| depends_on | 03a（forms-schema-sync が `schema_diff_queue.queued` を投入）/ 04c（endpoint 予約）/ 02b（schema_questions / schema_diff_queue / response_fields repository）/ 02c（audit_log repo）/ 06c（UI 連携） |
| follow-up wave | `UT-07B-schema-alias-hardening-001`（UNIQUE index migration / 10,000 行級実機計測 / retryable HTTP contract / cron 分割） / 08a（contract / authorization tests）/ 08b（E2E） |

## Acceptance Criteria

詳細は `outputs/phase-07/main.md`（AC-1〜AC-10）を正本とする。要点:

- AC-1 / AC-4: apply で `schema_questions.stable_key` を更新し、`schema_diff_queue.status='resolved'` 遷移、過去 response の `__extra__:<questionId>` 行を新 stableKey へ back-fill する（不変条件 #14）
- AC-2: `dryRun=true` は副作用なし。`affectedResponseFields` / `currentStableKeyCount` / `conflictExists` のみ返却（audit_log 追記なし）
- AC-3: 同一 `revision_id` 内の stableKey collision は pre-check で 422 を返す
- AC-5: back-fill は batch 100 / CPU budget 25s で Workers 30s 制限を逃げる
- AC-6: apply のみ `audit_log.action='schema_diff.alias_assigned'` を追記
- AC-7: `GET /admin/schema/diff` 応答に `recommendedStableKeys: string[]`（Levenshtein + section/index スコア上位 5 件）
- AC-8: 不変条件 #1 担保（コード string literal で固定 questionId なし、grep 0 件）
- AC-9: 削除済み member（`deleted_members` 紐付）の current response は back-fill 対象外
- AC-10: 認可境界は admin gate 通過後のみ。非 admin は 401 / 403

## Phase Outputs（current canonical set）

| Phase | 場所 | 主要成果物 |
|---|---|---|
| 1-10 | `outputs/phase-01/` 〜 `outputs/phase-10/` | 要件 / 設計 / 設計レビュー / テスト戦略 / 実装ランブック / 異常系 / AC マトリクス / DRY 化 / 品質保証 / 最終レビュー |
| 11 | `outputs/phase-11/` | NON_VISUAL manual smoke evidence（`ui_routes: []` のため API smoke + Vitest 証跡で成立） |
| 12 | `outputs/phase-12/` | `main.md` / `implementation-guide.md`（中学生レベル説明含む）/ `system-spec-update-summary.md` / `documentation-changelog.md` / `phase12-task-spec-compliance-check.md`（不変条件 #1〜#15 trace）/ `skill-feedback-report.md` / `unassigned-task-detection.md` / `elegant-verification.md`（4 条件 + 30 種思考法集約） |
| 13 | `outputs/phase-13/` | pending（user approval 待ち） |

## 主要実装物

### Workflow（apps/api）

| ファイル | 役割 |
|---|---|
| `apps/api/src/workflows/schemaAliasAssign.ts` | apply / dryRun / back-fill / audit を担当する workflow 本体（345 行）。`SchemaAliasAssignInput` / `SchemaAliasAssignResult` discriminated union / `SchemaAliasAssignFailure` / `BACKFILL_BATCH_SIZE=100` / `BACKFILL_CPU_BUDGET_MS=25000` を export |
| `apps/api/src/workflows/schemaAliasAssign.test.ts` | dryRun no-side-effect / apply happy path / collision 422 / diff_not_found 404 / question mismatch 409 / deleted member skip / batch resume / idempotent re-apply の単体テスト |

### Service（apps/api）

| ファイル | 役割 |
|---|---|
| `apps/api/src/services/aliasRecommendation.ts` | `(label, section, index, candidates) => string[]` の純粋関数。Levenshtein 距離 + section 一致 + index 近接スコアで上位 5 件を返す（74 行） |
| `apps/api/src/services/aliasRecommendation.test.ts` | スコア境界 / 同点 tie-break / 候補 0 件 / 空 label の単体テスト |

### Route handler（apps/api）

| ファイル | 役割 |
|---|---|
| `apps/api/src/routes/admin/schema.ts` | `GET /admin/schema/diff`（recommendedStableKeys 同梱）/ `POST /admin/schema/aliases?dryRun=<true\|false>` の handler。zod validation + workflow 呼び出し + HTTP error マッピング（400/401/403/404/409/422） |
| `apps/api/src/routes/admin/schema.test.ts` | route 層 integration テスト。admin gate / zod 400 / workflow failure → http status mapping を検証 |

### Repository 拡張（apps/api）

| ファイル | 役割 |
|---|---|
| `apps/api/src/repository/schemaQuestions.ts` | `findByQuestionId` / `findCollisionInRevision` / `updateStableKey` を 07b 向けに拡張（revision-scoped 検索を強化） |
| `apps/api/src/repository/schemaDiffQueue.ts` | `findById` / `markResolved` を 07b 向けに拡張（`status='queued'→'resolved'` 遷移 + question_id 一致検証 hook） |

## Skill 反映先（current canonical set）

| ファイル | 反映内容 |
|---|---|
| `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | §管理バックオフィス API 04c に「07b schema alias workflow close-out」段落を追加（recommendedStableKeys / dryRun 副作用なし契約 / collision 422 / back-fill batch+CPU budget） |
| `.claude/skills/aiworkflow-requirements/references/database-schema-07b-schema-alias-assignment.md` | 500 行制限に従い、`schema_questions` / `schema_diff_queue` / `response_fields` / `audit_log` の 07b 責務テーブル + 実 DB と仕様書の差分吸収（`__extra__:<questionId>` / `deleted_members` join）を子ファイルとして新設 |
| `.claude/skills/aiworkflow-requirements/references/database-schema.md` | 親導線として 07b 子ファイルへのリンクを追加 |
| `.claude/skills/aiworkflow-requirements/references/lessons-learned-07b-schema-alias-assignment-2026-04.md` | L-07B-001〜005（仕様書差分 grep 照合 / dryRun・apply 副作用境界分離 / revision-scoped pre-check 422 + UNIQUE index follow-up / batch+CPU budget+idempotent / aliasRecommendation 純粋関数化） |
| `.claude/skills/aiworkflow-requirements/references/lessons-learned.md` | hub に 07b エントリ追加 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 07b Phase 1-12 完了 / Phase 13 pending_user_approval / NON_VISUAL として登録 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | §UBM-Hyogo Schema Alias Assignment 早見（07b） |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 「Schema alias assignment workflow 実装（07b）」行 + completed-tasks 行を追加 |
| `.claude/skills/aiworkflow-requirements/SKILL.md` | changelog に v2026.04.30-07b-schema-alias-assignment エントリ追加 |
| `.claude/skills/task-specification-creator/SKILL.md` | changelog に v2026.04.30-07b-schema-alias-closeout-feedback エントリ追加（Phase 2/4/12 で migration/repository grep 必須化、dryRun/apply union template 化推奨） |

## 実装で確定した値

- `BACKFILL_BATCH_SIZE = 100`（D1 SELECT/UPDATE 1 batch 行数）
- `BACKFILL_CPU_BUDGET_MS = 25000`（Workers 30s 制限の安全マージン 5s）
- HTTP error マッピング: zod 400 / 認証なし 401 / 非 admin 403 / question_not_found・diff_not_found 404 / diff_question_mismatch 409 / collision 422
- extra field 識別: `response_fields.stable_key='__extra__:<questionId>'` LIKE
- 削除 skip: `member_identities ⋈ deleted_members` を経由し `response_id NOT IN (...)`
- `schema_diff_queue.status` enum: `queued | resolved` を採用（`reviewing` 等の中間状態は持たない）
- audit action: `schema_diff.alias_assigned`（apply mode のみ）

## Follow-up 未タスク（formalize 済み）

| 未タスク ID | ファイル | 概要 |
|---|---|---|
| UT-07B-schema-alias-hardening-001 | `docs/30-workflows/unassigned-task/UT-07B-schema-alias-hardening-001.md` | `schema_questions(revision_id, stable_key)` 物理 UNIQUE index migration / 10,000 行級 back-fill 実機計測 / `backfill_cpu_budget_exhausted` retryable HTTP contract / apply ↔ back-fill cron 分割 |

## Validation Chain

- `mise exec -- pnpm --filter @ubm-hyogo/api typecheck`
- `mise exec -- pnpm --filter @ubm-hyogo/api lint`
- `mise exec -- pnpm --filter @ubm-hyogo/api test -- --run src/workflows/schemaAliasAssign.test.ts src/services/aliasRecommendation.test.ts src/routes/admin/schema.test.ts`
- root / outputs `artifacts.json` parity（`docs/30-workflows/07b-.../artifacts.json` ↔ `outputs/artifacts.json`）
- `phase12-task-spec-compliance-check.md` 不変条件 #1〜#15 全項目 trace
