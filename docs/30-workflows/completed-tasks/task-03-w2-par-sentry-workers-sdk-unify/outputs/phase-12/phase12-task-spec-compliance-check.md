# Phase 12 Task Spec Compliance Check

## Verdict

PASS for `implemented-local` close-out.

## Checklist

| Check | Status |
| --- | --- |
| `index.md` / `artifacts.json` exist | PASS |
| `outputs/artifacts.json` exists | PASS |
| phase-01.md〜phase-13.md exist | PASS |
| Phase 11 outputs exist | PASS |
| Phase 12 strict 7 files exist | PASS |
| Phase 13 reserved outputs exist | PASS |
| `workflow_state=implemented-local` synced with apps/web code diff | PASS |
| `taskType=implementation`, `visualEvidence=NON_VISUAL`, `docs_only=false` | PASS |
| Phase 11 state uses `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` and avoids staging runtime PASS wording | PASS |
| aiworkflow-requirements indexes registered | PASS |
| `getEnv()` route implemented for Sentry server env | PASS |
| client runtime init test exists | PASS |
| OpenNext build grep gate is locally verified | PASS |

## 4 Conditions

| Condition | Verdict |
| --- | --- |
| 矛盾なし | PASS |
| 漏れなし | PASS |
| 整合性あり | PASS |
| 依存関係整合 | PASS |

## DoD #4 trace — unassigned-task 4件以上検出

DoD #4 は「unassigned-task が4件以上検出される」を要求し、`配置` ではなく `検出` を求める。`outputs/phase-12/unassigned-task-detection.md` の Reviewed Candidates 表に 4 候補を列挙し、各候補について `Decision = no new task` と `Reason (out-of-scope / covered by 既存ワークフロー)` を明示している。

| # | Candidate | Decision | Coverage Reference |
| --- | --- | --- | --- |
| 1 | apps/api Sentry introduction | no new task | 既存 observability / API smoke 系ワークフロー（`docs/30-workflows/issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension/`）が apps/api 側 Sentry スコープを別途保持 |
| 2 | Sentry release tag automation | no new task | `docs/30-workflows/issue-348-09c-github-release-tag-automation/` が release tag 系列を保持。本 web runtime split の対象外 |
| 3 | Performance monitoring tuning | no new task | `SENTRY_TRACES_SAMPLE_RATE` を env contract に含めた上で、tuning は後続 observability wave へ委譲（既存 `references/observability-monitoring.md` 範囲） |
| 4 | D1 / KV breadcrumbs | no new task | PII / SQL マスキング設計は本 web SDK split の意図的除外。breadcrumb 設計は data-access 系 boundary task 群（`references/data-access-boundary` 関連）が保持 |

判定: 4件以上検出済み・全件 no-op 判定の根拠リンクあり → DoD #4 PASS。

## Lessons-learned 反映

- `references/lessons-learned-task-03-w2-par-sentry-workers-sdk-unify-2026-05.md`: L-T03-001 (server/browser SDK 分離), L-T03-002 (DSN 二系統), L-T03-003 (PASS_BOUNDARY_SYNCED_RUNTIME_PENDING), L-T03-004 (capture fail-soft), L-T03-005 (DoD#4 trace 規約)。
