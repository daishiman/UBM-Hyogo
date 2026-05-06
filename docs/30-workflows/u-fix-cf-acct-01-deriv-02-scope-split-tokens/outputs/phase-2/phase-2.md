# Phase 2: 設計

## メタ情報
| 項目 | 値 |
| --- | --- |
| Phase | 2 / 13 |
| 作成日 | 2026-05-06 |

## Token Scope マトリクス

| Token 名 | 環境 | scope（最小） | 備考 |
| --- | --- | --- | --- |
| `CF_TOKEN_WORKERS_STAGING` | staging | `Workers Scripts:Edit`, `Account Settings:Read` | `apps/api` + `apps/web` の Workers deploy 用 |
| `CF_TOKEN_WORKERS_PRODUCTION` | production | 同上 | 同上 |
| `CF_TOKEN_D1_STAGING` | staging | `D1:Edit`, `Account Settings:Read` | migrations apply / export 用 |
| `CF_TOKEN_D1_PRODUCTION` | production | 同上 | 同上 |
| `CF_TOKEN_PAGES_STAGING` | staging | `Cloudflare Pages:Edit`, `Account Settings:Read` | Pages deploy 用（将来利用） |
| `CF_TOKEN_PAGES_PRODUCTION` | production | 同上 | 同上 |

> `Account Settings:Read` は wrangler の account 検証で要求されるため全 Token に付与（MVP 方針）。後段で verification step を別 Token 化する選択肢は DERIV-04 で再評価する。

## GitHub Secrets / Variables 命名規約

| 種別 | 規約 | 例 |
| --- | --- | --- |
| Secrets | `CF_TOKEN_<SCOPE>_<ENV>` | `CF_TOKEN_WORKERS_STAGING` |
| Variables | `CLOUDFLARE_ACCOUNT_ID` は据え置き（共通） | — |

## 現行 workflow token 参照分割設計

```yaml
backend-ci.yml:
  deploy-staging:
    Apply D1 migrations: apiToken=${{ secrets.CF_TOKEN_D1_STAGING }}
    Deploy Workers app:  apiToken=${{ secrets.CF_TOKEN_WORKERS_STAGING }}
  deploy-production:
    Apply D1 migrations: apiToken=${{ secrets.CF_TOKEN_D1_PRODUCTION }}
    Deploy Workers app:  apiToken=${{ secrets.CF_TOKEN_WORKERS_PRODUCTION }}

web-cd.yml:
  deploy-staging:
    Deploy web app to Cloudflare Pages: apiToken=${{ secrets.CF_TOKEN_PAGES_STAGING }}
  deploy-production:
    Deploy web app to Cloudflare Pages: apiToken=${{ secrets.CF_TOKEN_PAGES_PRODUCTION }}
```

現行 repo には `deploy-staging.yml` / `deploy-production.yml` は存在しない。新規 workflow を増やさず、既存の `backend-ci.yml` と `web-cd.yml` の step ごとに token を分ける。

## scripts/cf.sh 改修方針

現状: `op run --env-file=.env` で `CLOUDFLARE_API_TOKEN` を 1Password から動的注入。
変更: GHA 実行時は環境変数 `CLOUDFLARE_API_TOKEN` がすでに job env で注入されているため、`op run` の前段で `${CLOUDFLARE_API_TOKEN:+SET}` を検出し、設定済みなら `op run` を skip する分岐を追加する。

ローカル実行は従来通り 1Password 経由（変更なし）。

## rollback 設計

各 Token の rollback は独立。例: D1 migration が失敗しても Workers Token は無関係。
- D1 rollback: `bash scripts/cf.sh d1 export` で取得済みのバックアップを `import` で復旧（`CF_TOKEN_D1_<ENV>` のみ必要）
- Workers rollback: `bash scripts/cf.sh rollback <VERSION_ID>`（`CF_TOKEN_WORKERS_<ENV>` のみ必要）
- Pages rollback: 将来定義

## 成果物

- `outputs/phase-2/phase-2.md`
- `outputs/phase-2/workflow-job-split-design.md`
- `outputs/phase-2/cf-sh-refactor-plan.md`
