# issue-1101-attendance-analytics-calc-correction artifact inventory

## Summary

| Item | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1101-attendance-analytics-calc-correction/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL / staging_visual_pending_user_gate` |
| source | GitHub issue #1101（CLOSED 維持） |
| parent | `docs/30-workflows/admin-attendance-dashboard-ux/` |
| purpose | 出席分析の計算意味論を修正し、100 回以上の正常値を `unknown` ではなく `zone_100_plus` として扱い、延べ率と unique 出席率を分離する |

## Implementation Targets

| Area | Files |
| --- | --- |
| apps/api repository | `apps/api/src/repository/attendance-analytics.ts` |
| apps/api parser | `apps/api/src/lib/parse-attendance-filter.ts` |
| packages/shared schema | `packages/shared/src/zod/admin-attendance.ts` |
| apps/web attendance UI | `apps/web/src/features/admin/attendance/lib/{format-attendance,read-attendance-filter}.ts`, `apps/web/src/features/admin/attendance/components/KpiPanel.tsx` |
| apps/web fixture | `apps/web/playwright/fixtures/auth.ts` |
| system spec | `docs/00-getting-started-manual/specs/01-api-schema.md` |
| workflow docs | `docs/30-workflows/completed-tasks/issue-1101-attendance-analytics-calc-correction/**` |

## Contract

- `AttendanceZoneZ` keys are `zone_0`, `zone_1_9`, `zone_10_99`, `zone_100_plus`, `unknown`.
- Legacy arrow query values `0→1`, `1→10`, `10→100` are accepted only as input compatibility and normalized to new keys.
- `unknown` is classification failure only; `attendedCount >= 100` is `zone_100_plus`.
- `AttendanceOverviewExt` includes additive `uniqueAttendeeCount` and `uniqueAttendanceRate`.
- `overallRate` remains gross attendance rate: `attendCount / (totalSessions * totalMembers)`.

## Evidence

| Evidence | Result |
| --- | --- |
| focused Vitest root | 6 files / 21 tests PASS |
| focused Vitest D1 repository | 1 file / 13 tests PASS |
| route/migration invariant | `git diff --name-only -- apps/api/migrations apps/api/src/routes` empty |
| staging visual | pending user gate |
| commit / push / PR | pending user gate |

## Invariants

- D1 migration unchanged.
- Admin attendance endpoint path and HTTP method unchanged.
- Google Form schema unchanged.
- UBM business growth zone domain (`byZone.ts`, public filters) unchanged despite sharing the same visual labels.

## Skill Feedback

- task-specification-creator SF-1 promoted: grep gates must be scoped by type/import/schema ownership when the same visual labels appear in unrelated domains.

## Lessons Learned

| # | Lesson | How to apply |
| --- | --- | --- |
| L-I1101-001 | SF-1: 同一視覚ラベル（`0→1` / `1→10` / `10→100`）が無関係な 2 ドメイン（出席回数帯 `AttendanceZone` と UBM 事業成長フェーズ `byZone.ts` / `AboutUbm.tsx`）に登場するため、素朴な `rg '0→1'` grep gate が別ドメインのヒットを「触っていないのに残存違反」と誤検出する。 | grep gate のスコープを型 import 境界で限定する（`AttendanceZone` を import する `apps/api/src/repository` / `apps/web/src/features/admin/attendance` / `packages/shared` に限定し、別ドメインのパスを明示除外）。`task-specification-creator/references/patterns-validation-and-audit.md`（パターン10）/ `patterns-lessons-and-pitfalls.md`（SP-I1101-001/002）へ昇格済み。 |
| L-I1101-002 | SF-2: SQL の SELECT へ集計サブクエリを additive 追加すると period 等の bind セット数が増える（本タスクでは 2 → 3 セット）。bind 順序を SELECT 出現順に一致させないと「件数が他指標の値にすり替わる」サイレントバグになり、型チェックでは検出できない。 | additive な集計 field を含む実装ガイドでは bind 順序整合を必須 key section にする。`outputs/phase-12/implementation-guide.md` Part 2「bind 順序の最大の注意点」で SELECT 出現順（totalSessions → attendCount → uniqueAttendeeCount）への厳密一致を独立記載（個別ガイド対応・skill 昇格は no-op）。 |
| L-I1101-003 | SF-3: `visualEvidence=VISUAL` でも、変更が label 文言 / KPI タイル等の文字列・値レベルに限定されレイアウト/CSS 変更を伴わない場合、視覚回帰より component test（jsdom）が変更の正しさをより直接的に立証する。 | Phase 11 `manual-test-result.md` に証跡メタ表（primary/secondary source）と「VISUAL だが component test を主証跡とする理由」を明記する。既存テンプレートで表現可能のため新規 asset 追加は不要（skill 昇格 no-op）。 |
| L-I1101-004 | この同期 wave は close-out（completed-tasks 移動）ではない。workflow_state は `implemented_local_evidence_captured` で Phase 13（commit/push/PR/staging visual）は user-gated のため、workflow root は active 位置に留める。 | spec 反映/skill 同期セッションでは dir を completed-tasks へ移動しない。skill 参照・内部 phase docs・artifacts は active パス（`docs/30-workflows/completed-tasks/issue-1101-attendance-analytics-calc-correction/`）を正本とする。close-out は未タスク0判定を伴う別セッションで行う。 |
