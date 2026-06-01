# 2026-05-28 — public-header-session-aware-auth-view-base

## Synced

- `docs/30-workflows/completed-tasks/public-header-session-aware-auth-view-base/` を `implemented_local_evidence_captured / implementation / VISUAL / Phase 13 pending_user_approval` で workflow inventory に登録。
- `apps/web/src/lib/auth-view/{types,resolveAuthView,getAuthView,index}.ts` 新規、`apps/web/src/components/public/PublicHeader.tsx` を async server component 化、`apps/web/app/(public)/layout.tsx` を async + `<PublicHeader authView />` 配線。
- focused Vitest 24 PASS (`resolveAuthView` 9 / `getAuthView` 4 / `PublicHeader` 8 / `(public)/layout` 3)、web typecheck/lint green、HEX 直書き 0 hit。
- Phase 11 local component screenshots 3 状態 (guest/member/admin) と render fixture を捕捉、`outputs/phase-11/` に inventory 化。
- `docs/00-getting-started-manual/specs/02-auth.md` に `AuthView` discriminated union contract と `PublicHeader` の DOM literal (`data-auth-state="guest|member|admin"`) 不変条件を追記。

## Skill same-wave updates

- `indexes/quick-reference.md` — workflow 新規セクション追加。
- `indexes/resource-map.md` — current canonical set に row 追加。
- `indexes/topic-map.md` / `indexes/keywords.json` — artifact inventory ref と offset 再生成。
- `references/task-workflow-active.md` — active row 追加。
- `references/workflow-public-header-session-aware-auth-view-base-artifact-inventory.md` 新規 — 成果物台帳 (completed-tasks path)。
- `lessons-learned/lessons-learned-public-header-session-aware-auth-view-base-2026-05.md` 新規 — L-PHSAV-001..005 + 苦戦箇所サマリ表。
- `LOGS/20260528-public-header-session-aware-auth-view-base.md` — 実装 + skill sync の wave 記録 (completed-tasks path)。
- `SKILL-changelog.md` — `v2026.05.28-public-header-session-aware-auth-view-base` row 追加。

## Unassigned tasks

| ID | Path | Source | Issue |
| --- | --- | --- | --- |
| FU-001 | `docs/30-workflows/completed-tasks/issue-1010-auth-view-session-contract-integration-test/unassigned-task-specs/public-header-auth-view-session-contract-integration-test-001.md` | Phase 10 M-01 / Phase 12 detection | #1010 |

## Verification

| Gate | Result |
| --- | --- |
| `pnpm verify:phase12-compliance` | PASS (1 root, `hasCompletedTasksAncestor: true`) |
| `pnpm gate-metadata:validate` | OK 526 / ERROR 0 |
| `pnpm indexes:rebuild` | idempotent (post-edit re-run pending) |
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS |

## User-gated remainder

- Staging authenticated runtime visual evidence for guest/member/admin states.
- `git commit` / `git push` / PR creation.
