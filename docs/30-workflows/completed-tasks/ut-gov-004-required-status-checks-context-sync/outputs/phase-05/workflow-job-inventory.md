# workflow-job-inventory.md — 実在 workflow / job 一覧（Phase 5 確定）

> 走査日: 2026-04-29
> 走査対象: `.github/workflows/*.yml` 全 5 件

| # | ファイル | top-level `name:` | job key | job `name:` | trigger | 最終 context 名 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | ci.yml | `ci` | `ci` | `ci` | push: main,dev / pull_request: main,dev | `ci` |
| 2 | validate-build.yml | `Validate Build` | `validate-build` | `Validate Build` | push: main,dev / pull_request: main,dev | `Validate Build` |
| 3 | verify-indexes.yml | `verify-indexes-up-to-date` | `verify-indexes-up-to-date` | `verify-indexes-up-to-date` | push: main / pull_request: main,dev | `verify-indexes-up-to-date` |
| 4 | backend-ci.yml | `backend-ci` | `deploy-staging` | （未指定） | push: dev,main（条件付き） | `backend-ci / deploy-staging` |
| 5 | backend-ci.yml | `backend-ci` | `deploy-production` | （未指定） | push: dev,main（条件付き） | `backend-ci / deploy-production` |
| 6 | web-cd.yml | `web-cd` | `deploy-staging` | （未指定） | push: dev,main（条件付き） | `web-cd / deploy-staging` |
| 7 | web-cd.yml | `web-cd` | `deploy-production` | （未指定） | push: dev,main（条件付き） | `web-cd / deploy-production` |

## 投入候補性

| context 名 | branch protection 投入候補 | 理由 |
| --- | --- | --- |
| `ci` | YES | PR トリガで feature ブランチでも実行、過去 30 日 success 多数 |
| `Validate Build` | YES | 同上 |
| `verify-indexes-up-to-date` | YES | PR (main/dev) トリガあり |
| `backend-ci / *` | NO | push only、PR check-run として発火しない |
| `web-cd / *` | NO | 同上 |

## 結論

確定 context は 3 件: `ci` / `Validate Build` / `verify-indexes-up-to-date`。
