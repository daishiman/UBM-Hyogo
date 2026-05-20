# Phase 08 — ドキュメント更新 / リファクタ

## ドキュメント更新対象

| ファイル | 更新内容 |
| --- | --- |
| `docs/00-getting-started-manual/specs/09-ui-ux.md` | error boundary の focus 管理は `useAutoFocusOnMount` 経由を正本とする旨を追記 |
| `docs/30-workflows/completed-tasks/issue-769-root-error-focus/outputs/phase-12/unassigned-task-detection.md` | followup candidate「useAutoFocusOnMount shared hook」を **consumed** に更新（本 workflow が起点 spec を消費） |
| `docs/30-workflows/unassigned-task/issue-769-followup-001-use-auto-focus-on-mount-hook.md` | `status: consumed` 相当の canonical marker を追記し、物理削除はしない（stale reference / audit trace 保持） |

## 仕様書 → 完了タスク移行

PR merge 後に以下をユーザー承認後に実施する。今回 cycle では active root と outputs を保持し、commit / push / PR は行わない。

```bash
git mv docs/30-workflows/issue-799-use-auto-focus-on-mount-hook \
       docs/30-workflows/completed-tasks/issue-799-use-auto-focus-on-mount-hook
```

## リファクタ要点

- hook 抽出は既存ロジックの **動作変更なし** に限定
- ロジック以外の class 名 / DOM 構造 / 文言は触らない
- `logger.error` 等 boundary 固有の責務は hook に取り込まない
