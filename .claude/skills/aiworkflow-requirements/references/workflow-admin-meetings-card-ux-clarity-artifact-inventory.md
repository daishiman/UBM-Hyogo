# workflow-admin-meetings-card-ux-clarity artifact inventory

| key | value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-meetings-card-ux-clarity/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION / staging_visual_pending_user_gate` |
| purpose | `/admin/meetings` の開催日カード、展開編集、出席者一覧を視覚階層が分かる構造へ改善する |
| implementation targets | `apps/web/src/styles/globals.css`, `apps/web/src/features/admin/components/_meetings/MeetingAttendanceDrawer.tsx`, `MeetingTimeline.tsx`, focused `_meetings` specs |
| invariant | apps/api / D1 / Google Form / endpoint surface unchanged。既存 `data-testid` / aria / role / useAdminMutation / FormField contract preserved |
| evidence | focused Vitest 4 files / 18 tests PASS; local Playwright visual 1 test PASS / 5 PNG present; `pnpm typecheck` PASS; `pnpm lint` PASS; `pnpm verify:tokens` PASS; HEX grep 0; `git diff -- apps/api` empty |
| local evidence | `docs/30-workflows/completed-tasks/admin-meetings-card-ux-clarity/outputs/phase-11/evidence/local-validation-summary.txt` |
| local screenshots | `docs/30-workflows/completed-tasks/admin-meetings-card-ux-clarity/outputs/phase-11/screenshots/` |
| user gate | authenticated staging screenshots, staging deploy, commit, push, PR |

## Lessons

- L-AMCUX-001: VISUAL UI task で implementation target が明確な場合、`spec_created` のまま閉じず同一サイクルで実コード・focused tests・Phase 12 state を `implemented_local_evidence_captured` へ昇格する。
- L-AMCUX-002: design token drift を避けるため、未定義 token 参照の補正は新規 token 追加より既存正本 token への収束を第一候補にする。
- L-AMCUX-003: wrapper 追加で `data-testid` 行が diff 上移動する場合、単純な削除 grep ではなく削除ID集合が追加後にも存在することと focused tests で contract を確認する。
