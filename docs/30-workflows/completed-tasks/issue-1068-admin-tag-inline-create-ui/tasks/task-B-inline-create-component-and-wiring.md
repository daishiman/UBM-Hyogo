# task-B: inline-create 子 component + MemberDrawer 配線

[実装区分: 実装仕様書]

## メタ情報

- workflow_state: `spec_created`
- taskType: `implementation`
- visualEvidence: `VISUAL_ON_EXECUTION`

`MemberDrawer` 内 `MemberTagsEditor`（issue-982 実装済）へ tag inline-create 導線を追加する。create フォーム + 状態機械を子 component に分離し、create→attach を連結する。**apps/api は変更しない**（純粋に apps/web）。

> **実コード照合済み（確定設計）**: `useAdminMutation(endpoint, method, options)` は positional 引数。`trigger(payload, endpointOverride?)`。失敗時 `FetchAuthedError{status,bodyText}` を throw。`TagPill` は `apps/web/src/features/admin/components/_shared/TagPill.tsx`（`{children,selected?,onClick?,disabled?,title?}`）。`FormField` は `apps/web/src/components/ui/FormField.tsx`（`{name,label,error?,helper?,required?,className?,children}`）。

## 依存

- task-A（`features/admin/api/members.ts` の `createTag` / `parseTagErrorCode` / `AdminTagCreateErrorCode`）。task-A 完了前提で実装する。

## 主担当 AC

AC-1（drawer から新規 tag 作成）/ AC-2（作成後 attach + pill 反映）/ AC-3（`tag_code_conflict` を既存 tag 選択へ回収）/ AC-4（validation error を drawer 内表示）/ AC-5（既存 検索/付与/解除が退化しない）/ AC-6（desktop/mobile で操作部品と pill が重ならない）。

## 変更対象ファイル

| パス | 種別 | 内容 |
| --- | --- | --- |
| `apps/web/src/features/admin/components/_members/MemberTagInlineCreate.tsx` | 新規 | create フォーム + 状態機械（`createPhase`）+ client validation + 409/400 ハンドリング + `onTagCreated` callback |
| `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | 編集 | `MemberTagsEditor` 配線（`createdPendingAttach` state + attach リトライ + 子 component 配置） |
| `apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.tagInlineCreate.spec.tsx` | 新規 | C-T1〜C-T8 |

## API 契約（検証済み・改変禁止）

- `POST /api/admin/tags` body `{code,label,category}` → 201 `{tagId,code,label,category,active}`。400 `invalid_json` / `invalid_body`、409 `tag_code_conflict`。error body `{ok:false,error:"<code>"}`。
  - `code` regex `/^[a-z0-9][a-z0-9_]*$/`・1-64。`label` 1-120。`category` 1-64。
- `POST /api/admin/members/:memberId/tags {tagId}` → 200 `{assigned,available}`、404 `tag_not_found`。
- `GET /api/admin/members/:memberId/tags` → `{assigned,available}`。
- 型: `AdminTagRef = {tagId,code,label,category}`、`MemberTagsResult = {assigned:AdminTagRef[],available:AdminTagRef[]}`。

## 状態機械（`MemberTagInlineCreate.tsx`）

local state `createPhase: "idle" | "form" | "submitting" | "conflict"` + form fields `code` / `label` / `category`（local）。

1. **idle**: 「+ 新規タグ」トリガーのみ表示。click → `form`。
2. **form**: `FormField` ×3 描画。client validation（空 / regex / 長さ）で違反は `FormField` の `error` に出し送信抑止。送信 → `submitting`。
3. **submitting**: 送信ボタン disabled（二重送信防止）。`useAdminMutation<AdminTagRef>('/api/admin/tags','POST',{ refreshOnSuccess:false, successMessage:'✓ タグを作成しました', onError }).trigger({code,label,category})`。
   - 201 → `onTagCreated(createdTag)` → `idle`。
   - 409（`onError` で `parseTagErrorCode(err.bodyText)==='tag_code_conflict'`）→ `conflict`（重複再送信しない）。
   - 400（`invalid_body` / `invalid_json`）→ `FormField` error 表示で `form` 維持。
4. **conflict**: 親が `fetchMemberTags(memberId)` で同 `code` 既存 tag を `available` に出し、既存 pill 選択導線を提示。選択 → `idle`。
5. **ロック解放**: `submitting` は成功 / 失敗 / キャンセル 全経路で必ず `form` / `idle` / `conflict` へ復帰（`finally` で解放）。

## 親 `MemberTagsEditor`（`MemberDrawer.tsx`）配線

親が所有: `assigned` / `available` / `pendingTagId` / `createdPendingAttach: AdminTagRef | null`。

1. `MemberTagInlineCreate` を既存 pill 一覧と重ならない位置に配置（AC-6・desktop/mobile）。
2. `onTagCreated(createdTag)`:
   - `available` に `createdTag` を追加。
   - 既存 `assign` mutation（`POST /api/admin/members/:id/tags {tagId}`）で attach。`onSuccess` の `{assigned,available}` で反映。
   - attach 失敗 → `createdPendingAttach = createdTag` 保持 + 「タグを作成しましたが付与に失敗しました。再試行」+ retry ボタン。retry で attach 再実行（二重発火しない）。成功で `createdPendingAttach = null`。
3. conflict 時 → `fetchMemberTags(memberId)` 再取得で既存 tag 回収。

## テスト方針（task-B 分・C-T1〜C-T8）

`MemberDrawer.tagInlineCreate.spec.tsx`（Vitest + Testing Library。`createTag` / `useAdminMutation` / `fetchMemberTags` を mock）:

| ID | ケース | expected |
| --- | --- | --- |
| C-T1 | form 開閉 | 「+ 新規タグ」→ `FormField` ×3 表示。キャンセル → idle |
| C-T2 | create→attach→pill 反映 | 201 → attach 成功 → `assigned` に pill 追加・フォーム idle |
| C-T3 | client validation 拒否 | `code` 空 / regex 違反 / 長さ超過で `FormField` error・`createTag` 未発火 |
| C-T4 | server 400 | `invalid_body` → `FormField` error 表示・`form` 維持 |
| C-T5 | 409 回収 | `tag_code_conflict` → `conflict`・再取得した既存 pill 選択導線提示・重複再送信 0 |
| C-T6 | 部分成功リトライ | 201 後 attach 失敗 → `createdPendingAttach` 保持 + retry ボタン → retry で attach 再実行 |
| C-T7 | 既存 regression 0 | B-T1〜B-T8 が壊れない（既存 pill toggle が inline-create 配線の影響を受けない） |
| C-T8 | a11y | フォーム入力に label 紐付け（`FormField` の `name`/`label`）、エラーが読み上げ可能、ボタン disabled の状態反映 |

> **props/state 区別（VSCPKR-03）**: `createPhase` / form fields は子の internal state。`assigned` / `available` / `pendingTagId` / `createdPendingAttach` は親の internal state。`useAdminMutation` mock は `onSuccess` / `onError` を呼べる形にする。fetch mock 解決後に操作。

## 不変条件

- mutation は `@/features/admin/hooks/useAdminMutation` 経由（invariant #10）。legacy import 0。
- admin input は `FormField` 経由（invariant #9）。`apps/web/src/components/admin/` に新規 `<input>` を増やさない。
- 色は OKLch token のみ（invariant #2）。HEX 直書き 0。
- D1 直接アクセス 0（invariant #1）。apps/api 差分 0。

## ローカル実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- MemberDrawer.tagInlineCreate
mise exec -- pnpm --filter @ubm-hyogo/web test -- MemberDrawer.tags   # 既存 regression
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
```

## DoD（task-B）

- C-T1〜C-T8 全 PASS、B-T1〜B-T8 regression 0
- `MemberTagInlineCreate.tsx` が状態機械（`createPhase`）+ client validation + 409/400 ハンドリング + `onTagCreated` を備える
- `MemberDrawer.tsx` の `MemberTagsEditor` に `createdPendingAttach` + attach リトライ + 子 component 配置（AC-6 overlap 回避）が入る
- `useAdminMutation`（`@/features/admin/hooks/useAdminMutation`）経由（legacy import なし）
- HEX 直書き 0（token gate 通過）
- `pnpm typecheck` / `pnpm lint` green
- apps/api 差分 0（`git diff --stat apps/api` 空）

## 完了条件

- AC-1/AC-2/AC-3/AC-4/AC-5/AC-6 を満たす実装と C-T1〜C-T8 GREEN
- task-A（`createTag` / `parseTagErrorCode`）に依存して create→attach→conflict 回収が連結する
