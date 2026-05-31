# Phase 11 — UI Sanity / Visual Review

## VISUAL_ON_EXECUTION 宣言

- **タスク種別**: 実装タスク（production rollout / bugfix close-out）。
- **視覚的理由**: UI コンポーネント変更はなし（`wrangler.toml` flag 1 行）。ただし根本問題の証明に `/members` の表示復旧 screenshot が必要。
- **代替/取得時期**: screenshot は staging/production の user-gated runtime 実行時に取得（Gate-C）。local 実装検証段階では `manual-test-result.md` のローカル回帰結果と Phase 10 を主証跡とする。
