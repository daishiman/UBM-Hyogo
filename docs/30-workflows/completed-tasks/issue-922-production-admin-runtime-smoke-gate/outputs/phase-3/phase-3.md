# Phase 3: 設計レビュー

## 目的

Phase 4（テスト作成）へ進めるかを判定する。設計の矛盾・依存・責務境界を検証する。

## レビュー観点と判定

| 観点 | 判定 | 根拠 |
| ---- | ---- | ---- |
| 責務境界 | PASS | env-aware は runner shell 関数 `resolve_env_vars()` と mint helper `resolveEnvPrefix()` に閉じる。job は staging job と構造同型 |
| 依存関係 | PASS | `admin-runtime-smoke-production` は `needs: deploy-production`。deploy 失敗時は gate を実行しない正しい順序 |
| 状態所有権 | PASS | production secret は `production-runtime-smoke` Environment に隔離。staging secret と分離 |
| 既存 API surface 不変 | PASS | 新 endpoint なし。`/admin`（既存 route）のみ叩く |
| env 不変条件 | PASS | wrangler 直叩きなし（cf.sh 経由）。token 値は GITHUB_OUTPUT のみ。step-scoped env で leak surface 最小化 |
| 再利用優先 | PASS | runner / mint / job 全てを `extend` モードで再利用。新規 primitive ゼロ |
| 後方互換 | PASS | env 引数省略時は `staging` 既定（mint helper 同様）。staging gate の挙動を変えない |

## 未解決リスクと対応方針

| リスク | 深刻度 | 対応 |
| ------ | ------ | ---- |
| R1: production secret が `production-runtime-smoke` Environment に未投入 | 高 | AC-6 graceful skip（prereq step で missing なら notice + skip）で `main` push をブロックしない |
| R2: production target allowlist regex が緩く誤接続 | 中 | `assert_target` で production 専用の regex（`workers.dev` 限定 + worker name 含む）にする |
| R3: production cookie が誤って staging で再利用される | 中 | env=staging のとき `PRODUCTION_*` を読まない、env=production のとき `STAGING_*` を読まない strict routing を test で固定 |
| R4: 意図的 throw regression evidence の取得で本番影響 | 高 | user 明示承認後、深夜帯に 1 回限り deploy → revert。Slack incident 通知前提 |
| R5: main required status check 追加で既存 PR が block される | 中 | user 明示承認後に既存 PR drain を確認してから PUT |

## 判定

**Phase 4 へ進行可**: 全観点 PASS。R1〜R5 はいずれも user-gated boundary で吸収する設計。

## 4条件評価

| 条件 | 判定 | 根拠 |
| ---- | ---- | ---- |
| 価値性 | PASS | production deploy ごとの admin render regression 自動検出（staging gate と対称） |
| 実現性 | PASS | 既存 staging gate を `extend` で再利用、追加コードは薄い env-aware 分岐のみ |
| 整合性 | PASS | cf.sh 経由 / redaction / env 不変条件 / CLAUDE.md production-runtime-smoke 設計と矛盾なし |
| 運用性 | PASS | artifact + Slack + 3-state verdict + main required status check で監査可能 |
