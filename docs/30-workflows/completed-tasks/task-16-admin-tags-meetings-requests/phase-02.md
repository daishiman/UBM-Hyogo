# Phase 2: ドメイン分析

> 改訂日: 2026-05-10
> 状態: `completed`

## 1. 用語と状態

| 用語 | 正本 |
| --- | --- |
| Tag Queue | `queued / reviewing / resolved / rejected / dlq` |
| Tag resolve | `{ action: "confirmed", tagCodes: string[] }` または `{ action: "rejected", reason: string }` |
| Meeting | `sessionId / title / heldOn / note / attendance` |
| Meeting mutation | create/update/soft delete は `title / heldOn / note / deletedAt` |
| Request type | `visibility_request / delete_request` |
| Request status | `pending / resolved / rejected` |
| Request resolve | `{ resolution: "approve" | "reject", resolutionNote?: string }` |

## 2. 不変条件

- `decision / approved / /decision` という旧語彙は使わない。
- `accept / reject` は人間向け説明語に限定し、API body には使わない。
- request list query は `type=visibility_request|delete_request` を使う。
- tags / requests は bulk action を持たない。
- web は D1 に直接触らない。

## 3. 4条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | API body / status / endpoint を現行実装へ統一 |
| 漏れなし | PASS | meetings attendance / CSV export link absence / request type / tagCodes を反映 |
| 整合性あり | PASS | route と component placement を現行 tree に統一 |
| 依存関係整合 | PASS | task-15 layout と task-18 visual smoke 境界を明示 |
