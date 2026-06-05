# Phase 5: 実装（GREEN）

[実装区分: 実装仕様書]

## メタ情報

- workflow_state: `spec_created`
- taskType: `implementation`
- visualEvidence: `VISUAL_ON_EXECUTION`

## 目的

Phase 4 の RED（C-T1〜C-T8）を GREEN にする。`MemberTagsEditor`（issue-982 実装済）へ tag inline-create 導線を追加する。新規 / 修正ファイルパスを明示し、見落としを防ぐ（FB Feedback RT-03）。**apps/api は変更しない**（純粋に apps/web）。task-A（`createTag` / `parseTagErrorCode` / `AdminTagCreateErrorCode`）は完了前提で task-B を実装する。

## 新規作成ファイル

| パス | 内容 |
| --- | --- |
| `apps/web/src/features/admin/components/_members/MemberTagInlineCreate.tsx` | create フォーム + 状態機械（`createPhase`）+ conflict / validation 表示。子 component |
| `apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.tagInlineCreate.spec.tsx` | C-T1〜C-T8 の drawer inline-create spec（task-B） |
| `apps/web/playwright/tests/visual/admin-shell/member-drawer-tag-inline-create.spec.ts` | visual baseline spec（task-C・Phase 11 で baseline 取得・user-gated） |

## 修正ファイル

| パス | 修正内容 |
| --- | --- |
| `apps/web/src/features/admin/api/members.ts` | `createTag` helper + `AdminTagCreateErrorCode` 型 + `parseTagErrorCode`（task-A 成果物・task-B から import） |
| `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | `MemberTagsEditor` に inline-create 子 component を配線。`createdPendingAttach: AdminTagRef \| null` state + attach リトライ |

> apps/api 差分 0。`git diff --stat apps/api` で確認（Phase 9 Q-API）。

## 実装手順（直列）

### Step 1: web API client（task-A 成果物の前提確認）

1. `features/admin/api/members.ts` に以下が存在することを前提とする（task-A で実装）。
   - `createTag(body: { code: string; label: string; category: string }): Promise<AdminTagRef>`（`POST /api/admin/tags` → 201 `{tagId,code,label,category,active}` を `AdminTagRef` へ map）。
   - `AdminTagCreateErrorCode = "invalid_json" | "invalid_body" | "tag_code_conflict"`。
   - `parseTagErrorCode(bodyText: string): AdminTagCreateErrorCode | null`（error body `{ok:false,error:"<code>"}` から `error` を取り出す。parse 不能時 `null`）。
2. mutation 発火は `useAdminMutation` 標準 fetch 経路を正とし、`createTag` は型・body shape の単体経路として使う（task-A 範囲）。

### Step 2: 子 component `MemberTagInlineCreate.tsx`（task-B）

1. local state `createPhase: "idle" | "form" | "submitting" | "conflict"` + form fields `code` / `label` / `category`（local）を持つ。
2. 「+ 新規タグ」トリガー → `createPhase = "form"`。`FormField` ×3（`code` / `label` / `category`）を描画。
3. client validation: 空 / regex（`code` は `/^[a-z0-9][a-z0-9_]*$/`・1-64）/ 長さ（`label` 1-120・`category` 1-64）。違反は `FormField` の `error` に出し `createPhase = "form"` 維持・送信しない。
4. 送信 → `createPhase = "submitting"` → `useAdminMutation<AdminTagRef>('/api/admin/tags','POST',{ refreshOnSuccess:false, successMessage:'✓ タグを作成しました', onError })` の `trigger({code,label,category})`。
   - 201 → `onTagCreated(createdTag)` で親へ通知。フォーム `idle` 化。
   - 409（`onError` で `parseTagErrorCode(err.bodyText) === 'tag_code_conflict'`）→ `createPhase = "conflict"`。重複再送信しない。親へ conflict code を通知し既存 tag 回収導線を出す。
   - 400（`invalid_body` / `invalid_json`）→ `FormField` の `error` に出して `createPhase = "form"` 維持。
5. ロック解放: `submitting` は成功 / 失敗 / キャンセル の全経路で必ず `form` / `idle` / `conflict` のいずれかへ復帰する（`finally` で解放）。

### Step 3: 親 `MemberTagsEditor`（`MemberDrawer.tsx`）配線（task-B）

1. 親が `assigned` / `available` / `pendingTagId` / `createdPendingAttach: AdminTagRef | null` を所有する。
2. `MemberTagInlineCreate` を既存 pill 一覧の下（または隣接）に配置。既存 pill 一覧と layout が重ならないこと（AC-6）。
3. `onTagCreated(createdTag)` ハンドラ:
   - `available` に `createdTag` を追加。
   - 既存 `assign` mutation（`POST /api/admin/members/:id/tags {tagId}`）で attach。`onSuccess` の `{assigned,available}` で反映。
   - attach 失敗時 → `createdPendingAttach = createdTag` を保持し「タグを作成しましたが付与に失敗しました。再試行」+ retry ボタンを表示。retry は attach を再実行（二重発火しない）。成功で `createdPendingAttach = null`。
4. conflict 通知時 → `fetchMemberTags(memberId)` を再取得し同 `code` の既存 tag を `available` に出す。既存 pill 選択導線を提示。選択で `idle` へ戻る。

### Step 4: テスト（task-B）

1. `MemberDrawer.tagInlineCreate.spec.tsx`（C-T1〜C-T8）を GREEN にする。`createTag` / `useAdminMutation` / `fetchMemberTags` を mock。

### Step 5: visual baseline（task-C）

1. `member-drawer-tag-inline-create.spec.ts` を追加（baseline 取得は Phase 11 で user-gated）。

## canUseTool / 副作用境界

- 本タスクに SDK callback / IPC は無し（Cloudflare Workers + Next.js）。
- D1 write は `apps/api` に閉じる（invariant #1）。`apps/web` は fetch のみ。本 PR で apps/api 差分 0。
- mutation は `@/features/admin/hooks/useAdminMutation` 経由（invariant #10）。
- admin input は `FormField` 経由。`apps/web/src/components/admin/` 配下に新規 `<input>` を増やさない（invariant #9）。

## GREEN 確認コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- MemberDrawer.tagInlineCreate
mise exec -- pnpm --filter @ubm-hyogo/web test -- MemberDrawer.tags   # 既存 regression（B-T1〜B-T8）
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
# 代替: mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts <path>
```

## 実行タスク

- 本 Phase の記載内容を実装時の gate として使用する。

## 成果物

- 上記新規 / 修正ファイルの実装（C-T1〜C-T8 GREEN、B-T1〜B-T8 regression 0）。

## 統合テスト連携

- 実装時は Phase 4-7 の focused tests と Phase 11 evidence ledger に接続する。

## 参照資料

- docs/30-workflows/completed-tasks/issue-1068-admin-tag-inline-create-ui/index.md
- docs/30-workflows/completed-tasks/issue-982-drawer-tag-pill-editing/phase-5-implementation.md
- .claude/skills/task-specification-creator/SKILL.md

## 完了条件

- Phase 4 の全 RED（C-T1〜C-T8）が GREEN
- 既存 B-T1〜B-T8 regression 0
- `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` green
- 新規 / 修正ファイルパス一覧が実変更と一致（`git diff --stat apps/api` が空）
