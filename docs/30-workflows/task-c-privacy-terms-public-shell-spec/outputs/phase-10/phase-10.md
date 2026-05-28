# Phase 10 — 最終レビュー

## 1. レビューサマリ

| 観点 | 判定 |
|------|------|
| 親仕様 `task-c-privacy-terms-public-shell.md` の全項目反映 | OK（変更対象 / パターン / metadata 維持 / テスト / DoD すべて Phase 1-9 に分解） |
| CONST_004（実装区分） | 実装仕様書として作成、根拠を index.md に記載 |
| CONST_005（必須項目） | 変更対象 / シグネチャ / 入出力 / テスト / 実行コマンド / DoD すべて記載 |
| CONST_007（1 cycle 完結） | 編集 4 file の単一サイクル。先送り無し |
| 親ワークフロー DoD との整合 | `data-auth-state` / `data-testid="public-shell"` / metadata 保持 / spec green を継承 |
| 不変条件遵守 | OKLch token / `process.env` 禁止 / test suffix / `apps/web` D1 boundary 全て準拠 |
| 依存（Task A） | Phase 5 冒頭で前提確認 step を明示 |

## 2. 残課題

- `PublicShell` primitive 抽出は本 Task では扱わない（Phase 8 で判定済、Task D/E/F 完了後に followup 評価）
- 親ワークフロー全体での visual baseline 更新は Task A 完了後にまとめて実施（本 Task はその一部として `/privacy`, `/terms` の shell mount を担保）

## 3. 承認

- 最終レビュー結果: **approved for implementation**
- 次フェーズ: Phase 11 手動テスト
