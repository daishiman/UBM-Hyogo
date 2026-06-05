# Phase 8: リファクタ

[実装区分: 実装仕様書]

## メタ情報

- workflow_state: `spec_created`
- taskType: `implementation`
- visualEvidence: `VISUAL_ON_EXECUTION`

## 目的

GREEN を維持したまま、create UI の責務分離・primitive 再利用・error code 判定の集約・token 準拠を整える。テストの GREEN を壊さない範囲で実施する。

## リファクタ項目

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| create フォーム / 既存 pill 一覧の layout primitive | inline-create 用に独自の入力欄 / ボタン layout を増設 | `FormField` ×3 + `TagPill` を再利用し、独自 layout primitive を生やさない | プロトタイプ正本（primitives 再利用）に整合。新規 primitive を生やさない |
| error code 判定ロジック | drawer / 子 component に 409 / 400 の文字列判定が散在 | `parseTagErrorCode`（`members.ts`）に集約し、子 component / drawer は戻り値の code で分岐 | 判定ロジックの単一化。drawer 側の責務肥大化を防ぐ |
| `MemberTagsEditor` の責務 | 既存 pill 編集 + create フォーム + 状態機械が 1 component に同居 | create UI を `MemberTagInlineCreate.tsx` 子 component に分離。親は `assigned` / `available` / `pendingTagId` / `createdPendingAttach` の所有と attach 連結のみ | SRP。既存 `MemberTagsEditor` の肥大化を回避 |
| 色指定 | HEX 直書き / `bg-[#xxx]` の混入リスク | OKLch token（`apps/web/src/styles/tokens.css`）のみ | invariant #2（token 正本化）。`verify-design-tokens` gate 通過 |
| client validation | 子 component 内に regex / 長さの magic number が散在 | regex（`/^[a-z0-9][a-z0-9_]*$/`）・長さ上限（code 64 / label 120 / category 64）を局所定数化し API 契約と一致 | API 契約（Phase 検証済み）との drift 防止 |

## 不変条件 guard

- mutation は `@/features/admin/hooks/useAdminMutation` 経由（invariant #10）。legacy `@/lib/useAdminMutation` 新規参照 0。
- admin input は `FormField` 経由。`apps/web/src/components/admin/` 配下に新規 `<input>` を増やさない（invariant #9）。
- D1 直接アクセス 0（invariant #1）。apps/api 差分 0。

## リファクタ後の確認

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- MemberDrawer.tagInlineCreate
mise exec -- pnpm --filter @ubm-hyogo/web test -- MemberDrawer.tags
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
```

## 実行タスク

- 本 Phase の記載内容を実装時の gate として使用する。

## 成果物

- create UI 子 component 分離・primitive 再利用・error code 集約済みコード（全テスト GREEN 維持）。

## 統合テスト連携

- 実装時は Phase 4-7 の focused tests と Phase 11 evidence ledger に接続する。

## 参照資料

- docs/30-workflows/completed-tasks/issue-1068-admin-tag-inline-create-ui/index.md
- docs/30-workflows/completed-tasks/issue-1068-admin-tag-inline-create-ui/phase-7-coverage.md
- .claude/skills/task-specification-creator/SKILL.md

## 完了条件

- create UI が `MemberTagInlineCreate.tsx` に分離され `MemberTagsEditor` の責務が肥大化しない
- error code 判定が `parseTagErrorCode` に集約（drawer 側に散らさない）
- HEX 直書き 0（OKLch token のみ）
- リファクタ後も全テスト GREEN
