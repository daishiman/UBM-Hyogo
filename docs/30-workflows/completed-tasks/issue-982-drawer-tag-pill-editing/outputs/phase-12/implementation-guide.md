# Implementation guide

## Part 1: 中学生レベル

会員カードに「興味タグ」のシールを貼ったり剥がしたりできるようにする。今までは見えるだけで貼れなかったシールを、係の人（管理者）が直接貼り外しできるようにし、誰がいつ貼ったかメモも残す。

これが必要なのは、会員の情報を見ながらその場で整理できないと、別の画面や別の作業に戻る手間が増えるから。やることは、会員の引き出し画面にあるタグをボタンとして使えるようにし、変更した内容を保存し、変更の記録も残すこと。

| 専門用語 | 日常語の言い換え |
| --- | --- |
| タグ | 会員カードに貼る分類シール |
| API | 画面と保存場所の連絡口 |
| audit | 誰が何をしたかのメモ |
| repository | 保存場所へ読み書きする係 |
| visual baseline | 画面の見た目を比べるための見本写真 |

## Part 2: 技術者レベル

The local implementation adds three admin endpoints under `/admin/members/:memberId/tags`:

| Method | Path | Contract |
| --- | --- | --- |
| GET | `/admin/members/:memberId/tags` | returns `{ assigned: TagRef[], available: TagRef[] }` |
| POST | `/admin/members/:memberId/tags` | body `{ tagId }`, idempotent via `INSERT OR IGNORE` |
| DELETE | `/admin/members/:memberId/tags/:tagId` | idempotent 204, no audit on no-op |

`TagRef` is `{ tagId, code, label, category }`. `tagId` is the canonical identifier from `tag_definitions.tag_id`; `code` remains display/parity metadata.

The D1 write table is `member_tags`, not `tag_assignments`. Deleted members use `member_status.is_deleted = 1` and return 409 `member_is_deleted`; absent members return 404 `member_not_found`; absent or inactive tag definitions return 404 `tag_not_found`.

The UI uses `@/features/admin/hooks/useAdminMutation` and local optimistic state in `MemberDrawer`. `ALL_TAGS` is removed and the selectable master list comes from the GET endpoint. The shared mutation hook treats DELETE 204 No Content as success without JSON parsing, so successful tag removal does not rollback.

Visual evidence is required after implementation via `member-drawer-tag-edit.png`; it is not claimed during this spec-created close-out.

## Part 3: 実装完了サマリ（2026-05-29 実コード反映）

本サイクルで spec を実コードへ実装完了した（ドキュメント止まりではない）。

### 変更ファイル（実コード）

| ファイル | 区分 | 内容 |
| --- | --- | --- |
| `apps/api/src/repository/memberTags.ts` | 編集 | `TagRef` + admin manual 6 関数（`getTagDefinitionMaster` / `listAssignedTagsForMember` / `findTagDefinitionById` / `assignTagToMemberByAdmin` / `unassignTagFromMemberByAdmin` / `getMemberDeletedFlag`）追加 + 不変条件 #13 再定義コメント |
| `apps/api/src/routes/admin/members.ts` | 編集 | GET/POST/DELETE `/members/:memberId/tags` 3 endpoint + `AssignTagBodyZ` + audit append |
| `apps/web/src/features/admin/hooks/useAdminMutation.ts` | 編集 | 204 No Content success handling（DELETE 成功時に JSON parse しない） |
| `apps/api/src/routes/admin/tags-queue.ts` | 編集 | 不変条件 #13 コメント再定義 |
| `apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts` | 編集 | `assignTagToMemberByAdmin` を allow list 追加 + admin manual export 検証 |
| `apps/api/src/routes/admin/members.tags.contract.spec.ts` | 新規 | A-T1〜A-T11 + authz contract（D1 harness） |
| `apps/api/src/repository/__tests__/memberTags.admin-write.repository.spec.ts` | 新規 | admin manual repository unit（real D1 / `setupD1`） |
| `apps/web/src/features/admin/api/members.ts` | 新規 | `fetchMemberTags` / `assignMemberTag` / `unassignMemberTag` client |
| `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | 編集 | `ALL_TAGS` 撤去 → `MemberTagsEditor`（楽観更新 + rollback + pending + `useAdminMutation`） |
| `apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.tags.spec.tsx` | 新規 | B-T1〜B-T8 編集インタラクション |
| `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts` | 編集 | DELETE 204 No Content regression guard + global fetch cleanup |
| `apps/web/playwright/tests/visual/admin-shell/member-drawer-tag-edit.spec.ts` | 新規 | drawer-tag-edit visual baseline（env-gated / user-gated） |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | 編集 | tag write endpoint 3 本 + 不変条件 #13 再定義 + audit action 2 件を追記 |

### ローカル検証結果（すべて green）

| gate | コマンド | 結果 |
| --- | --- | --- |
| API typecheck | `pnpm --filter @ubm-hyogo/api typecheck` | PASS |
| Web typecheck | `pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| API contract + repository（D1 focused） | `pnpm --filter @ubm-hyogo/api exec vitest run --root=../.. --config=vitest.d1.config.ts apps/api/src/routes/admin/members.tags.contract.spec.ts apps/api/src/repository/__tests__/memberTags.admin-write.repository.spec.ts` | **19 passed**（inactive tag guard 含む） |
| Web hook + component focused | `pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.tags.spec.tsx` | **42 passed**（DELETE 204 guard 含む） |
| 型 gate | `vitest --typecheck`（memberTags.readonly.test-d） | **5 passed / Type Errors: no errors** |
| Playwright spec 検出 | `playwright test member-drawer-tag-edit --list` | 検出（baseline 取得は user-gated） |
| 旧テーブル名残存 | `grep tag_assignments 01-api-schema.md` | **0 件** |

### 残作業（user-gated）

- Playwright `member-drawer-tag-edit.png` baseline 取得（staging 認証必須 / `PLAYWRIGHT_ADMIN_MEMBER_DETAIL_ID`）。
- commit / push / PR 作成（ユーザー明示承認後のみ）。
