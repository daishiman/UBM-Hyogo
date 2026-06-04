# Workflow Artifact Inventory: issue-1068-admin-tag-inline-create-ui

## Metadata

| Field | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1068-admin-tag-inline-create-ui/` |
| state | `implemented_local_visual_pending / implementation / VISUAL_ON_EXECUTION` |
| issue | #1068 CLOSED, use `Refs #1068` only |
| scope | `/admin/members` drawer `MemberTagsEditor` tag inline-create UI（apps/web only） |
| local implementation | complete (`apps/web` only; `apps/api` unchanged) |
| focused tests | 3 files / 20 tests PASS（`members.tagCreate` 4 + `MemberDrawer.tagInlineCreate` 8 + `MemberDrawer.tags` 8） |
| remaining user-gated boundary | staging screenshot baseline, commit, push, PR |
| consumes | `docs/30-workflows/completed-tasks/task-issue-1035-followup-001-admin-tag-inline-create-ui.md`（consumed trace） |
| depends on (landed) | issue-1035（`POST /admin/tags` / #1073）, issue-982（`MemberTagsEditor` + member tag assign / #982） |

## Workflow artifacts

| Artifact | Purpose |
| --- | --- |
| `index.md` | optimized Issue #1068 current-code spec |
| `phase-1-requirements.md` to `phase-13-pr.md` | Phase 1-13 workflow package |
| `tasks/task-A-tag-create-web-client.md` | web client helper spec |
| `tasks/task-B-inline-create-component-and-wiring.md` | component and wiring spec |
| `tasks/task-C-visual-evidence.md` | visual evidence spec |
| `outputs/artifacts.json` | mirror of root artifact metadata |
| `outputs/verification-report.md` | task specification validation report |
| `outputs/phase-11/manual-test-result.md` | focused test + visual evidence record |
| `outputs/phase-12/` | strict 7 close-out evidence |

## Implemented files (apps/web only)

| Path | Change |
| --- | --- |
| `apps/web/src/features/admin/api/members.ts` | add `createTag` helper, `AdminTagCreateErrorCode` type, `TagCreateError`, pure `parseTagErrorCode` (test/reuse helper; production fires via `useAdminMutation`) |
| `apps/web/src/features/admin/components/_members/MemberTagInlineCreate.tsx` | new inline-create component（`createPhase` 状態機械 + client `validateTagFields` + 409/400 分岐） |
| `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | wire create -> assign（`createdPendingAttach` + `runAttach` + `handleConflict` refetch + retry 導線） |
| `apps/web/src/features/admin/api/__tests__/members.tagCreate.spec.ts` | new — `createTag` / `parseTagErrorCode` focused tests（4 cases） |
| `apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.tagInlineCreate.spec.tsx` | new — inline-create component + wiring tests（8 cases, C-T1..C-T8） |
| `apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.tags.spec.tsx` | updated — shared `useAdminMutation` mock を endpoint 条件へ狭める回帰維持（8 cases） |
| `apps/web/playwright/tests/visual/admin-shell/member-drawer-tag-inline-create.spec.ts` | new — desktop/mobile visual evidence（env-gated skip; baseline は user-gated） |

## Boundaries

- `apps/api` remains unchanged.
- `POST /admin/tags`（`{ code, label, category }`, 201 / 409 `tag_code_conflict` / 400 `invalid_body`）and member tag assignment endpoint（`POST /admin/members/:memberId/tags { tagId }` -> 200 `{ assigned, available }`）are existing dependencies.
- Staging visual evidence, commit, push, PR, and Issue mutation are user-gated.

## Lessons Learned

詳細は [[lessons-learned-issue-1068-admin-tag-inline-create-ui-2026-06]]（L-I1068-001..008）。要点:

- L-I1068-001: API error 分類は transport クラスから独立した純関数（`bodyText -> code|null`）に置き複数経路で共用。
- L-I1068-002: 多段 write の部分成功は段ごとの state（`createdPendingAttach`）で保持し、retry は失敗段だけ冪等再実行。in-flight ロックと未完了ビジネス状態を混ぜない。
- L-I1068-003: 409 conflict 回収は権威ソース再取得（`fetchMemberTags`）を基準にし、UI は「未到着」相を持つ。
- L-I1068-004: server が field 粒度を返さない制約下は client validation ミラー + 400 は粒度を詐称しない包括フォールバック。
- L-I1068-005/006: 共有 hook mock は method + endpoint で slot 分岐し、失敗注入は callback（`onError`）と promise settle の双方を再現。
- L-I1068-007: 認証必須 visual は env-gate + skip 同梱、レイアウト不変は構造（border-t 縦分離）で担保、screenshot は user-gated。
- L-I1068-008: apps/web Vitest はルート config（`apps/web/vitest.config.ts` 不在）で起動し focused 件数を正本化。
