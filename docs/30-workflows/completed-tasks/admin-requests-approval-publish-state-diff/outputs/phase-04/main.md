# Phase 4 成果物: テスト戦略概要（確定記録）

> 状態: completed。TDD Red 設計のテスト戦略。実テストコードは Phase 5 以降で実装（本サイクルでは設計のみ）。

## 1. テスト分類

| 分類 | 対象 | 配置 spec |
| --- | --- | --- |
| (A) 純粋関数 unit | `formatPublishStateLabel` / `buildPublishStateDiff` | `RequestQueueDetail.spec.tsx`（export して直接 import）or helper の `*.spec.ts` |
| (B) component spec（描画 / a11y） | `RequestQueueDetail` の diff 行（`data-diff-side` / `data-diff-kind` / 矢印 `aria-hidden`） | `RequestQueueDetail.spec.tsx` |
| (C) component spec（文言） | `RequestQueuePanel` の `destructiveMessage` 生成 + `RequestConfirmDialog` 表示 | `RequestQueuePanel.component.spec.tsx` / `RequestConfirmDialog.spec.tsx` |
| (D) 既存 3 spec 追従 | 既存 assertion の green 維持 | 上記 3 spec |

## 2. 書式・操作方針

- 書式: `import { cleanup, render, screen } from "@testing-library/react"` + `afterEach(() => cleanup())` + happy-dom（既存 spec に踏襲）。
- 操作: 対象 component は server fetch を直接呼ばないため `vi.stubGlobal` を**使わない**。props（`RequestQueueItem` fixture）注入で描画し、必要なら `fireEvent.click`。
- セレクタ: `container.querySelector('[data-diff-side="before"]')` / `[data-diff-side="after"]` / `[data-diff-kind="visibility"]` / `[data-diff-kind="delete"]` / `.admin-state-diff__arrow[aria-hidden="true"]`。色値（OKLch / HEX）はテストで直接 assert しない（CSS は `verify-design-tokens` gate で保証）。

## 3. fixture 入力

| fixture | note_type | payload | 期待 diff |
| --- | --- | --- | --- |
| TEST-NOTE-V01 | visibility_request | `{ desiredState: "hidden" }` | before「公開」→ after「非公開」/ kind=visibility |
| TEST-NOTE-V02 | visibility_request | `{ desiredState: "public" }` | before「非公開」→ after「公開」/ kind=visibility |
| TEST-NOTE-D01 | delete_request | （なし） | before「在籍」→ after「退会（論理削除）」/ kind=delete |

> V01/V02 の before 値は `memberSummary.publishState` で与える（V01: publishState=`public`、V02: publishState=`hidden`）。component spec では `RequestQueueItem` の `memberSummary.publishState` / `requestedPayload.desiredState` を fixture で設定する。

## 4. 既存 3 spec 追従範囲

| spec | 行数 | 追従内容 |
| --- | --- | --- |
| RequestQueueDetail.spec.tsx | 137 | diff 行（V01/V02/D01）assertion 追加。既存の会員/種別表示 assertion は green 維持 |
| RequestQueuePanel.component.spec.tsx | 141 | `destructiveMessage` の visibility 具体文言 / delete 退会文言 assertion 追加 |
| RequestConfirmDialog.spec.tsx | 194 | 92 行表示条件緩和（`destructiveMessage` 単独表示）の追従。`isDestructive=false` でも文言が表示される assertion へ更新 |

## 5. vitest 対象限定コマンド（既知の罠）

repo ルートが vitest root のため、フルパス指定 + `--root=. --config=vitest.config.ts` が必要（`_shared-context.md` §9）。

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/admin/__tests__/RequestQueueDetail.spec.tsx \
  apps/web/src/components/admin/__tests__/RequestConfirmDialog.spec.tsx \
  apps/web/src/components/admin/__tests__/RequestQueuePanel.component.spec.tsx
```

## 6. Red 宣言

本 Phase 時点では diff 表示・helper（`formatPublishStateLabel` / `buildPublishStateDiff`）・`destructiveMessage` 具体化・92 行緩和がいずれも未実装のため、TC-01〜TC-12（test-plan.md）は全て fail（Red）であることが正常。Phase 5 実装で全 TC を Green 化する。

## 7. AC マップ確認

全 TC が AC-1〜AC-10 のいずれかにマップされる（詳細は test-plan.md / Phase 7 ac-matrix.md）。正常系は Phase 4、異常系・境界値は Phase 6（TC-E-XX）で責務分担する。
