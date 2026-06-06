# Phase 7: カバレッジ（変更範囲限定）

[実装区分: 実装仕様書]

## メタ情報

- workflow_state: `spec_created`
- taskType: `implementation`
- visualEvidence: `VISUAL_ON_EXECUTION`

## 目的

本 PR で変更した範囲のみを coverage 証跡対象とする（全ファイル一律の閾値は課さない）。変更した関数 / ブロックの line / branch を網羅し、変更外（既存 pill toggle 等）は対象外であることを明示する。

## coverage 対象（限定）

| ファイル | 対象関数 / ブロック | 証跡対象 |
| --- | --- | --- |
| `apps/web/src/features/admin/components/_members/MemberTagInlineCreate.tsx` | `createPhase` 全分岐（`idle` / `form` / `submitting` / `conflict`）+ client validation 分岐（空 / regex / 長さ）+ mutation 結果分岐（201 / 400 / 409）+ ロック解放 `finally` | line + branch |
| `apps/web/src/features/admin/components/_members/MemberDrawer.tsx`（`MemberTagsEditor` 追加部分のみ） | `createdPendingAttach` state 遷移 / `onTagCreated` ハンドラ / attach リトライ（成功・失敗・retry）/ conflict 再取得導線 | line + branch |
| `apps/web/src/features/admin/api/members.ts`（追加部分のみ） | `createTag`（body map / 201 path）/ `parseTagErrorCode`（`invalid_json` / `invalid_body` / `tag_code_conflict` / parse 不能 `null`） | line + branch |

## 各分岐の証跡対応テスト

| 対象分岐 | 担当テスト |
| --- | --- |
| `createPhase: idle → form` | C-T1 |
| `createPhase: form → submitting → idle`（201 + attach 成功） | C-T2 / C-T12 |
| client validation 拒否（空 / regex / 長さ） | C-T3 / C-T15 |
| 400（`invalid_body`）→ `form` 維持 | C-T4 / C-T13 |
| 409 → `conflict`、既存 pill 回収 → `idle` | C-T5 / C-T11 |
| 部分成功（attach 失敗）→ `createdPendingAttach` 保持 + retry | C-T6 / C-T10 |
| 二重送信防止（`submitting` disabled） | C-T9 |
| ロック解放（成功 / 失敗 / キャンセル） | C-T12 / C-T13 / C-T14 |
| `parseTagErrorCode` 各 code + null | C-T4 / C-T5（mock bodyText 経由）+ 単体（任意） |

## 変更外（coverage 対象外）

以下は本 PR で変更しないため coverage 証跡の対象としない（既存 issue-982 / #1085 の baseline に委ねる）。

- 既存 pill toggle（assign / unassign の楽観更新・rollback）
- `fetchMemberTags` / `assignMemberTag` / `unassignMemberTag`（task-A 以前の既存 client）
- `MemberDrawer` の tag 編集以外のセクション（プロフィール表示等）

## 計測コマンド（範囲限定）

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.tagInlineCreate.spec.tsx \
  --coverage \
  --coverage.include='apps/web/src/features/admin/components/_members/MemberTagInlineCreate.tsx' \
  --coverage.include='apps/web/src/features/admin/components/_members/MemberDrawer.tsx' \
  --coverage.include='apps/web/src/features/admin/api/members.ts'
```

> include glob で変更 3 ファイルに限定する。閾値判定はせず、上表の分岐が line / branch で踏まれていることを証跡とする。

## 実行タスク

- 本 Phase の記載内容を実装時の gate として使用する。

## 成果物

- 変更 3 ファイルの限定 coverage レポート（上表の全分岐が踏破済み）。

## 統合テスト連携

- 実装時は Phase 4-7 の focused tests と Phase 11 evidence ledger に接続する。

## 参照資料

- docs/30-workflows/completed-tasks/issue-1068-admin-tag-inline-create-ui/index.md
- docs/30-workflows/completed-tasks/issue-1068-admin-tag-inline-create-ui/phase-6-test-additions.md
- .claude/skills/task-specification-creator/SKILL.md

## 完了条件

- 変更した `MemberTagInlineCreate.tsx` の `createPhase` 全分岐 + validation 分岐が line / branch で踏破
- `MemberDrawer.tsx` の `createdPendingAttach` / `onTagCreated` / attach リトライ分岐が踏破
- `members.ts` の `createTag` / `parseTagErrorCode` 分岐が踏破
- 変更外ブロックを証跡対象に含めていない
