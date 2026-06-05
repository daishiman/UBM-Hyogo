# Implementation Guide

## Part 1: 中学生レベルの説明

なぜ必要かというと、会員に合うタグを付けたい時にタグがまだ無いと、今は別の管理ページへ移動して作ってから会員カードへ戻る必要があり、作業が途中で切れてしまうためです。

何をするかというと、会員カードのタグ欄に「新しいシールをその場で作るボタン」を追加することです。

会員カードのタグ欄に「新しいシールをその場で作るボタン」を追加する。今までは別の管理ページに行かないと作れなかったタグを、会員カードを開いたまま code / label / category を入力して作り、そのまま会員へ貼れるようにする。

たとえば教室で名札シールを配る時、必要な名前のシールが箱に無ければ、その場で新しいシールを作って、そのまま生徒のカードに貼れるようにするイメージです。同じ code のタグが既にある場合は、新しく作らず、既存タグを選んで付ける流れへ戻す。タグ作成は成功したが会員への付与だけ失敗した場合は、作成済みタグを捨てずに「もう一度付与する」導線を出す。

### 今回作ったもの（2026-06-03 実装完了）

- `apps/web` の実コード実装（task-A / task-B / task-C）を完了し、全テスト green。
- Issue #1068 の task-A -> task-B -> task-C 実装。
- aiworkflow-requirements の active ledger / index / artifact inventory 同期。

実装結果サマリは [implementation-result.md](./implementation-result.md) を参照。

## Part 2: 技術者向け

### State machine

| Owner | State | Purpose |
| --- | --- | --- |
| `MemberTagInlineCreate` | `idle` | collapsed create affordance |
| `MemberTagInlineCreate` | `form` | code / label / category input |
| `MemberTagInlineCreate` | `submitting` | `POST /api/admin/tags` in flight |
| `MemberTagInlineCreate` | `conflict` | 409 `tag_code_conflict` recovery |
| `MemberTagsEditor` | `createdPendingAttach` | create succeeded but assign failed |
| `MemberTagsEditor` | `pendingTagId` | existing issue-982 assign/unassign in-flight lock |

### TypeScript types

> 実装時の正本（`apps/web/src/features/admin/api/members.ts`）。`AdminTagRef.tagId` は
> `string`、`active` は `AdminTagRef` に含めず createTag 戻り値で破棄する（付与判定に不要なため）。

```ts
type AdminTagCreateErrorCode =
  | "tag_code_conflict"
  | "invalid_body"
  | "invalid_json";

interface AdminTagRef {
  tagId: string;
  code: string;
  label: string;
  category: string;
}

// !res.ok 時に throw。検出 code（不明なら null）と HTTP status を載せる。
class TagCreateError extends Error {
  readonly status: number;
  readonly code: AdminTagCreateErrorCode | null;
  readonly bodyText: string;
}
```

### APIシグネチャ

| Operation | Endpoint | Request | Success | Error handling |
| --- | --- | --- | --- | --- |
| Create tag master | `POST /api/admin/tags` | `{ code, label, category }` | `201 { tagId, code, label, category, active }` | `400 invalid_json`, `400 invalid_body`, `409 tag_code_conflict` |
| Assign tag to member | `POST /api/admin/members/:memberId/tags` | `{ tagId }` | `200 { assigned, available }` | existing member tag error surface |
| Refetch member tags | `GET /api/admin/members/:memberId/tags` | none | `{ assigned, available }` | existing fetch error surface |

```ts
createTag(input: { code: string; label: string; category: string }): Promise<AdminTagRef>;
parseTagErrorCode(bodyText: string): AdminTagCreateErrorCode | null;
assignMemberTag(memberId: string, tagId: string): Promise<MemberTagsResult>;
fetchMemberTags(memberId: string): Promise<MemberTagsResult>;
```

### 使用例（実装の連結フロー）

`MemberTagInlineCreate`（子）は create のみ担い、付与（attach）は親 `MemberTagsEditor` の
既存 assign mutation（issue-982）を再利用する。子の create mutation は `useAdminMutation`
経由で発火し、error code 検出に `parseTagErrorCode` を共用する。

```ts
// 子: POST /api/admin/tags（useAdminMutation 経由）
const created = await create.trigger({ code: "mentor", label: "メンター", category: "role" });
onTagCreated(created); // → 親へ委譲

// 親: available へ追加 → 既存 assign mutation で attach（失敗時 createdPendingAttach 保持）
```

### Implementation targets

- `apps/web/src/features/admin/api/members.ts`: add `createTag`, `AdminTagCreateErrorCode`, and `parseTagErrorCode`.
- `apps/web/src/features/admin/components/_members/MemberTagInlineCreate.tsx`: new form component with client-side validation.
- `apps/web/src/features/admin/components/_members/MemberDrawer.tsx`: wire create -> assign, conflict refetch, and `createdPendingAttach` retry.
- `apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.tagInlineCreate.spec.tsx`: C-T1 to C-T8 focused component coverage.
- `apps/web/playwright/tests/visual/admin-shell/member-drawer-tag-inline-create.spec.ts`: desktop/mobile visual evidence.

### Validation rules

- `code`: `/^[a-z0-9][a-z0-9_]*$/`, 1 to 64 chars.
- `label`: 1 to 120 chars.
- `category`: 1 to 64 chars.
- Server 400 is a fallback because field-level validation messages are not returned by the current API.

### エラーハンドリング

- 409 `tag_code_conflict`: member tags を再取得し、既存 tag を選択できる状態へ戻す。
- 400 `invalid_body`: client validation の取りこぼしとして包括 error を表示する。
- create 201 後に assign が失敗した場合: `createdPendingAttach` に作成済み tag を保持し、attach retry を表示する。

### エッジケース

- 同じ code を二重送信しないよう submit 中は form controls を disabled にする。
- 既存 issue-982 の `pendingTagId` と `createdPendingAttach` は別 state とし、assign 中ロックと作成済み未付与を混同しない。
- `/admin/tags` 管理画面の pagination/search は drawer から呼ばず、regression test で退化を防ぐ。

### 設定項目と定数一覧

実装では `MemberTagInlineCreate.tsx` の `validateTagFields` にバリデーション規則を集約
（`CODE_RE = /^[a-z0-9][a-z0-9_]*$/`、長さ上限はインライン定数）。

| 規則 | Value |
| --- | --- |
| code regex（`CODE_RE`） | `/^[a-z0-9][a-z0-9_]*$/` |
| code 最大長 | `64` |
| label 最大長 | `120` |
| category 最大長 | `64` |

### テスト構成

| Test | Purpose |
| --- | --- |
| `MemberDrawer.tagInlineCreate.spec.tsx` | C-T1 to C-T8 component state and mutation coverage |
| `MemberDrawer.tags.spec.tsx` | existing issue-982 regression coverage |
| `member-drawer-tag-inline-create.spec.ts` | desktop/mobile visual evidence |

### Visual evidence boundary

UI 実装は完了済み（`MemberTagInlineCreate` + `MemberDrawer` 配線）。Playwright visual spec
（`member-drawer-tag-inline-create.spec.ts`、desktop/mobile）も追加済みだが、baseline
screenshot 取得は staging 認証（`PLAYWRIGHT_ADMIN_MEMBER_DETAIL_ID`）を要するため Phase 11 /
user-gated。spec は env 未設定時 `test.skip` で安全にスキップする。
