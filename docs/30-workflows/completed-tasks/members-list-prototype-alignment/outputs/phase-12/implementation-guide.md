# Phase 12-1: Implementation Guide

task_id: `members-list-prototype-alignment`
date: 2026-05-26

## Part 1: 中学生レベル

`/members` の会員一覧を、設計サンプルに近いカード型・リスト型の見た目へ整えた。カード上部に名前と区画、本文側に職業と地域、下部にステータスを置き、表示密度 `comfy / dense / list` で同じ情報を読みやすく切り替えられる。

## Part 2: 技術詳細

変更は `apps/web` の表示層に限定した。新しい API、D1 schema、Auth.js、Google Form 契約は追加していない。`PublicMemberListItem` に存在しない `businessOverview` / list `tags` は持ち込まず、既存字段で prototype density を再構成した。

| area | files |
| --- | --- |
| member list route | `apps/web/app/(public)/members/page.tsx` |
| components | `MemberCard.tsx`, `MemberGrid.tsx`, `MemberFilters.client.tsx`, `TagPicker.client.tsx`, `EmptyState.tsx` |
| icon primitive | `apps/web/src/components/ui/{Icon.tsx,icons.ts}` |
| styles | `apps/web/src/styles/legacy-public.css` |
| tests | `MemberCard*.spec.tsx`, `MemberGrid.spec.tsx`, `MemberFilters.client.spec.tsx`, `EmptyState.component.spec.tsx`, `members-prototype-alignment.spec.ts` |

## Verification

- PASS: `pnpm --filter @ubm-hyogo/web typecheck`
- PASS: `pnpm --filter @ubm-hyogo/web test -- MemberCard MemberGrid MemberFilters EmptyState` (web suite 157 files / 1146 tests)
- PARTIAL: Playwright visual spec failed at local `webServer` readiness before the test body started; failure artifacts are in `outputs/phase-11/monocart/` and `outputs/phase-11/playwright-report/`.

## Phase 11 Visual References

| scenario | expected path | current status |
| --- | --- | --- |
| comfy desktop | `../phase-11/screenshots/EV-1-comfy-desktop.png` | pending_runtime |
| dense desktop | `../phase-11/screenshots/EV-2-dense-desktop.png` | pending_runtime |
| list desktop | `../phase-11/screenshots/EV-3-list-desktop.png` | pending_runtime |
| comfy mobile | `../phase-11/screenshots/EV-4-comfy-mobile.png` | pending_runtime |
| empty desktop | `../phase-11/screenshots/EV-5-empty-desktop.png` | pending_runtime |
| header focus | `../phase-11/screenshots/EV-6-header-focus.png` | pending_runtime |

Screenshot files are not marked PASS until they physically exist. The current evidence is the failed Playwright report and trace under `../phase-11/`.

## Rollback

DB / API / auth 変更がないため、該当 code/doc 差分の revert で戻せる。
