# Phase 11 output: visual baseline

[実装区分: 実装仕様書]

## 状態

`PENDING_USER_GATE` — Playwright `--update-snapshots` 実行 + user 確認後に実 screenshot を配置する。

## 対象 screen / variant

| screen | variant | 期待 path |
| --- | --- | --- |
| HistoryPane (resolved 3 件) | desktop-light | apps/web/playwright/__screenshots__/admin-schema-rollback/history-pane-desktop-light.png |
| HistoryPane | desktop-dark | (同上 desktop-dark) |
| HistoryPane | mobile-light | (同上 mobile-light) |
| HistoryPane | mobile-dark | (同上 mobile-dark) |
| RollbackConfirmModal | 4 variants | apps/web/playwright/__screenshots__/admin-schema-rollback/confirm-modal-*.png |
| UndoToast | 4 variants | apps/web/playwright/__screenshots__/admin-schema-rollback/undo-toast-*.png |

## 取得手順

```bash
mise exec -- pnpm --filter @ubm/web playwright test \
  --grep "SchemaDiffPanel.*rollback" \
  --update-snapshots
```

## CI 整合

- `task-18 visual-full` required check に新 baseline が反映されることを確認
- baseline diff threshold 既定値（pixel diff < 0.1%）を維持
