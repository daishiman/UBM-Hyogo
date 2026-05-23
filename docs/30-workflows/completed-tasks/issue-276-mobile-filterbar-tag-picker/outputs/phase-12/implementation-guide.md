# Implementation Guide

## Part 1. 中学生レベルの説明

このタスクでは、メンバー一覧ページで興味のあるタグを画面から選べるようにしました。

API は、公開中のメンバーについてよく使われているタグを `topTags` として返します。画面はそのタグを小さな chip ボタンとして表示し、押すと URL に `tag=...` が追加されて絞り込みます。

スマートフォンでは、最初は検索条件エリアを折りたたみます。必要なときだけ開けるので、最初にメンバー一覧を見やすくなります。タグは 5 件まで選べて、上限に達したら未選択の候補は押せない状態になり、注意文を表示します。

## Part 2. Technical Summary

`PublicMemberListViewZ` now includes `topTags: { code, label, count }[]` with a maximum of 20 items. `GET /public/members` aggregates active tags inside the existing public boundary and returns them with the list response.

`MemberFilters` receives `topTags` from `apps/web/app/(public)/members/page.tsx` and composes `TagPicker`, `SelectedTagsBar`, and `FiltersSummaryMobile`. URL state remains canonical: selected tags are stored as repeated `?tag=` query parameters, while the mobile expanded/collapsed state stays local to the component.

## Part 3. Implementation Steps

Shared schema and API contract were updated first so all consumers parse the same response shape. The API repository added `aggregateTopTags`, and the public list use case fetches list rows, count, and top tags together.

The web implementation passes `list.topTags` into `MemberFilters`, renders tag candidates as switch-like chips, preserves selected tag removal and clear-all behavior, and hides the filter body on narrow screens until the summary row is expanded.

Focused Vitest coverage exists for shared schema, API use case/contract, `MemberFilters`, `TagPicker`, and `SelectedTagsBar`. Focused Playwright coverage is provided by `apps/web/playwright/tests/members-filter-mobile.spec.ts`, which writes Phase 11 screenshots under this workflow root.

## Part 4. Verification Commands

- `pnpm --filter @ubm-hyogo/shared test`
- `pnpm --filter @ubm-hyogo/api test`
- `pnpm --filter @ubm-hyogo/web test`
- `pnpm --filter @ubm-hyogo/web exec playwright test members-filter-mobile --project=desktop-chromium --reporter=line`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm verify:phase12-compliance`

## Part 5. Evidence Paths

- Phase 5 API implementation summary: `outputs/phase-05/main.md`
- Phase 6 Web implementation summary: `outputs/phase-06/main.md`
- Phase 11 screenshots: `outputs/phase-11/evidence/mobile-initial.png`, `mobile-expanded.png`, `mobile-limit-reached.png`, `desktop-picker-and-selected.png`
- Phase 11 report: `outputs/phase-11/test-report.md`

Commit, push, PR creation, and external deployment remain user-gated.
