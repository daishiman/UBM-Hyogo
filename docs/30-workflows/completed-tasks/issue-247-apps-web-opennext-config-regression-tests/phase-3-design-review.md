# Phase 3 — 設計レビュー

`[実装区分: 実装仕様書]`
workflow_state: `implemented_local_evidence_captured`

## 1. 設計の根拠

- vitest 既存パイプラインに自動的に乗るため独立ビルドが不要
- 単一ファイルなので diff レビュー負荷が最小
- TOML 検証は対象ファイルの section / scalar / string-array に限定した test-local parser で行い、追加依存を増やさない

## 2. 代替案と却下理由

| 案 | 採否 | 理由 |
|----|------|------|
| **A. 単一 spec 統合（採用）** | ◯ | 5 AC が同一文書脈絡。テスト本体も短く分割の利得が薄い |
| B. wrangler.toml / package.json / .assetsignore で 3 ファイル分割 | × | 4 assertion で 3 spec 配置はオーバーヘッド過多 |
| C. shell スクリプト + grep | × | TOML の nested key 検証が脆弱、msg も読みづらい |
| D. 専用 GitHub Actions ジョブ追加 | × | matrix / Node setup の重複コストが大、既存 web test に同居が最短 |

## 3. リスクと対策

| リスク | 対策 |
|--------|------|
| TOML parser の過剰化 | 対象 `wrangler.toml` の限定構文だけを読む test-local parser に閉じ、lockfile churn と supply-chain 面を抑える |
| `apps/web/__tests__` 既存 spec との実行モード差 | 既に `middleware.spec.ts` が同 dir 配下で稼働。同じ vitest config が適用される想定 |
| CI duplicate run | 既存 job が `__tests__/*.spec.ts` を集約実行する場合、明示 step は冗長 → step を省略し job 一覧で可視化のみに留める |

## 4. レビュー観点

- AC ↔ it ブロックの 1:1 対応
- assert メッセージが「どの不変条件が破れたか」を即座に示すか
- パスは repoRoot 相対で安定しているか

## 5. DoD

- 採用案が単一統合 spec であることを記録
- 代替案 3 件の却下理由が明示されている
