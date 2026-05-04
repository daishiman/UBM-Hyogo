# Artifact Inventory — task-389-privacy-terms-pages-impl

## canonical root

`docs/30-workflows/completed-tasks/task-389-privacy-terms-pages-impl/`

## workflow state

| field | value |
| --- | --- |
| workflow_state | `implemented-local / web build blocked by #385 / Phase 13 blocked_until_user_approval` |
| taskType | `implementation` |
| docs scope | `false` |
| visual evidence | `VISUAL_ON_EXECUTION`（staging / production HTTP 200 と OAuth consent screenshot は web build green + user approval 後） |
| issue | `#389` (CLOSED) — PR text uses `Refs #389` |

## root artifacts

| artifact | status |
| --- | --- |
| `index.md` | present |
| `artifacts.json` | present |
| `phase-01.md` ... `phase-13.md` | present |

## phase 12 required artifacts (strict 7)

| artifact | status |
| --- | --- |
| `outputs/phase-12/main.md` | present |
| `outputs/phase-12/implementation-guide.md` | present |
| `outputs/phase-12/system-spec-update-summary.md` | present |
| `outputs/phase-12/documentation-changelog.md` | present |
| `outputs/phase-12/unassigned-task-detection.md` | present (0 件、既存 `task-05a-privacy-terms-pages-001.md` を consume) |
| `outputs/phase-12/skill-feedback-report.md` | present |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | present |

## phase 11 evidence

| evidence | status |
| --- | --- |
| `outputs/phase-11/legal-review-note.md` | present |
| `outputs/phase-11/manual-smoke-log.md` | present |
| `outputs/phase-11/screenshots/` | placeholder（staging / production deploy + OAuth consent screen は user approval 後に取得） |

## implementation source-of-truth

| layer | path |
| --- | --- |
| Privacy Server Component + metadata | `apps/web/app/privacy/page.tsx` |
| Terms Server Component + metadata | `apps/web/app/terms/page.tsx` |
| Privacy semantic render test | `apps/web/app/privacy/__tests__/page.test.tsx` |
| Terms semantic render test | `apps/web/app/terms/__tests__/page.test.tsx` |
| OAuth checklist 反映先 | `.claude/skills/aiworkflow-requirements/references/auth-google-oauth-cf-integration.md` |
| 連絡先 SSOT (Google Form) | `CLAUDE.md` フォーム固定値 `responderUrl` |

## skill reflection (same-wave)

| target | change |
| --- | --- |
| `references/auth-google-oauth-cf-integration.md` | privacy / terms 実装ワークフロー参照とチェックリスト更新 |
| `references/task-workflow-active.md` | task-389 row 追加 |
| `references/lessons-learned-05a-authjs-admin-gate-2026-04.md` | L-05A-010 の解決策を task-389 完了内容で更新 |
| `references/lessons-learned-389-privacy-terms-oauth-readiness-2026-05.md` | L-389-001〜004 + OP-389-1/2 新規 |
| `indexes/quick-reference.md` | Google OAuth Privacy/Terms 早見セクション追加 |
| `indexes/resource-map.md` | task-389 row 追加 |
| `LOGS/_legacy.md` | 2026-05-03 task-389 reflection エントリ追加 |

## scope notes

- 法務本文は暫定版。最終文言確定 PR は legal review 完了後に別 wave で当てる前提（external blocker、本タスクからは scope out）。
- Cookie banner / consent management UI は本タスクから scope out。将来要件として `outputs/phase-12/unassigned-task-detection.md` の根拠に記録済み。
- staging / production HTTP 200 と Google OAuth consent screen screenshot は web build green + user approval 後の VISUAL_ON_EXECUTION evidence として委譲。Phase 11 placeholder で PASS 主張しない。
- production base URL は metadata canonical の SSOT。staging / production で drift しないように環境変数経由で参照する。
- formId rotation 時は CLAUDE.md `responderUrl` / privacy page contact / terms page contact の 3 箇所を同 wave で更新する。

## related tasks

- input (consumed): `docs/30-workflows/completed-tasks/task-05a-privacy-terms-pages-001.md`（unassigned から移動済み）
- external blocker: Issue #385 web build prerender regression（CLOSED だが再発、deploy 前に解消必須）
- downstream (Phase 13 user-gated): staging deploy → production deploy → OAuth consent screen に URL 登録 → screenshot evidence 取得
