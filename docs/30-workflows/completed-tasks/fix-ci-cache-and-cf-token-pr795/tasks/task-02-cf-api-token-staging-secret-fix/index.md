# task-02-cf-api-token-staging-secret-fix

## 実装区分

**[実装区分: 実装仕様書]**

## タイトル

`backend-ci.yml` deploy-staging job の `CLOUDFLARE_API_TOKEN` 未注入エラー解消

## 目的

PR #795 マージ後も継続して fail している `backend-ci.yml` / `deploy-staging` job を green に復旧する。
`wrangler-action@v3` が `CLOUDFLARE_API_TOKEN environment variable` 必須エラーで exit 1 する事象を、
GitHub Actions 側の secret 登録整備 (B1) と YAML 側の step-level env 併用 (B2) の両輪で解消する。B2 は同じ scoped secret の action 互換注入であり、secret 未登録時の独立 fallback ではない。

## 真の論点

- staging 環境への自動デプロイ lane が常時 red で機能停止している
- 因果は (a) `staging` environment 配下に `CF_TOKEN_D1_STAGING` / `CF_TOKEN_WORKERS_STAGING` が未登録 もしくは rotation 後に名前不一致、(b) `wrangler-action` / internal wrangler の token 読み取り口を `with.apiToken` のみに寄せていた — の 2 経路
- YAML 修正単独でも、secret 登録単独でも解決しない。両方を 1 サイクルで行う

## DoD (Definition of Done)

| ID  | 条件 | 検証方法 |
| --- | ---- | -------- |
| AC-1 | `backend-ci.yml` の `Apply D1 migrations` step が success exit | `gh run view <run-id> --log` で `Resource location: remote` 後にエラーなし |
| AC-2 | `Deploy Workers app` step が success exit | 同上 |
| AC-3 | `CLOUDFLARE_API_TOKEN environment variable` エラーがログから消失 | `gh run view --log` grep 0 件 |
| AC-4 | actionlint clean | `actionlint .github/workflows/backend-ci.yml` exit 0 |
| AC-5 | `staging` environment に必要 secret 2 件が存在 | `gh secret list --env staging --repo daishiman/UBM-Hyogo` で 2 件確認 |
| AC-6 | 実 token 値がコミット / ドキュメント / ログに出現しない | `git diff` と仕様書本文の grep 確認 |

## 変更ファイル一覧

| Path | 種別 | 行数 (目安) |
| ---- | ---- | --------- |
| `.github/workflows/backend-ci.yml` | 編集 | +12 (staging / production 4 step × `env:` block 3 行) |
| `scripts/__tests__/workflow-env-scope.test.sh` | 編集 | backend-ci `with.apiToken` + step-level env exact-token assertion |

## 必要 GitHub Secret 一覧

| Secret 名 | scope | 1Password 参照 path |
| --------- | ----- | ------------------ |
| `CF_TOKEN_D1_STAGING` | environment `staging` | `op://Cloudflare/UBM-Hyogo-D1-Staging/token` |
| `CF_TOKEN_WORKERS_STAGING` | environment `staging` | `op://Cloudflare/UBM-Hyogo-Workers-Staging/token` |
| `CF_TOKEN_D1_PRODUCTION` | environment `production` | operator-only |
| `CF_TOKEN_WORKERS_PRODUCTION` | environment `production` | operator-only |

> secret 登録は **ユーザー承認後** に Phase 5 手順に従って実施する。Claude Code 自身は値を読み取らない。

## Phase テーブル

| Phase | 内容 | status |
| ----- | ---- | ------ |
| 1 | 要件定義 | completed (workflow root で完了) |
| 2 | 設計 | completed (workflow root で完了、本タスクは採用設計 B1+B2 を継承) |
| 3 | 設計レビュー | completed (workflow root で完了) |
| 4 | テスト方針 | completed |
| 5 | 実装手順 | completed |
| 6 | テスト拡充 | completed |
| 7 | カバレッジ確認 | completed |
| 8 | リファクタリング | completed |
| 9 | 品質保証 | completed |
| 10 | 最終レビュー | completed |
| 11 | 手動テスト (NON_VISUAL) | runtime_pending |
| 12 | ドキュメント | completed |
| 13 | PR 作成 | blocked |

## タスク分類

- **task type**: NON_VISUAL (CI infra 修正、UI なし)
- **implementation_mode**: new
- **Phase 11 evidence**: スクリーンショット不要。CLI 出力ログで代替

## 不変条件

1. `deploy-production` job も同 cycle で横展開し、D1 / Workers step に同じ scoped-token env 併用を適用済み
2. `wrangler-action@v3` の `wranglerVersion: 4.85.0` を維持
3. `actions/setup-node@v4` / `pnpm/action-setup@v4` の指定を破壊しない
4. 他 job (`runtime-smoke-staging`) のトリガ条件 (`needs: [deploy-staging]`) に影響を出さない
5. CLAUDE.md §シークレット管理: 実 token 値を YAML / docs / log / コメントに転記しない
