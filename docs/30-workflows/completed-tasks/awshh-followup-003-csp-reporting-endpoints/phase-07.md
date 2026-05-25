# Phase 7: カバレッジ確認（AC トレースマトリクス）

## AC × テスト × evidence × 不変条件

| AC | 内容 | テスト | evidence | 不変条件 |
| --- | --- | --- | --- | --- |
| AC-1 | Reporting-Endpoints / Report-To 出力 | TC-1, TC-5 | `reporting-endpoints-curl.log` | — |
| AC-2 | report-to グループ名一致 | TC-2, TC-9 | unit test 出力 | — |
| AC-3 | report-uri 併記 | TC-3 | unit test 出力 | — |
| AC-4 | 未設定時 未出力（後方互換） | TC-4, TC-6, TC-8 | unit test 出力 | — |
| AC-5 | env は getEnv/getPublicEnv 経由のみ | typecheck + grep `process.env` 差分 0 | `env-access-grep.log` | env アクセス不変条件 |
| AC-6 | apps/api / D1 不変 | — | `apps-api-untouched.log`（`git diff --stat -- apps/api apps/api/migrations` 0 件） | #5 |
| AC-7 | privacy / retention 文書化 | — | `privacy-review.md` + runbook | — |

## カバレッジ対象 concern

- ヘッダ生成分岐（reportEndpoint 有/無 × cspMode report-only/enforce）= 2×2 = 4 経路 → TC-1〜8 で網羅。
- グループ名一致不変 = TC-9 で固定。
- env parse 経路 = env.ts 既存 schema テスト + typecheck。

## 依存エッジ

- middleware → getPublicEnv → env.ts schema → security-headers.ts。各境界は型で接続され typecheck が回帰検出する。

## 次フェーズ引き継ぎ

Phase 8 で定数集約・重複除去を行う。
