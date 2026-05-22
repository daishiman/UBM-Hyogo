# Phase 8: Refactor

> 改訂日: 2026-05-10
> 状態: `completed`

## 1. Refactor rules

- 新規 shared abstraction は 2 画面以上で同じ責務が確認できた場合だけ作る。
- 既存 `src/components/ui/EmptyState.tsx` が使える場合は優先する。
- `AdminSidebar`、`app/api/admin` proxy、`apps/api` は task-16 で触らない。

## 2. Candidate table

| 対象 | 判断 |
| --- | --- |
| Empty state | 既存 `EmptyState` 使用可なら統一。単独文言差分なら保持。 |
| status tone | tags / requests で tone drift が出たら小さな map に集約。 |
| request confirmation | 破壊的 approve warning は `RequestQueuePanel` 内に閉じる。 |
| meeting form | 大きくなった場合のみ child component 抽出。 |
