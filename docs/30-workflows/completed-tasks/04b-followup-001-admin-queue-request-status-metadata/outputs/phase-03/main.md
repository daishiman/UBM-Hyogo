# Phase 3: 設計レビュー

## Alternatives 評価

| # | 案 | 採否 | 根拠 |
| --- | --- | --- | --- |
| A | 列追加 + repository guard | **採用** | SQLite ALTER で実装単純 / 後方互換 / partial index で性能担保 |
| B | CHECK 制約付きで列追加 | 却下 | SQLite で ALTER TABLE 後付け CHECK は非対応。テーブル再作成は運用コスト高 |
| C | `admin_member_request_queue` 別テーブル分離 | 却下 | 移行コスト + 既存 04b ルート / 04c ルート / 02c builder の共存設計を破壊。DRY 維持の観点で却下 |

## 不変条件チェック

- #4: `member_responses` / `response_fields` 不可侵 — migration / repository ともに `admin_member_notes` のみ操作
- #5: D1 アクセスは `apps/api` 配下のみ — apps/web に伝播しない
- #11: 管理者は member 本文を直接編集しない — `markResolved` / `markRejected` は `admin_member_notes` のみを更新

## 結論

採用案の構造（列追加 + pending guard + partial index）で Phase 4 へ進む。
