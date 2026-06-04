# Phase 6: 追加テスト（fail path / 回帰 guard）

[実装区分: 実装仕様書]

## メタ情報

- workflow_state: `spec_created`
- taskType: `implementation`
- visualEvidence: `VISUAL_ON_EXECUTION`

## 目的

Phase 4 の正常系（C-T1〜C-T8）に加え、状態機械の fail path / 二重発火防止 / 既存 regression guard を追補する。`MemberTagInlineCreate` のロック解放・部分成功リトライの非冪等性を重点的に検証する。テストは `MemberDrawer.tagInlineCreate.spec.tsx` に追加する（`createTag` / `useAdminMutation` / `fetchMemberTags` は mock）。

## 追加テストケース

| ID | ケース | expected |
| --- | --- | --- |
| C-T9 | 二重送信防止 | `submitting` 中は送信ボタンが `disabled`。連続 click でも `createTag` mutation は 1 回のみ発火 |
| C-T10 | attach 失敗後の retry が二重発火しない | create 201 → attach 失敗 → retry ボタン 1 回 click で attach mutation 1 回のみ。retry 実行中は retry ボタン disabled |
| C-T11 | conflict 後に既存 pill 選択で idle へ | 409 → `createPhase="conflict"` → 再取得された既存 pill を選択 → `createPhase="idle"`・フォーム閉じ・重複 `createTag` 再送信 0 |
| C-T12 | ロック解放（成功） | 201 → attach 成功 → `createPhase` が `idle` に戻る（`submitting` に残らない） |
| C-T13 | ロック解放（失敗） | 400 → `createPhase="form"` に復帰し再入力可能（`submitting` に残らない） |
| C-T14 | ロック解放（キャンセル） | `form` 中にキャンセル → `idle`。`submitting` 経由の中断も `idle` / `form` へ復帰 |
| C-T15 | client validation 全分岐 | `code` 空 / regex 違反 / 65 文字、`label` 空 / 121 文字、`category` 空 / 65 文字でそれぞれ `FormField` error 表示・送信抑止 |

## 既存 regression guard（B-T1〜B-T8 を壊さない）

`MemberDrawer.tags.spec.tsx`（issue-982）の B-T1〜B-T8 が引き続き GREEN であること。inline-create の追加で以下が退化しないことを明示する（AC-5）。

| ID | guard 対象 |
| --- | --- |
| B-T1 | drawer open → available pill 描画（inline-create フォーム追加後も pill 一覧は変わらず描画） |
| B-T2 / B-T3 | 既存 pill toggle（POST/DELETE）が inline-create 配線の影響を受けない |
| B-T4 / B-T5 | assign/unassign 失敗の rollback が維持される |
| B-T6 | `pendingTagId` による既存 pill の二重発火防止が維持される |
| B-T7 | idempotency-key 付与経路が維持される |
| B-T8 | GET 失敗時の error 表示が維持される |

## props/state 区別（VSCPKR-03）

- `createPhase` / `code` / `label` / `category` は `MemberTagInlineCreate` の internal state。
- `assigned` / `available` / `pendingTagId` / `createdPendingAttach` は親 `MemberTagsEditor`（`MemberDrawer`）の internal state。
- `onTagCreated` は親→子の callback prop。`useAdminMutation` mock は `onSuccess` / `onError` を呼べる形にする。fetch mock 解決後に操作する。

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- MemberDrawer.tagInlineCreate
mise exec -- pnpm --filter @ubm-hyogo/web test -- MemberDrawer.tags
```

## 実行タスク

- 本 Phase の記載内容を実装時の gate として使用する。

## 成果物

- C-T9〜C-T15 追加テスト（GREEN）。B-T1〜B-T8 regression 0。

## 統合テスト連携

- 実装時は Phase 4-7 の focused tests と Phase 11 evidence ledger に接続する。

## 参照資料

- docs/30-workflows/completed-tasks/issue-1068-admin-tag-inline-create-ui/index.md
- docs/30-workflows/completed-tasks/issue-1068-admin-tag-inline-create-ui/phase-5-implementation.md
- .claude/skills/task-specification-creator/SKILL.md

## 完了条件

- C-T9〜C-T15 全 PASS
- B-T1〜B-T8 regression 0
- 二重送信防止 / retry 二重発火防止 / conflict→idle の各 fail path が緑
