# Documentation Changelog

本 wave (2026-05-18) で更新したドキュメント・実装の Step 別完了結果。

## Step 1-A: aiworkflow-requirements skill 同期 wave

| Path | Change |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/SKILL.md` | `v2026.05.18-issue-256-e2e-coverage-baseline-runbook` エントリ追加 |
| `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` | 同 version の changelog 行を追記 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | current canonical set に artifact-inventory を登録 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | issue-256 専用導線セクション追加 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | references エントリ追加 |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | coverage-exclude-ratio / playwright-smoke-19-route-sla 等のキーワード追加 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow entry 追加 |
| `.claude/skills/aiworkflow-requirements/references/workflow-issue-256-e2e-coverage-baseline-runbook-artifact-inventory.md` | issue-295 parity の artifact inventory を新設（Canonical Paths / Classification / Runtime Boundary / Consumed Trace / Lessons Learned） |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | 2026-05-18 ログ追記 |

完了結果: 同一 wave 7 同期ターゲット全充足。classification-first / single-responsibility / 500行以内を維持。

## Step 1-B: ワークフロー本体・runbook・script 実装

| Path | Change |
| --- | --- |
| `docs/30-workflows/completed-tasks/issue-256-e2e-coverage-baseline-runbook/` | spec-created skeleton から implemented local evidence captured へ昇格、completed-tasks 配下へ正本移動 |
| `docs/30-workflows/runbooks/e2e-coverage-fallback-metric.md` | ratio warn 時の fallback 指標 runbook を新設 |
| `docs/30-workflows/runbooks/playwright-smoke-19-route-sla.md` | smoke SLA runbook + 17-entry route inventory 新設 |
| `scripts/measure-coverage-exclude-ratio.ts` | test spec を分母から除外した production-like source ratio を測定 |
| `scripts/__tests__/measure-coverage-exclude-ratio.spec.ts` | parser / ratio / empty target / markdown の unit test |
| `.github/workflows/verify-coverage-exclude-ratio.yml` | PR 時 ratio 測定 + 30% 重複抑止コメント |
| `vitest.config.ts` | coverage topology を現行 `apps/web/app` layout に同期（旧 `apps/web/src/app` drift 補正） |
| `package.json` | `pnpm coverage:exclude-ratio` script 追加 |

完了結果: 全 implementation target が `implemented_local_evidence_captured` state で揃い、Phase 9 QA / Phase 10 final-review いずれもストレートスルー。

## Step 1-C: 未タスク登録 / partial-fix トレース

| Path | Change |
| --- | --- |
| `docs/30-workflows/unassigned-task/task-e2e-playwright-coverage-001.md` | partial-consumed backlink 追加、`Refs #256` policy で closed Issue 参照のみ |
| `docs/30-workflows/completed-tasks/issue-256-e2e-coverage-baseline-runbook/outputs/phase-9/qa-result.md` | 欠落していた Phase 9 QA evidence を追加 |

完了結果: 未タスクは partial_fix 扱いで一次保管、`Closes/Fixes/Resolves #256` 不使用ポリシーを遵守。

## Step 2: skill cascading

| 状態 | 詳細 |
| --- | --- |
| N/A 判定 | 内部 script の test 用 export のみで、外部公開 API / IPC contract / 認証境界の変更なし。Phase 12 Step 2 cascading は不要と判断（`skill-feedback-report.md` 参照）。 |
| 任意 cascading | `task-specification-creator/SKILL.md` Trigger に `coverage exclude ratio gate` / `e2e coverage fallback metric` / `playwright smoke route SLA` / `runbook SLA baseline` を追記。 |

## Reference 整合

- 本 changelog 内で参照する workflow root path は `docs/30-workflows/completed-tasks/issue-256-e2e-coverage-baseline-runbook/`（completed-tasks 配下へ移動済み）に統一。
- artifacts.json は workflow root と `outputs/` 配下の二重存在で、state vocabulary `implemented_local_evidence_captured` を一貫使用。
