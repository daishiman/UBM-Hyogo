# Phase 11 Manual Test / Screenshot Coverage

## テストケース

| TC-ID | 対象状態 | 期待証跡 |
| --- | --- | --- |
| TC-VIS-01 | merge 確認 2/2 | `outputs/phase-11/screenshots/identity-conflict-row-merge-final.png` |
| TC-VIS-02 | optimistic removed | `outputs/phase-11/screenshots/identity-conflict-row-optimistic-removed.png` |
| TC-VIS-03 | rollback error | `outputs/phase-11/screenshots/identity-conflict-row-rollback-error.png` |

## 画面カバレッジマトリクス

| TC-ID | 画面状態 | スクリーンショット |
| --- | --- | --- |
| TC-VIS-01 | merge 理由 textarea + merge 実行ボタンが表示される | `outputs/phase-11/screenshots/identity-conflict-row-merge-final.png` |
| TC-VIS-02 | merge 実行直後に対象 row が一覧から消える | `outputs/phase-11/screenshots/identity-conflict-row-optimistic-removed.png` |
| TC-VIS-03 | server error 後に row が復元し inline alert が表示される | `outputs/phase-11/screenshots/identity-conflict-row-rollback-error.png` |
