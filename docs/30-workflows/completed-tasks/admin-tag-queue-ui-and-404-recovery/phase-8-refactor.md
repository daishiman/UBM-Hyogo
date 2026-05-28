# Phase 8: Refactor

## 対象

実装後に明らかに重複や読みづらさが残った場合のみ、以下を最小限で整理する。新規ファイル / 新規 primitive は作らない。

| 対象 | 検討内容 |
|------|---------|
| `TagQueuePanel.tsx` 内のサブコンポーネント | `QueueItemCard` / `ReviewPanel` を同ファイル内 inline 関数として抽出（export しない） |
| 集計派生 (`queued / resolved / dlq`) | `page.tsx` 側でまとめて算出し props として `PageHead` に渡す形を維持 |
| HEX 直書きチェック | grep で 0 件を確認 |

## やらないこと

- 既存 `apps/web/src/components/ui/*` への変更
- 新規 primitive 追加（既存 primitives 群を再利用）
- `apps/api` 側のリファクタ
