# Phase 8: Refactor

**[実装区分: 実装仕様書]**
**Workflow**: step-07-requests-approve-reject
**前提 Phase**: phase-7-coverage
**次 Phase**: phase-9-qa

## 目的

`RequestQueuePanel.tsx` の hook 統合により発生する state 削減ポイントを明示し、refactor 後の構造を確定する。新規 component (`RequestQueueDetail` / `RequestConfirmDialog`) は phase-5 で純粋に追加するため refactor は不要。

## 観点

### 1. state 削減

旧 `RequestQueuePanel` で個別に保持していたとされる以下 state を統合する:

| 旧 state | 統合先 |
|---|---|
| `approveDialogOpen` (boolean) | `useConfirmDialog.kind === 'approve'` |
| `rejectDialogOpen` (boolean) | `useConfirmDialog.kind === 'reject'` |
| `targetItem` (RequestQueueItem) | `useConfirmDialog.target` |
| `note` (string) | `useConfirmDialog.note` |
| `noteError` (string) | `useConfirmDialog.error` |
| `submitting` (boolean) | `useAdminMutation.isPending` |
| `mutationError` | `useAdminMutation.error` |

### 2. mutation 統合

旧 fetch 直接呼び出し / `useEffect` を `useAdminMutation` の `mutate(noteId, body)` 1 行に置換。

### 3. callback 整理

- `handleApproveClick(item)` → `confirm.open({ kind: 'approve', target: item })`
- `handleRejectClick(item)` → `confirm.open({ kind: 'reject', target: item })`
- `handleDialogSubmit(note)` → `mutation.trigger({ noteId: target.noteId, resolution: confirm.kind, resolutionNote: note })`

### 4. 抽出 / インライン化判断

| 項目 | 判断 |
|---|---|
| 200/404/409/422 ハンドラ map | inline で十分（panel 1 箇所のみ使用） |
| label map (`visibility_request` / `delete_request`) | `RequestQueueDetail` 内 local const に閉じる |
| isDestructive 判定 | inline 三項演算で十分 |

## 確認ポイント

- `RequestQueuePanel.tsx` の useState 行数が削減されていること（hook 統合前後を grep diff）。
- legacy `@/lib/useAdminMutation` import が残っていないこと（CLAUDE.md 不変条件 10）。
- `process.env.*` 直接参照、HEX 直書きが無いこと。

## ローカル検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm test apps/web --run -- RequestQueuePanel.component.spec.tsx
```

## 完了条件

refactor 後も phase-6 で定義した全 27 case が green を維持する。
