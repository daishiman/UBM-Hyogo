# Phase 11: 手動テストレポート（VISUAL / local screenshot captured）

本レポートは `manual-test-result.md` の補助。実装 wave で取得する証跡の整理先。

## 評価 3 層（Semantic / Visual / AI UX）

| 層 | 計画 | 状態 |
| --- | --- | --- |
| Semantic（role/aria/label） | `searchbox` role・`aria-label="クリア"`・`aria-describedby` が維持されること | focused unit/render で検証 |
| Visual（pixel screenshot） | local baseline / keyword-filter 2 画面 + staging real-IME 3 画面 | local 2 画面 present、real-IME は user-gated pending |
| AI UX | 日本語入力が確定でき、×が 1 箇所で迷わないこと | unit/render + local screenshot で確認。実機 IME 操作のみ user-gated |

## 既知制限

- 実機 IME 操作 + staging 認証が必要な composing/committed screenshot は user-gated。
- local screenshot は `screenshots/member-search-local-overview.png` と `screenshots/member-search-local-keyword-filter.png` に取得済み。
