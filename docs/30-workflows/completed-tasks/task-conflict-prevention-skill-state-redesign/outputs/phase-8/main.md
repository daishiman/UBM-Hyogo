# Phase 8: リファクタ — サマリー

## 位置づけ

本タスクは docs-only / NON_VISUAL のためコードリファクタは存在しない。
リファクタ対象は **仕様書群そのものの品質**、すなわち以下 3 点に限定する。

1. 仕様書間の **重複記述**（同一 schema / 同一 glob が複数 phase に散在）
2. **用語ぶれ**（ledger / fragment / runbook / entry / shard など）
3. **リンク切れ**（phase 間 / outputs 間 / artifacts.json と index.md の差異）

## 実施項目

| 項目 | 対象 | 結果 |
| --- | --- | --- |
| 用語統一 | 全 phase ファイル | 「ledger / fragment / runbook」3 語に集約 |
| AC 番号一貫性 | index.md / phase-01 / phase-07 / phase-09 | AC-1〜AC-9 の番号と文言を index.md に正本化 |
| 施策 ID 表記 | 全 phase | `A-1 / A-2 / A-3 / B-1` のハイフン区切りで統一（A1 / A_1 排除） |
| 重複記述統合 | phase-02 と phase-06 の fragment-schema | phase-02 を正本、phase-06 は参照のみに変更 |
| リンク整備 | 全 phase の「参照資料」表 | 相対パスを `outputs/phase-N/<file>.md` 形式に揃える |
| artifacts 整合 | artifacts.json × 各 phase 「成果物」表 | outputs 配列の差異 0 件 |

## 検出された不整合と対応

| # | 不整合 | 対応 phase | 対応内容 |
| --- | --- | --- | --- |
| R-01 | fragment 命名規約が phase-02 と phase-06 で 2 重記述 | phase-06 | phase-02 を正本化、phase-06 は「→ phase-02 fragment-schema.md 参照」に圧縮 |
| R-02 | 「ledger」と「共有可変ファイル」が混在 | 全 phase | 用語表（before-after.md §1）に従い「ledger」へ統一 |
| R-03 | phase-05 で `gitignore-runbook.md` を一部「ignore-runbook.md」と表記 | phase-05 | フルネームに統一 |
| R-04 | phase-07 が AC-3 / AC-4 のトレース欄を欠落 | phase-07 | AC マトリクスに追記 |
| R-05 | phase-04 の parallel-commit-sim 参照リンクが phase-11 から切れている | phase-11 | 相対パスを修正 |

## 完了状態

- [x] before-after.md 作成（用語統一表 / 重複統合 Before-After / リンク整備 Before-After）
- [x] main.md 作成（本ファイル）
- [x] artifacts.json と index.md の Phase 表突合: 差異 0
- [x] 全 phase の参照リンクが healthy
- [ ] artifacts.json の Phase 8 状態を `completed` に更新（Phase 9 進行時に実施）

## 次 Phase への引き継ぎ

- Phase 9 では本 main.md と before-after.md を入力として、AC-1〜AC-9 のトレース可否を最終チェックする
- 用語統一表 (before-after.md §1) は Phase 12 の specs 反映時にもそのまま流用可能
