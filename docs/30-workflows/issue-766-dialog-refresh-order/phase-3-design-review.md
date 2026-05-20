# Phase 3: 設計レビュー

## 1. レビュー観点 / 結論

| 観点 | 結論 | 補足 |
|------|------|------|
| spec 整合 | OK | `parallel-i03-dialog-refresh-order/spec.md` の順序ルールと一致 |
| 影響範囲最小性 | OK | 編集ファイル 6 件 (実装 3 + テスト 3) で目的達成 |
| 型契約破壊 | なし | dialog props / `QueueAccepted` 型不変 |
| 既存テスト破壊 | 部分的 | 既存 spec が「parent onSubmitted で refresh」を前提にしている場合は assertion を更新する必要あり → Phase 4/6 で吸収 |
| CONST_004 (実装区分) | 実装仕様書として妥当 | コード変更必須 |
| CONST_005 (必須項目) | 充足 | 変更ファイル / シグネチャ / 入出力 / テスト / 実行コマンド / DoD 記載済み |
| CONST_007 (1 サイクル完了) | OK | 全 6 ファイルを 1 サイクルで完結。先送りなし |
| 不変条件 (CLAUDE.md) | OK | D1 直接 access なし / API endpoint 変更なし / dev base PR |
| 並列性 | 単独完結 | i01,i02,i04,i05 等と編集対象重複なし |

## 2. リスク評価

| リスク | レベル | 対策 |
|--------|--------|------|
| `router.refresh()` 二重発火 (dialog + parent) | 中 | `RequestActionPanel.onSubmitted` から refresh を撤去。Phase 6 でテストにより assert |
| `useRouter` を Server Component から呼び出すケース | 低 | dialog は `"use client"` directive あり (確認済) |
| catch 分岐で refresh が必要なケース | 低 | spec 上不要。エラー時は dialog 残置で error message を表示 |
| 既存 component spec の壊れ | 中 | Phase 4 で既存テスト確認 → Phase 6 で更新 |
| Server Component cache 整合性 | 低 | `refresh()` は schedule → React commit 後に fetch。順序固定で race 解消 |

## 3. 代替案検討

| 代替案 | 採否 | 理由 |
|--------|------|------|
| mutation hook 側で refresh をカプセル化 | 不採用 | スコープ拡大。issue 本文の「将来 followup」に記載済み |
| `onSubmitted` callback を async 化して await | 不採用 | `onSubmitted` 型変更を伴い破壊変更 |
| `useTransition` で順序保証 | 不採用 | 過剰設計。同期 schedule で十分 |

## 4. 設計承認

Phase 2 設計を確定し、Phase 4 (テスト計画) へ進む。
