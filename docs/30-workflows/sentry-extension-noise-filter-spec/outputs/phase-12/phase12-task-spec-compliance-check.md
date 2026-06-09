# Phase 12 タスク仕様コンプライアンスチェック

- workflow root: `docs/30-workflows/sentry-extension-noise-filter-spec`
- taskId: `TASK-SENTRY-EXTENSION-NOISE-FILTER-001`
- 実装区分: implementation / NON_VISUAL
- workflow_state: `implemented_local_evidence_captured`

## Summary verdict

PASS。Phase 1-13、strict Phase 12成果物7点、実コード、focused tests、typecheck、lint、aiworkflow同一wave同期が揃っている。commit / push / PRのみuser-gated。

## Changed-files classification

| 分類 | パス | 種別 |
|------|------|------|
| implementation | `apps/web/src/lib/sentry/extension-noise-filter.ts` | 新規 |
| implementation | `apps/web/src/instrumentation-client.ts` | 編集 |
| implementation | `apps/web/src/lib/sentry/index.ts` | 編集 |
| tests | `apps/web/src/lib/sentry/extension-noise-filter.spec.ts` | 新規 |
| tests | `apps/web/src/__tests__/instrumentation-client.runtime.spec.ts` | 編集 |
| workflow docs | `docs/30-workflows/sentry-extension-noise-filter-spec/**` | 新規/更新 |
| aiworkflow sync | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 編集 |
| aiworkflow sync | `.claude/skills/aiworkflow-requirements/references/workflow-sentry-extension-noise-filter-spec-artifact-inventory.md` | 新規 |
| aiworkflow sync | `.claude/skills/aiworkflow-requirements/indexes/{quick-reference,resource-map}.md` | 編集 |
| aiworkflow sync | `.claude/skills/aiworkflow-requirements/changelog/20260607-sentry-extension-noise-filter-spec.md` | 新規 |

## `workflow_state` and phase status consistency

- `artifacts.json` と `outputs/artifacts.json` の `status` = `implemented_local_evidence_captured`。
- Phase 11 = completed。focused vitest / typecheck / lintのPASS証跡を記録済み。
- Phase 13 = pending_user_approval。commit / push / PRは未実行。
- Gate-A / Gate-B = passed、Gate-C = pending。

## Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| manual test result | `outputs/phase-11/manual-test-result.md` | present |

Focused vitest / typecheck / lint のPASS結果は `outputs/phase-11/manual-test-result.md` に集約記録済み。

## Phase 12 strict 7 file inventory

| ファイル | 状態 |
| --- | --- |
| `outputs/phase-12/main.md` | present |
| `outputs/phase-12/implementation-guide.md` | present |
| `outputs/phase-12/system-spec-update-summary.md` | present |
| `outputs/phase-12/documentation-changelog.md` | present |
| `outputs/phase-12/unassigned-task-detection.md` | present |
| `outputs/phase-12/skill-feedback-report.md` | present |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | present |

## Skill/reference/system spec same-wave sync

- aiworkflow task ledger / artifact inventory / discovery indexes / changelogを同一waveで更新。
- global system specのAPI/D1/Form/Auth公開契約変更はN/A。
- skill feedbackは固定3観点とpromotion/no-op routingを記録。

## Runtime or user-gated boundary

- local implementation / focused vitest / typecheck / lint は完了。
- 外部Sentry dashboard実受信確認、commit、push、PRはuser-gated。
- 到達不能console noiseはコードで除去不能。

## Archive/delete stale-reference gate

既存ファイルの削除・アーカイブ・改名はなし。新規workflow rootとaiworkflow ledger同期のみ。

## Four-condition verdict

| 条件 | 判定 | 根拠 |
|------|------|------|
| 矛盾なし | PASS | spec-only表記を実装済みに再分類し、Phase 11/12/13境界を統一 |
| 漏れなし | PASS | pure module / wiring / tests / strict 7 / aiworkflow syncを反映 |
| 整合性あり | PASS | `*.spec.ts`、client SDK-only、fail-open、NON_VISUAL証跡が一致 |
| 依存関係整合 | PASS | `apps/web` client instrumentationのみ変更。API/D1/UIには依存を広げない |
