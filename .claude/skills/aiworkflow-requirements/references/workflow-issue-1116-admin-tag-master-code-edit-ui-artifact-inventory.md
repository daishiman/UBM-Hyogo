# Workflow Artifact Inventory: issue-1116-admin-tag-master-code-edit-ui

## Metadata

| Field | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1116-admin-tag-master-code-edit-ui/` |
| state | `implemented_local_evidence_captured / implementation / VISUAL` |
| issue | #1116 CLOSED, use `Refs #1116` only |
| recovered from | `docs/30-workflows/unassigned-task/task-issue-1069-followup-001-admin-tag-code-edit-ui.md` |
| parent | `issue-1069-tag-code-rename` |
| scope | admin tag master code / label / category edit UI（apps/web only） |
| remaining user-gated boundary | authenticated staging visual capture, commit, push, PR, Issue mutation |

## Implemented Files

| Path | Change |
| --- | --- |
| `apps/web/app/(admin)/admin/tag-master/page.tsx` | new sibling admin route; reads tag master through existing `safeServerFetch("/admin/tags?...")` |
| `apps/web/src/features/admin/components/_tags/TagMasterPanel.tsx` | new list / select / search shell for tag master editing |
| `apps/web/src/features/admin/components/_tags/TagMasterEditForm.tsx` | new `FormField` + `useAdminMutation` edit form; sends current `code` as `expectedCode` |
| `apps/web/src/features/admin/api/tags.ts` | new update helper and pure `parseTagUpdateErrorCode` for `tag_code_conflict` / `tag_stale_conflict` |
| `apps/web/src/components/shell/shell-config.ts` | add `tag-master` sibling nav item at `/admin/tag-master` |
| `apps/web/src/components/shell/icons.tsx` | add `tag-master` icon path |
| `apps/web/src/styles/globals.css` | add token-only tag master layout styles |

## Tests And Evidence

| Evidence | Result |
| --- | --- |
| `pnpm exec vitest run apps/web/src/features/admin/api/__tests__/tags.update.spec.ts apps/web/src/features/admin/components/_tags/__tests__/TagMasterPanel.spec.tsx apps/web/src/components/shell/__tests__/shell-config.spec.ts` | PASS: 3 files / 19 tests |
| `pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| `pnpm --filter @ubm-hyogo/web lint` | PASS |
| `pnpm verify:tokens` | PASS |
| `pnpm verify:no-inline-style` | PASS |

## Boundaries

- `apps/api` remains unchanged. `PATCH /admin/tags/:tagId` code/expectedCode and 409 split are provided by issue-1069.
- `/admin/tags` remains the tag queue. Tag master edit UI uses sibling `/admin/tag-master` to avoid `isNavItemActive` prefix collision.
- Tag create, reactivate, and physical delete UI are out of scope and remain separate workflows.
- Authenticated staging screenshots and PR publication remain user-gated.

## 30-Method Compact Evidence

| Category | Applied Result |
| --- | --- |
| 論理分析系 | implementation/VISUAL cannot close as docs-only; local code and focused evidence were required. |
| 構造分解系 | route, component, API client, shell nav, style, tests split cleanly with no apps/api change. |
| メタ・抽象系 | stale issue route assumption was corrected from `/admin/tags` child to sibling `/admin/tag-master`. |
| 発想・拡張系 | avoided overbuilding CRUD; limited UI to list + code/label/category edit and conflict display. |
| システム系 | preserved issue-1069 API dependency and avoided tag queue nav collision. |
| 戦略・価値系 | maximized operator value with minimum new surface and existing mutation/proxy primitives. |
| 問題解決系 | root cause was missing UI consumption of completed CAS API; fixed in apps/web and evidence gates. |

## Lessons Learned

| ID | 教訓 |
| --- | --- |
| L-I1116-001 | CLOSED issue の route 前提は陳腐化しうる。issue は `/admin/tags` を tag master CRUD 用と想定していたが、current code では `/admin/tags` は tag QUEUE（nav id `tag-queue` / `shell-config.ts:82`）。`isNavItemActive` が `pathname.startsWith(href + '/')` で prefix 一致するため、子ルート `/admin/tags/master` は tag-queue nav を誤って active にする nav 衝突バグになる。→ **sibling route `/admin/tag-master`** を新設して回避。古い issue は current codebase を一次根拠に再評価する。 |
| L-I1116-002 | optimistic CAS（compare-and-swap）の UI 配線では、編集対象の**現在の `code` を `expectedCode` としてフォーム読込時に保持**し、保存時にそのまま送る。編集中の入力値を expectedCode にすると CAS が無効化する。 |
| L-I1116-003 | 同じ 409 でも `tag_code_conflict`（UNIQUE 制約衝突）と `tag_stale_conflict`（楽観 CAS 失敗）は operator への意味が異なる。pure 関数 `parseTagUpdateErrorCode` で error code を別表示メッセージへ分離し、UI 文言をインライン三項に散らさない。 |
| L-I1116-004 | web proxy は新規 route を**追加不要**。既存 catch-all `apps/web/app/api/admin/[...path]/route.ts` が `PATCH /api/admin/tags/:tagId` を既に forward する。不変条件「既存 API surface のみ利用」を守り、proxy/endpoint を増やさない。 |
| L-I1116-005 | test 件数 drift に注意。`shell-config.spec.ts` に sibling route / nav 非 active 検証を +2 したことで focused 合計が 17→**19** に増えた。件数は前 phase の値を持ち越さず、必ず focused vitest 実走（`3 files / 19 tests PASS`）で確定する。 |
