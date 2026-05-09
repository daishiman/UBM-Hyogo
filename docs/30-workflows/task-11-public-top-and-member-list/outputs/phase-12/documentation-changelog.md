# documentation changelog

## Entry checklist (apps/ packages/ dirty diff)

`git status --porcelain apps/ packages/` の生出力（Phase 12 着手時に転記）:

```
 M apps/web/app/(public)/layout.tsx
D  apps/web/app/(public)/members/_components/MemberList.tsx
D  apps/web/app/(public)/members/_components/MembersFilterBar.client.tsx
 M apps/web/app/(public)/members/page.tsx
 M apps/web/app/page.tsx
 M apps/web/playwright.config.ts
 M apps/web/src/components/public/Hero.tsx
D  apps/web/src/components/public/StatCard.tsx
 M apps/web/src/components/public/Timeline.tsx
D  apps/web/src/components/public/__tests__/StatCard.test.tsx
 M apps/web/src/components/public/__tests__/Timeline.test.tsx
?? apps/web/playwright/tests/public-top-and-list.spec.ts
?? apps/web/src/components/public/DensityToggle.client.tsx
?? apps/web/src/components/public/MemberFilters.client.tsx
?? apps/web/src/components/public/MemberGrid.tsx
?? apps/web/src/components/public/MemberTable.tsx
?? apps/web/src/components/public/PublicFooter.tsx
?? apps/web/src/components/public/PublicHeader.tsx
?? apps/web/src/components/public/Stats.tsx
?? apps/web/src/components/public/ZoneIntro.tsx
?? apps/web/src/components/public/__tests__/Stats.test.tsx
?? apps/web/src/lib/api/__tests__/public.test.ts
?? apps/web/src/lib/api/public.ts
```

判定: 上記 dirty diff は task-11 本体の実装差分として再分類（`implemented-local` 状態語彙の根拠）。task 外の隣接 diff は 0 件。

## 必須エントリ最小セット（7カテゴリ）

| カテゴリ | path（個別 1 行ずつ） |
| --- | --- |
| components-public（M / 新規） | `apps/web/src/components/public/Hero.tsx` (M) |
| components-public（M / 新規） | `apps/web/src/components/public/Timeline.tsx` (M) |
| components-public（M / 新規） | `apps/web/src/components/public/DensityToggle.client.tsx` (??) |
| components-public（M / 新規） | `apps/web/src/components/public/MemberFilters.client.tsx` (??) |
| components-public（M / 新規） | `apps/web/src/components/public/MemberGrid.tsx` (??) |
| components-public（M / 新規） | `apps/web/src/components/public/MemberTable.tsx` (??) |
| components-public（M / 新規） | `apps/web/src/components/public/PublicFooter.tsx` (??) |
| components-public（M / 新規） | `apps/web/src/components/public/PublicHeader.tsx` (??) |
| components-public（M / 新規） | `apps/web/src/components/public/Stats.tsx` (??) |
| components-public（M / 新規） | `apps/web/src/components/public/ZoneIntro.tsx` (??) |
| components-public（削除） | `apps/web/src/components/public/StatCard.tsx` (D) |
| components-public-tests（M / 新規） | `apps/web/src/components/public/__tests__/Timeline.test.tsx` (M) |
| components-public-tests（M / 新規） | `apps/web/src/components/public/__tests__/Stats.test.tsx` (??) |
| components-public-tests（削除） | `apps/web/src/components/public/__tests__/StatCard.test.tsx` (D) |
| app-route | `apps/web/app/(public)/layout.tsx` (M) |
| app-route | `apps/web/app/(public)/members/page.tsx` (M) |
| app-route | `apps/web/app/page.tsx` (M) |
| app-route-deleted | `apps/web/app/(public)/members/_components/MemberList.tsx` (D) |
| app-route-deleted | `apps/web/app/(public)/members/_components/MembersFilterBar.client.tsx` (D) |
| api-adapter | `apps/web/src/lib/api/public.ts` (??) |
| api-adapter-tests | `apps/web/src/lib/api/__tests__/public.test.ts` (??) |
| playwright-config | `apps/web/playwright.config.ts` (M) |
| playwright-config | `apps/web/playwright/tests/public-top-and-list.spec.ts` (??) |

## 削除ファイル明記（D entries）

以下 4 ファイルは task-11 で旧入口を閉じる責務移管として削除:

- `apps/web/app/(public)/members/_components/MemberList.tsx` — `apps/web/src/components/public/MemberGrid.tsx` / `MemberTable.tsx` に責務移管
- `apps/web/app/(public)/members/_components/MembersFilterBar.client.tsx` — `apps/web/src/components/public/MemberFilters.client.tsx` / `DensityToggle.client.tsx` に責務移管
- `apps/web/src/components/public/StatCard.tsx` — `apps/web/src/components/public/Stats.tsx` に集約
- `apps/web/src/components/public/__tests__/StatCard.test.tsx` — `Stats.test.tsx` に集約

## skill / spec / workflow 系 path（個別列挙）

| カテゴリ | path |
| --- | --- |
| skill 正本 | `.claude/skills/aiworkflow-requirements/SKILL.md` |
| skill 正本 | `.claude/skills/task-specification-creator/SKILL.md` |
| skill 履歴 | `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` |
| skill 履歴 | `.claude/skills/aiworkflow-requirements/changelog/20260509-task-11-public-top-and-member-list.md` |
| skill 履歴 | `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` |
| skill 履歴 | `.claude/skills/task-specification-creator/SKILL-changelog.md` |
| skill reference | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` |
| skill reference | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` |
| skill reference | `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` |
| skill reference | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` |
| skill reference | `.claude/skills/task-specification-creator/references/phase-12-documentation-guide.md` |
| workflow artifacts | `docs/30-workflows/task-11-public-top-and-member-list/index.md` |
| workflow artifacts | `docs/30-workflows/task-11-public-top-and-member-list/artifacts.json` |
| workflow outputs | `docs/30-workflows/task-11-public-top-and-member-list/outputs/artifacts.json` |
| workflow outputs | `docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-11/main.md` |
| workflow outputs | `docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-11/manual-test-result.md` |
| workflow outputs | `docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-11/manual-smoke-log.md` |
| workflow outputs | `docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-11/link-checklist.md` |
| workflow outputs | `docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-11/discovered-issues.md` |
| workflow outputs | `docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-12/main.md` |
| workflow outputs | `docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-12/implementation-guide.md` |
| workflow outputs | `docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-12/system-spec-update-summary.md` |
| workflow outputs | `docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-12/documentation-changelog.md` |
| workflow outputs | `docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-12/unassigned-task-detection.md` |
| workflow outputs | `docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-12/skill-feedback-report.md` |
| workflow outputs | `docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| system spec / specs 個別 path | 該当なし: 既存 spec の意味的更新は無く、UI 適合のみのため `docs/00-getting-started-manual/specs/*.md` への touch なし |

## validator 実行記録（コマンド逐語 + exit code + 件数）

| validator | コマンド | exit code | 件数 / 結果 |
| --- | --- | --- | --- |
| typecheck | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | 0 | PASS |
| lint | `mise exec -- pnpm --filter @ubm-hyogo/web lint` | 0 | PASS |
| test (web filter focused) | `mise exec -- pnpm exec vitest run --config=vitest.config.ts apps/web/src/components/public/__tests__/Timeline.test.tsx apps/web/src/components/public/__tests__/Hero.test.tsx apps/web/src/components/public/__tests__/Stats.test.tsx apps/web/src/components/public/__tests__/MemberCard.test.tsx apps/web/src/lib/url/__tests__/members-search.test.ts apps/web/src/lib/api/__tests__/public.test.ts` | 0 | PASS (6 files / 29 tests) |
| build | `mise exec -- pnpm --filter @ubm-hyogo/web build` | 0 | PASS |
| placeholder token grep | `rg -n -F 'token-sized' apps/web/src` | 1 | match 0 件（PASS gate） |
| placeholder token grep (extended) | `rg -n -F -e 'token-sized' -e '09b-token-value' -e 'token-mix' apps/web/src` | 1 | match 0 件（PASS gate） |
| HEX literal grep | `rg -n '#[0-9a-fA-F]{3,8}' apps/web/src/components/public apps/web/app/page.tsx 'apps/web/app/(public)'` | 1 | match 0 件（PASS gate） |
| arbitrary tw color grep | `rg -n 'bg-\[#\|text-\[#' apps/web/src/components/public apps/web/app/page.tsx 'apps/web/app/(public)'` | 1 | match 0 件（PASS gate） |
| D1 direct import grep | `rg -n 'D1Database\|@cloudflare/workers-types' apps/web/src apps/web/app` | 1 | match 0 件（PASS gate） |
| Sentry direct import grep | `rg -n 'from "@sentry/' apps/web/src/components/public apps/web/app/page.tsx 'apps/web/app/(public)'` | 1 | match 0 件（PASS gate） |
| process.env grep | `rg -n 'process\.env\.' apps/web/src/components/public apps/web/app/page.tsx 'apps/web/app/(public)' apps/web/src/lib/api` | 1 | match 0 件（PASS gate） |
| Playwright skip grep | `rg -n 'test\.describe\.skip\|test\.skip\(true\|it\.skip' apps/web/playwright/tests/public-top-and-list.spec.ts` | 1 | match 0 件（PASS gate） |
| revalidate=60 grep | `rg -n 'revalidate\s*=\s*60' apps/web/app/page.tsx` | 0 | match 1 件（PASS gate） |
| revalidate=30 grep | `rg -n 'revalidate\s*=\s*30' 'apps/web/app/(public)/members/page.tsx'` | 0 | match 1 件（PASS gate） |
| Playwright list | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/public-top-and-list.spec.ts --project=desktop-chromium --list` | 0 | 5 tests discovered |
| artifacts parity | `cmp -s docs/30-workflows/task-11-public-top-and-member-list/artifacts.json docs/30-workflows/task-11-public-top-and-member-list/outputs/artifacts.json` | 0 | PASS |
| Phase 12 strict outputs count | `find docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-12 -maxdepth 1 -type f \| wc -l` | 0 | 7 files |

## planned wording check

`rg -n "計画\|予定\|TODO\|will be\|を予定\|仕様策定のみ\|保留として記録" outputs/phase-12/*.md` → 0 件想定（compliance check で再検証）。

## Notes

- §99 必須項目 placeholder check は本 task 対象外（UI 適合タスクで token spec への新規追加なし）。
- screenshot / axe は `outputs/phase-11/manual-test-result.md` に従い `PENDING_RUNTIME_EVIDENCE` として分離記録。`IMPLEMENTED_LOCAL_RUNTIME_PENDING` 状態語彙で総合判定。
- root/output `artifacts.json` は full mirror parity（`cmp -s` で完全一致）。
