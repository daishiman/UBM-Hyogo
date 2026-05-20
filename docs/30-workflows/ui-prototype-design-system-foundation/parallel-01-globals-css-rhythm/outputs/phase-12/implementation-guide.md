# Implementation Guide

## Part 1

この作業は、全ページに同じ見た目のルールを配るための「共通の線引き」です。
学校で全クラスに同じ掲示板ルールを配るように、`data-route` や
`data-card` という目印を置いた場所へ同じ余白・背景・文字サイズを当てます。

## Part 2

Implementation target: `apps/web/src/styles/globals.css`.

Secondary implementation target: `apps/web/app/(admin)/layout.tsx`, limited to
the admin shell grid column width `272px` so the `[data-shell="sidebar"]`
surface has the prototype rhythm width expected by the selector contract.

Selectors:

- `[data-route]`
- `[data-section]`
- `[data-section-rhythm]`
- `[data-card]`
- `[data-card-tone]`
- `[data-shell]`
- `[data-text]`

All values must use existing `--ubm-*` tokens. No new API endpoint, D1 schema,
Google Form contract, or new token is introduced by this sub-workflow.

Phase 11 evidence is the local selector/log inventory under
`outputs/phase-11/`. Visual screenshots are not claimed in this sub-workflow;
they remain delegated to
`serial-07-regression-evidence/outputs/phase-11/screenshots/{top,members-list,member-detail,admin-dashboard}.png`.
