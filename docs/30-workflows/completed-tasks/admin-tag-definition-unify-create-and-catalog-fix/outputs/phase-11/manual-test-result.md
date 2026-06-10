# Phase 11 — Manual / Runtime Evidence

Status: `local_verification_passed_runtime_visual_pending`

apps/web implementation and local command verification were completed in this wave. Local unauthenticated browser screenshots were captured for the admin auth boundary. Authenticated admin UI screenshots remain user-gated because this workflow is `VISUAL_ON_EXECUTION` and requires admin credentials.

## Local evidence

| Evidence | Command / action | Expected |
| --- | --- | --- |
| Focused local specs | `mise exec -- pnpm exec vitest run --root . apps/web/src/components/admin/__tests__/tagDefinitionView.spec.ts apps/web/src/components/admin/__tests__/TagDefinitionPanel.component.spec.tsx apps/web/src/features/admin/api/__tests__/tags.create.spec.ts apps/web/src/features/admin/api/__tests__/members.tagCreate.spec.ts apps/web/src/components/shell/__tests__/shell-config.spec.ts apps/web/app/\(admin\)/admin/tag-master/page.spec.tsx apps/web/app/\(admin\)/admin/tags/catalog/page.spec.tsx` | PASS（7 files / 33 tests） |
| Defensive normalization | `mise exec -- pnpm exec vitest run --root . apps/web/src/components/admin/__tests__/tagDefinitionView.spec.ts` | `undefined` / `null` / `{}` / `{items:null}` / `{items:"x"}` all fold to `{ total: 0, items: [] }` |
| Create flow | `TagDefinitionPanel.component.spec.tsx` + `tags.create.spec.ts` | submit calls `POST /api/admin/tags`; 409 surfaces `tag_code_conflict`; client validation blocks invalid input before send |
| nav cleanup | `mise exec -- pnpm exec vitest run --root . apps/web/src/components/shell/__tests__/shell-config.spec.ts` | admin group exposes `タグ定義` + `タグキュー`; no `タグカタログ`/`tag-catalog` entry |
| typecheck | `mise exec -- pnpm typecheck` | PASS |
| lint | `mise exec -- pnpm lint` | PASS |
| Design tokens | `mise exec -- pnpm exec tsx scripts/verify-design-tokens.ts` | PASS (91 tracked) |
| API non-mutation | `git -C apps/api diff --stat` | empty |

## Local screenshot evidence

| Screen / state | Path | Result |
| --- | --- | --- |
| `/admin/tag-master` unauthenticated | `outputs/phase-11/screenshots/local-admin-tag-master.png` | Login gate rendered with admin-required message |
| `/admin/tags/catalog` unauthenticated | `outputs/phase-11/screenshots/local-admin-tags-catalog-redirect.png` | Login gate rendered; authenticated redirect target remains covered by server-page spec |

## Required visual evidence after local implementation (VISUAL_ON_EXECUTION)

| Screen / state | Action | Expected |
| --- | --- | --- |
| `/admin/tag-master` (0 items) | authenticated admin visit | `タグ定義管理` renders; no error boundary; EmptyState「該当するタグはありません」 |
| `/admin/tag-master` (create) | click 「+ 新規タグ作成」 → submit valid `code`/`label`/`category` | new tag prepended to list and selected |
| `/admin/tag-master` (duplicate code) | submit existing `code` | inline alert「同じコードのタグが既にあります」; list intact |
| `/admin/tag-master` (toggle) | toggle 停止中も表示 | inactive tags appear; 有効/停止/全体 count chips update |
| `/admin/tags/catalog` | authenticated admin visit | redirects to `/admin/tag-master` |

> Authenticated admin screenshots are captured by a browser/staging visual pass after user approval. The local screenshots above only prove the unauthenticated admin boundary and do not claim authenticated UI-state completion.
