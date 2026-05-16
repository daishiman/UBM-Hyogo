# Phase 1 Requirements

## Summary

parallel-09 は 19 routes 横断の UX primitive 契約を固定する implementation spec である。本 wave は実コードを変更せず、後続実装 wave の入力正本を作成する。

## Decisions

| 論点 | 採用 |
| --- | --- |
| primitive 統一 | `apps/web/src/components/ui/` と `apps/web/src/components/admin/` に共通 primitive を集約 |
| EmptyState 互換 | children-only 既存 API を維持し optional props を追加 |
| `@layer components` 競合 | parallel-03 / parallel-09 の section コメントで物理分離 |
| token 整合 | 新規 token 追加禁止。既存 OKLch token のみ参照 |

## Four Conditions

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | completed | 本 wave は implemented_local_runtime_pending として実コード実装済み、visual evidence ENOSPC pending 境界を明示 |
| 漏れなし | completed | AC-1〜AC-10 と Phase 1-13 を接続 |
| 整合性あり | completed | taskType / visualEvidence / workflow_state を artifacts と index で統一 |
| 依存関係整合 | completed | parallel-03、task-09/10/18、parallel-01〜08 との境界を明記 |
