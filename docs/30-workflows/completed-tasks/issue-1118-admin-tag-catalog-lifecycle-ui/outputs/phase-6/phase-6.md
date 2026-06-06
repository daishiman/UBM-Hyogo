# Phase 6: テスト拡充（fail path / 回帰 guard）

`[実装区分: 実装仕様書]` / status: `completed`

Phase 4（基本ケース）を Green 化した実装に対し、**失敗経路（fail path）の state 復帰・キャンセル・network error・filter 切替** を追加で固定し、**既存資産の非退化（AC-5）** を回帰 guard で保証する。追加テストは Phase 4 と同じ 3 ファイルに describe を足す形でよい（新規ファイルは作らない）。

## 6.1 追加 fail path / 復帰系（`TagCatalogPanel.component.spec.tsx` 追記）

| # | describe / it | 操作 | 期待値 | AC |
|---|---------------|------|--------|----|
| P-10 | 409 直後に別操作が可能（state 復帰） | physical confirm → 409 で `tag_has_references inline error` 表示 → 同一行で別の操作（例 logical_delete）を click | `pendingTagId` が null に戻っており 2 回目の操作で `triggerMock` が再度呼ばれる（lock が解放済み）。`finally` の `setPendingTagId(null)` を検証 | AC-3, AC-5 |
| P-11 | ConfirmDialog cancel → idle 復帰 | physical の「完全に削除」click で dialog open → dialog の「キャンセル」click | `triggerMock` が **呼ばれない**。`role="dialog"` が DOM から消える（`confirmTarget` が null）。`pendingTagId` も null のまま | AC-2 |
| P-12 | network error → toast（非 FetchAuthedError） | `triggerMock.mockRejectedValueOnce(new Error("network down"))` で reactivate | 行 error が `kind:"other"` 相当で表示される（または toast 経路）。`refreshMock` は呼ばれない。`pendingTagId` は null へ復帰（後続操作可） | AC-1 |
| P-13 | 409 後に同行の error が次操作開始でクリアされる | P-10 の 2 回目操作開始時 | 2 回目の `runMutation` 冒頭で `rowErrors.delete(tagId)` され、前回の「N人に使用中」が一旦消える | AC-3 |
| P-14 | filter=active で inactive 行が非表示 | `initial` に active 行 + inactive 行。「有効のみ」filter ボタン click | inactive 行の label が DOM から消え、active 行のみ残る。「すべて」に戻すと両方表示 | AC-0 |
| P-15 | filter=inactive で active 行が非表示 | 同上で「停止中のみ」click | active 行が消え inactive 行のみ。filter は internal state 切替で `router.push` を**呼ばない**（list は手元データ） | AC-0 |
| P-16 | 404 後の refresh は 1 回だけ | logical_delete → 404。`refreshMock` の呼び出し回数 | `refreshMock` が 1 回（重複 refresh しない） | AC-7 |

### P-11（cancel 復帰）の骨格

```typescript
it("P-11: ConfirmDialog cancel で mutation 未呼出・dialog が閉じる", () => {
  render(<TagCatalogPanel initial={{ total: 1, items: [item({ active: true })] }} />);
  fireEvent.click(screen.getByRole("button", { name: /完全に削除/ }));
  expect(screen.getByRole("dialog")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: /キャンセル/ }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(triggerMock).not.toHaveBeenCalled();
});
```

### P-14（filter）の骨格

```typescript
it("P-14: 有効のみ filter で inactive 行が消える", () => {
  render(<TagCatalogPanel initial={{ total: 2, items: [
    item({ tagId: "t_a", label: "有効タグ", active: true }),
    item({ tagId: "t_b", label: "停止タグ", active: false }),
  ] }} />);
  fireEvent.click(screen.getByRole("button", { name: /有効のみ/ }));
  expect(screen.queryByText("停止タグ")).toBeNull();
  expect(screen.getByText("有効タグ")).toBeTruthy();
  expect(pushMock).not.toHaveBeenCalled();
});
```

## 6.2 row 側の fail path 追記（`TagCatalogRow.component.spec.tsx`）

| # | describe / it | prop | 期待値 | AC |
|---|---------------|------|--------|----|
| R-11 | not_found error の表示 | `error={{kind:"not_found"}}` | 「既に削除済み」相当の文言が `role="status"` で出る | AC-7 |
| R-12 | other error の表示 | `error={{kind:"other", message:"通信失敗"}}` | message がそのまま表示される | AC-1 |
| R-13 | pending 中も label/code は表示維持 | `pending={true}` | 操作は disabled だが行の label/code/category は描画され続ける（行が消えない） | AC-5 |

## 6.3 回帰 guard（AC-5 非退化）

新規 route は additive であり、既存資産に触れないことを **既存テストの維持** で保証する。本タスクで以下が **壊れないこと** を必須条件とする。

| 回帰対象 | テスト | 確認内容 |
|----------|--------|----------|
| `TagQueuePanel`（既存 /admin/tags キュー画面） | `apps/web/src/components/admin/__tests__/TagQueuePanel.component.spec.tsx` | 全 pass を維持。catalog 追加で queue 画面の DOM / router 配線が変わらない |
| `shell-config`（nav 定義） | `apps/web/src/components/shell/__tests__/shell-config.spec.ts` | nav 項目追加で active 判定・既存項目の順序/href が壊れない。`/admin/tags` と `/admin/tags/catalog` の active 判定が混線しないことを確認（必要なら shell-config.spec に 1 ケース追加） |
| `apps/api` tags contract | `apps/api/.../tags.contract.spec.ts`（reactivate / delete / physical / 409 referenceCount の contract） | **UI 側変更で API は不変**（#1）。本タスクは endpoint 消費のみのため API テストは無変更で pass し続ける |
| `ConfirmDialog` | `apps/web/src/components/ui/__tests__/ConfirmDialog.spec.tsx` | 再利用のみ。ConfirmDialog 自体に変更を入れない（props で制御） |

> **non-regression の検証手順**: catalog 実装後に既存 admin component テスト全体（`src/components/admin`）と shell テストを走らせ、追加前と同数以上の pass を確認する。既存 spec の編集は原則しない（shell-config の active 判定追加 1 ケースを除く）。

## 6.4 aria / responsive（AC-8）の最小固定

| # | describe / it | 期待値 | AC |
|---|---------------|--------|----|
| A-1 | physical confirm dialog の aria | `role="dialog"` `aria-modal="true"` が付く（ConfirmDialog 既存実装の再利用で担保） | AC-2, AC-8 |
| A-2 | 操作ボタンの aria-label | 「完全に削除」ボタンの aria-label に tag label を含む（R-10 と重複可・回帰固定） | AC-8 |
| A-3 | 409 メッセージの読み上げ | tag_has_references inline error メッセージが `role="status"`（live region）で出る | AC-3, AC-8 |

> desktop/mobile のレイアウト崩れ（CSS sticky / 縦積み）は jsdom で検証不能のため、**component test では DOM 構造（行/操作ボタンの存在・aria）まで**を固定し、視覚的な responsive 確認は Phase 9（design-token gate）/ Phase 11（手動 / playwright visual・user-gated）に委譲する。

## 6.5 検証コマンド（Phase 6 完了判定）

```bash
# 本タスク追加 + 拡充テスト（catalog 3 本）
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/admin

# 回帰 guard（既存 admin component + shell）
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/admin src/components/shell

# API 不変（contract が無変更で pass）
mise exec -- pnpm --filter @ubm-hyogo/api test --run tags

# 型・lint・token gate
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

すべて Green で Phase 6 完了。Phase 7 以降（統合・design-token gate・evidence）へ進む。
