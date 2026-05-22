# 2026-05-15 07c follow-up 002 attendance visual smoke

## Summary

`docs/30-workflows/07c-followup-002-attendance-visual-smoke/`（Issue #313 / `Refs #313`、issue CLOSED）を `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION / local_visual_evidence_pass` として同期した。`apps/web` Playwright spec の `TODO(08b)` 残置を解消し、`/admin/meetings` および `/admin/meetings/[id]` の attendance UI に対し focused 4 test と Phase 11 evidence（6 screenshots + trace zip + run/list/skip-count txt + metadata.json）を local-mock provenance で揃えた。

## Implementation

- `apps/web/playwright/tests/attendance.spec.ts` で `TODO(08b)` 解消、duplicate / already-registered / deleted-excluded / delete-before-after の focused 4 test を un-skipped 状態に書き直し。
- `apps/web/playwright/fixtures/admin-meetings.ts` を新規追加し、attendance scenario seed builder を独立 fixture として分離（INV-08 single source of truth）。
- `apps/web/playwright/fixtures/auth.ts` の standalone mock に `/admin/meetings/:id` detail endpoint を追加し、Server Component fetch を捕捉できるように補正。
- `apps/web/playwright/page-objects/AdminMeetingsPage.ts` を list / detail で別 helper に再構成（selector は detail page 専用と判明）。
- `apps/web/src/components/admin/MeetingPanel.tsx` の list selector exposure を補正。
- `apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx` の `/attendances` mutation body を contract に整合。
- `apps/api/src/routes/admin/meetings.ts` に `GET /admin/meetings/:id` detail route と attendance alias contract を追加（既存 API surface 維持、INV-01）。
- `apps/api/src/routes/admin/meetings.contract.spec.ts` に detail / attendance alias の contract spec を追加。
- `apps/web/playwright.config.ts` の evidence directory を `PLAYWRIGHT_EVIDENCE_TASK=07c-followup-002` 分岐で本 workflow に対応付け。
- `.github/workflows/playwright-smoke.yml` に focused attendance visual smoke step を追加。

## Skill same-wave sync

- `.claude/skills/aiworkflow-requirements/references/workflow-07c-followup-002-attendance-visual-smoke-artifact-inventory.md` 新規。
- `references/api-endpoints.md` / `references/task-workflow-active.md` / `indexes/resource-map.md` / `indexes/quick-reference.md` / `SKILL-changelog.md` の 5 file を同一 wave で反映。
- `lessons-learned/lessons-learned-07c-followup-002-attendance-visual-smoke-2026-05.md`（L-07C-FU002-001..005）を追加。

## Boundary

Phase 11 evidence は `provenance: local-mock` を `phase11-capture-metadata.json` に明記。GitHub Actions `playwright-smoke` runtime evidence、staging fresh replacement、baseline snapshot 更新（`--update-snapshots`）、commit、push、PR は user-gated。INV-01〜INV-10（workflow index.md）を Phase 12 で 9-heading compliance check により全項目 verdict 取得済み。
