# Phase 12 — Unassigned Task Detection

## 検出された follow-up candidate

本ワークフロー実装後に残る横展開タスク:

| ID 候補 | 内容 | 推奨実施時期 |
|---|---|---|
| issue-769-followup-003 (既存 spec あり) | `/admin/error.tsx` への h1 自動 focus / aria-live / digest / logger 横展開 | **本 workflow で consumed** |
| integration-fixes-i05 / Issue #768 残差 | `/login/error.tsx` の同等横展開 | **本 workflow で error focus 部分を追加回収** |
| issue-769-followup-001 (既存 spec あり) | `useAutoFocusOnMount(ref, { preventScroll })` 共通 hook 抽出 | **本 workflow で consumed** |

## 既存 followup spec の状態確認

- `issue-769-followup-001-use-auto-focus-on-mount-hook.md`: consumed。本ワークフローで hook 抽出済み
- `issue-769-followup-002-profile-error-focus-transfer.md`: consumed。本ワークフロー `docs/30-workflows/completed-tasks/issue-800-profile-error-focus-transfer/` で実装完了
- `issue-769-followup-003-admin-error-focus-transfer.md`: consumed。本ワークフローで admin error boundary を横展開済み

## 横展開ポリシー記録

- root + profile + login + admin の 4 箇所に増えたため、`useAutoFocusOnMount(ref)` 抽出を実施済み
- error boundary DoD チェックリスト（ref / useEffect / tabIndex / preventScroll / aria-live / digest / logger）を error.tsx 追加時 spec template に組み込むことを推奨
