# Artifact Inventory: task-05a-form-preview-503-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task | task-05a-form-preview-503-001 |
| date | 2026-05-05 |
| classification | implemented-local-runtime-evidence-blocked / implementation / NON_VISUAL |
| issue | GitHub Issue #388（CLOSED 維持、`Refs #388`） |
| 親仕様 | `docs/30-workflows/unassigned-task/task-05a-form-preview-503-001.md`（昇格メモあり / 再拾い禁止） |
| 上流 | `ut-05a-followup-google-oauth-completion` Phase 11 Stage B-1 `P11-PRD-005` |

## workflow artifacts（Phase 12 strict 7 files + Phase 11 NON_VISUAL）

| artifact | 役割 |
| --- | --- |
| `docs/30-workflows/task-05a-form-preview-503-001/index.md` | root workflow spec |
| `docs/30-workflows/task-05a-form-preview-503-001/artifacts.json` | Phase / outputs ledger（root-only canonical） |
| `docs/30-workflows/task-05a-form-preview-503-001/phase-01.md`〜`phase-13.md` | 13 Phase 仕様書 |
| `docs/30-workflows/task-05a-form-preview-503-001/outputs/phase-11/main.md` | NON_VISUAL Phase 11 index |
| `docs/30-workflows/task-05a-form-preview-503-001/outputs/phase-11/manual-smoke-log.md` | curl / vitest runtime evidence contract |
| `docs/30-workflows/task-05a-form-preview-503-001/outputs/phase-11/link-checklist.md` | workflow / implementation / aiworkflow links |
| `docs/30-workflows/task-05a-form-preview-503-001/outputs/phase-11/manual-test-result.md` | manual smoke の確定結果テンプレ（runtime gate 後に更新） |
| `docs/30-workflows/task-05a-form-preview-503-001/outputs/phase-12/main.md` | Phase 12 strict 7 files index |
| `docs/30-workflows/task-05a-form-preview-503-001/outputs/phase-12/implementation-guide.md` | root cause / runbook / Part 1+2 guide |
| `docs/30-workflows/task-05a-form-preview-503-001/outputs/phase-12/phase12-task-spec-compliance-check.md` | root compliance evidence |
| `docs/30-workflows/task-05a-form-preview-503-001/outputs/verification-report.md` | task output verification report |

## implementation references（apps/api 側 current contract）

| file | contract / 役割 |
| --- | --- |
| `apps/api/src/use-cases/public/get-form-preview.ts` | `getLatestVersion()` null → `logWarn({ code:"UBM-5500", context:{ where:"getFormPreviewUseCase", formId, usedFallback } })` を 1 回だけ emit してから `ApiError({ code:"UBM-5500" })` を throw する |
| `apps/api/src/routes/public/index.test.ts` | route 層のテスト。`createPublicD1Mock({ latestVersion:null })` で 503 + `Cache-Control` が `public, max-age=60` に**ならない**ことを検査 |
| `apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts` | use-case 単体テスト。TC-RED-01 / RED-02-A / RED-02-B / RED-03 / FAIL-01 / FAIL-02 / COV-01 を網羅し、`logWarn` mock で structured payload を assert |
| `apps/api/src/use-cases/public/__tests__/helpers/public-d1.ts` | mock helper。`bindLog?: Array<{ sql; bindings }>` を追加し、`schema_versions` 検索の bind 値（`GOOGLE_FORM_ID` / `FORM_ID` / FALLBACK 優先順位）を後段で assert できるようにした |
| `apps/api/src/repository/schemaVersions.ts` | `schema_versions(form_id, revision_id, schema_hash, state, synced_at, source_url, field_count, unknown_field_count)` の `state='active'` 最新行 lookup |
| `apps/api/src/repository/schemaQuestions.ts` | `schema_questions` を `revision_id` で取得 |
| `apps/api/migrations/0001_init.sql` | `schema_versions` / `schema_questions` の current DDL |
| `packages/shared/src/errors.ts` | `UBM-5500` → HTTP 503 mapping |
| `packages/shared/src/logging.ts` | `logWarn({ code, message, context })` structured logger |

## changed files in this branch（diff vs HEAD）

| path | 内容 |
| --- | --- |
| `apps/api/src/use-cases/public/get-form-preview.ts` | manifest null 経路に `logWarn` 1 行追加（throw 前に emit） |
| `apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts` | TC-RED-01 / RED-02-A / RED-02-B / FAIL-01 / FAIL-02 / COV-01 を追加 |
| `apps/api/src/routes/public/index.test.ts` | TC-RED-03 (route 層 503 mapping + Cache-Control regression) を追加 |
| `apps/api/src/use-cases/public/__tests__/helpers/public-d1.ts` | `bindLog` opt-in 経路を追加（既存呼び出しに非破壊） |

## skill artifacts

| path | 役割 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/workflow-task-05a-form-preview-503-001-artifact-inventory.md` | 本ファイル（成果物台帳） |
| `.claude/skills/aiworkflow-requirements/references/lessons-learned-05a-form-preview-503-2026-05.md` | 苦戦箇所＋知見（L-05A-FP503-001〜008） |
| `.claude/skills/aiworkflow-requirements/changelog/20260505-task-05a-form-preview-503.md` | 同期ログ |
| `.claude/skills/aiworkflow-requirements/indexes/{resource-map,quick-reference,topic-map,keywords.json}` | classification-first index 同期 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active task として登録 |
| `.claude/skills/aiworkflow-requirements/references/lessons-learned.md` | 子 lessons-learned へのリンク登録 |

## runtime boundary

- 2026-05-05 review curl: staging `GET /public/form-preview` 503 / production 503。
- D1 write / staging seed / production verification / commit / push / PR は user approval gate 後でなければ実行しない（Phase 13 blocked_until_user_approval）。
- 503 root cause は `schema_versions` 行欠落の可能性が高いが、staging / production の D1 export 突合は user 承認後に実施する。`logWarn` の `usedFallback=true` payload が tail に出れば env fallback 経路を通っている確証になる。
- placeholder evidence（curl PASS テンプレ等）は PASS と扱わない。
