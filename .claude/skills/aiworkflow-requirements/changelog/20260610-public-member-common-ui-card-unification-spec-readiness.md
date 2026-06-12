# 2026-06-10 public-member-common-ui-card-unification spec readiness sync

`public-member-common-ui-card-unification` was promoted to `implemented_local_visual_pending / implementation / VISUAL / local_screenshot_pending` after review found local apps/web implementation diffs.

## Scope

- Public/member/auth user-visible routes: `/`, `/members`, `/members/[id]`, `/register`, `/privacy`, `/terms`, `/profile`, `/login`.
- apps/web-only common layout layer: PageShell, PageHeader, SectionCard, ContentCard, Prose, ButtonLink, and layout CSS.
- Lane order: Lane A foundation before Lane B/C route migration.

## Evidence

- Phase 12 strict 7 files are present under `docs/30-workflows/public-member-common-ui-card-unification/outputs/phase-12/`.
- apps/web implementation is present and verified locally: focused Vitest 62 tests / 7 files PASS (ButtonLink 13 + layout 5 files + public.spec.ts 7), root typecheck (7 projects) + apps/web eslint + verify-no-inline-style OK, HEX 0, apps/api UNTOUCHED.
- Still pending/user-gated: full 16-shot local screenshots, staging visual baseline, commit, push, and PR. (Representative Phase 11 PNGs are present.)

## Invariants

- apps/api / D1 schema / Google Form / public API response surface unchanged.
- Admin adoption, dark mode, and unrelated `globals.css` cleanup are not current unfinished work for this workflow.
