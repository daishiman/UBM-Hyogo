# Phase 3: 設計レビュー

## 目的

Phase 4（テスト作成）へ進めるかを判定する。設計の矛盾・依存・責務境界を検証する。

## レビュー観点と判定

| 観点 | 判定 | 根拠 |
| ---- | ---- | ---- |
| 責務境界 | PASS | CI orchestration（web-cd job）/ token mint（mts）/ probe+grep（sh）/ wrangler wrap（cf.sh）が分離 |
| 依存関係 | PASS | `admin-runtime-smoke` は `needs: deploy-staging`。deploy 失敗時は gate を実行しない正しい順序 |
| 状態所有権 | PASS | cookie 値は mint helper、probe 結果は runner、gate 成否は job に閉じる |
| 既存 API surface 不変 | PASS | 新 endpoint なし。`/admin`（既存 route）と既存 health のみ叩く |
| env 不変条件 | PASS | wrangler 直叩きなし（cf.sh 経由）。token 値は GITHUB_OUTPUT のみ |
| 再利用優先 | PASS | runtime-smoke-staging.yml / runtime-attendance-provider.sh を雛形化 |

## 未解決リスクと対応方針

| リスク | 深刻度 | 対応 |
| ------ | ------ | ---- |
| R1: middleware（HS256）と layout（Auth.js）の token 非対称 | 高 | Phase 1 実測で A/B 分岐確定。B の場合 `@auth/core/jwt encode` を使用。確定するまで Phase 5 実装着手しない |
| R2: `wrangler tail` が CI で常駐し job が hang | 中 | cf.sh tail wrapper に `timeout` / capture 秒数上限を設ける（Phase 5） |
| R3: deploy 直後の cold start で log が tail に乗らない | 中 | tail を先に background 起動し、probe 中の Workers log を capture する |
| R4: secret 未設定環境で gate が必ず fail し dev push をブロック | 高 | AC-8 graceful skip（`if: env.STAGING_AUTH_SECRET != ''` と同型）で回避 |
| R5: cookie/JWT が log/artifact に leak | 高 | redact.sh + redaction grep gate を runner と job 両方に適用 |

## 判定

**Phase 4 へ進行可（条件付き）**: R1（token 互換性）は Phase 1 の実測結果で A/B を確定してから Phase 5 実装に入る。Phase 4 のテスト設計は A/B 両対応で記述する。

## 4条件評価

| 条件 | 判定 | 根拠 |
| ---- | ---- | ---- |
| 価値性 | PASS | deploy ごとの admin render regression 自動検出 |
| 実現性 | PASS | 既存テンプレート再利用で初回スコープに収まる |
| 整合性 | PASS | cf.sh 経由 / redaction / env 不変条件と矛盾なし |
| 運用性 | PASS | artifact + Slack + 3-state verdict で監査可能 |
