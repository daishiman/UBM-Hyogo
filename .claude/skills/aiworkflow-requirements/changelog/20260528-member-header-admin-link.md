# 2026-05-28 member header admin link

`docs/30-workflows/completed-tasks/member-header-admin-link/` を
`implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION` として同期した。

## Changed

- `apps/web/src/lib/auth-view/` に `AuthView` / `resolveAuthView()` / `getAuthView()` を追加。
- `MemberHeader` に `authView` prop、`data-auth-state`、admin-only `/admin` CTA を追加。
- `(member)/layout.tsx` を async 化し、`getAuthView()` を1回だけ呼んで header へ配信。
- `outputs/phase-11/screenshots/member-header-member.png` / `member-header-admin.png` を local visual sanity evidence として追加。
- `docs/00-getting-started-manual/specs/02-auth.md`、quick-reference、resource-map、task-workflow-active、artifact inventory を同一 wave で同期。

## Evidence

- focused Vitest: 2 files / 9 tests PASS
- workspace typecheck: PASS
- workspace lint: PASS
- HEX grep and member-header contract grep: PASS
- local header screenshots: 2 PNG

## Boundary

Staging visual smoke、commit、push、PR は user-gated。

## Lessons Learned

`lessons-learned/lessons-learned-member-header-admin-link-2026-05.md` を新規追加し、artifact inventory `## Lessons Learned` 節と相互リンク。

- L-MHAL-001 親 workflow Task 独立化と依存最小閉包
- L-MHAL-002 `AuthView` discriminated union literal 固定
- L-MHAL-003 `data-auth-state` DOM 属性 contract
- L-MHAL-004 `(member)/layout.tsx` async + `getAuthView()` 1 回呼び出し
- L-MHAL-005 `getAuthView()` fail-closed guest fallback
- L-MHAL-006 resolver / adapter / render 3 層 focused spec

task-spec-creator 側へ「Parent workflow Task 切り出し + auth-view discriminated union 配信パターン」として汎化反映。
