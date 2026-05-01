# Observability Matrix — 観測性マトリクス

> パス: outputs/phase-02/observability-matrix.md
> 参照元: deployment-cloudflare.md, deployment-core.md

## Cloudflare 無料枠一覧 (AC-1)

| サービス | 無料枠 | 閾値 (警戒) | 閾値 (対処) | 確認先 |
| --- | --- | --- | --- | --- |
| **Pages builds** | 500ビルド/月 | 400ビルド/月 (80%) | 480ビルド/月 (96%) | CF Dashboard → Pages → Deployments |
| **Workers requests** | 100,000 req/日 | 80,000 req/日 (80%) | 95,000 req/日 (95%) | CF Dashboard → Workers → Analytics |
| **D1 reads** | 500万行/日 | 400万行/日 (80%) | 475万行/日 (95%) | CF Dashboard → D1 → Metrics |
| **D1 writes** | 100,000行/日 | 80,000行/日 (80%) | 95,000行/日 (95%) | CF Dashboard → D1 → Metrics |
| **D1 storage** | 5GB | 4GB (80%) | 4.75GB (95%) | CF Dashboard → D1 → Metrics |
| **KV reads** | 100,000/日 | 80,000/日 (80%) | 95,000/日 (95%) | CF Dashboard → KV → Analytics |
| **KV writes** | 1,000/日 | 800/日 (80%) | 950/日 (95%) | CF Dashboard → KV → Analytics |
| **R2 storage** | 10GB | 8GB (80%) | 9.5GB (95%) | CF Dashboard → R2 → Metrics |
| **R2 Class A operations** | 100万/月 | 80万/月 (80%) | 95万/月 (95%) | CF Dashboard → R2 → Metrics |
| **R2 Class B operations** | 1,000万/月 | 800万/月 (80%) | 950万/月 (95%) | CF Dashboard → R2 → Metrics |

注記: 無料枠数値は 2026-04-26 に公式ドキュメントで再確認した。Cloudflare / GitHub の料金・制限は変更され得るため、Phase 11 の月次確認で最新公式値との差分を確認する。

現行 `apps/web/wrangler.toml` は `pages_build_output_dir = ".next"` を持つため、05a では Pages builds を初回監視対象に含める。正本仕様に残る OpenNext Workers 方針との差分整理は `task-ref-cicd-workflow-topology-drift-001` で扱う。

## GitHub Actions 無料枠 (AC-1)

| プラン | 無料枠 | 閾値 (警戒) |
| --- | --- | --- |
| Public repo | 無制限 | — |
| Private repo (Free) | 2,000 min/月 | 1,600 min/月 (80%) |

確認先: GitHub → Settings → Billing and plans → Actions usage

## 環境別観測対象 (AC-4)

### dev (staging) 環境

| 観測対象 | 確認先 | owner |
| --- | --- | --- |
| Pages staging builds | CF Dashboard / ubm-hyogo-web-staging | ops |
| Workers (dev env) requests | CF Dashboard / Workers / dev | ops |
| D1 staging reads / storage | CF Dashboard / ubm-hyogo-db-staging | ops |
| GitHub Actions CI runs | GitHub / Actions / ci.yml | ops |
| GitHub Actions backend deploy (staging) | GitHub / Actions / backend-ci.yml (deploy-staging) | ops |
| GitHub Actions web deploy (staging) | GitHub / Actions / web-cd.yml (deploy-staging) | ops |
| GitHub Actions verify-indexes (drift gate) | GitHub / Actions / verify-indexes.yml | ops |

### main (production) 環境

| 観測対象 | 確認先 | owner |
| --- | --- | --- |
| Pages production builds | CF Dashboard / ubm-hyogo-web | ops |
| Workers (production) requests | CF Dashboard / Workers / production | ops |
| D1 production reads / storage | CF Dashboard / ubm-hyogo-db-prod | ops |
| GitHub Actions build validation | GitHub / Actions / validate-build.yml | ops |
| GitHub Actions typecheck / lint | GitHub / Actions / ci.yml | ops |
| GitHub Actions backend deploy (production) | GitHub / Actions / backend-ci.yml (deploy-production) | ops |
| GitHub Actions web deploy (production) | GitHub / Actions / web-cd.yml (deploy-production) | ops |
| GitHub Actions verify-indexes (drift gate) | GitHub / Actions / verify-indexes.yml | ops |

注記: dev / main は観測対象として分ける。ただし Pages builds、Workers requests、R2/KV operations などはアカウントやプラン単位の消費量もあるため、環境別表示だけでなく合算値を同じ確認日に見る。

## CI/CD Workflow 識別子マッピング

workflow file name、workflow display name、job id、required status context は同一ではない。監視対象や branch protection を照合するときは次の 4 列を分離して扱う。

| workflow file | display name (`name:`) | trigger | job id | required status context (confirmed / candidate) |
| --- | --- | --- | --- | --- |
| `.github/workflows/ci.yml` | `ci` | `push: main/dev`, `pull_request: main/dev` | `ci`, `coverage-gate` | `ci` confirmed; `coverage-gate` candidate after hard-gate rollout |
| `.github/workflows/backend-ci.yml` | `backend-ci` | `push: dev/main` | `deploy-staging`, `deploy-production` | none confirmed; deploy jobs are monitoring targets, not current required checks |
| `.github/workflows/validate-build.yml` | `Validate Build` | `push: main/dev`, `pull_request: main/dev` | `validate-build` | `Validate Build` confirmed |
| `.github/workflows/verify-indexes.yml` | `verify-indexes-up-to-date` | `push: main`, `pull_request: main/dev` | `verify-indexes-up-to-date` | `verify-indexes-up-to-date` confirmed |
| `.github/workflows/web-cd.yml` | `web-cd` | `push: dev/main` | `deploy-staging`, `deploy-production` | none confirmed; deploy jobs are monitoring targets, not current required checks |

注記: required status context は UT-GOV-004 / UT-GOV-001 の confirmed contexts（`ci` / `Validate Build` / `verify-indexes-up-to-date`）を正とする。`workflow display name / job id` から組み立てた `workflow / job` 形式は GitHub UI 上の見え方として有用だが、本表では branch protection に投入済みまたは投入候補の context と混同しない。

## Discord 通知の current facts (2026-05-01)

`grep -iE "discord|webhook|notif" .github/workflows/{ci,backend-ci,validate-build,verify-indexes,web-cd}.yml` の結果は 0 件。上記 5 workflow すべて、本タスク作成時点では Discord / Slack 通知は未実装。observability owner は GitHub Actions の run history と Cloudflare Dashboard を主な確認先とする。通知導入は別タスクで扱う。

## rollback / degrade 判断基準概要 (AC-5)

詳細は `outputs/phase-05/cost-guardrail-runbook.md` を参照。

| 状況 | 判断 | 対処 |
| --- | --- | --- |
| Workers > 80% quota | 警戒 | 原因調査、不要リクエスト削減 |
| Workers > 95% quota | 対処 | 低優先 API の一時停止 (degrade) |
| Pages builds > 80% quota | 警戒 | CI 実行頻度を見直す |
| Pages builds > 96% quota | 対処 | 手動デプロイ一時停止 |
| D1 storage > 80% quota | 警戒 | 不要データ確認 |
| D1 storage > 95% quota | 対処 | アーカイブ / 削除 |
| D1 writes > 80% quota | 警戒 | cron / backfill / manual sync の実行頻度確認 |
| D1 writes > 95% quota | 対処 | backfill と手動 sync を一時停止 |
| R2 / KV > 80% quota | 警戒 | 利用開始済みの場合のみ対象。操作種別別に原因調査 |
| R2 / KV > 95% quota | 対処 | 利用開始済みの場合のみ対象。低優先処理を停止 |
| 本番デプロイ後エラー率上昇 | rollback | CF Dashboard → 1クリック rollback |
