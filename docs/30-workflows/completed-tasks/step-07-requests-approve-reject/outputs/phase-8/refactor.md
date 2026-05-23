# Phase 8 リファクタリング

## 適用 refactor

- RequestQueuePanel の state を 7 → 3 個に圧縮:
  - 削除: `confirming` / `resolutionNote` / `validationError` / `busy`（hook + dialog に移譲）
  - 維持: `items` / `selectedId` / `toast`
- detail 描画は `RequestQueueDetail` に切り出し（presentational pure）
- dialog 描画は `RequestConfirmDialog` に切り出し（HTML5 `<dialog>` + FormField）
- `useAdminMutation` 経由化を維持（CLAUDE.md 不変条件 #10 / primitive-adoption test green）
- 409 / 404 分岐を共通 catch 経路に明示化、その他 status は generic toast

## 削減

| 指標 | before | after |
|---|---|---|
| RequestQueuePanel.tsx LOC | 313 | 約 220（detail+dialog 切出 + state 圧縮） |
| Panel が持つ useState | 7 | 3 |
