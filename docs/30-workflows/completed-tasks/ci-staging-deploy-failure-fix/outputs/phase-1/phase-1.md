# Phase 1: 目的とスコープ

## 1.1 目的

`dev` ブランチへの push で実行される `web-cd / deploy-staging` および `backend-ci / deploy-staging` の連続失敗を解消し、staging への自動デプロイパイプラインを回復する。

## 1.2 成功定義

| 観測対象 | 失敗状態（現状） | 成功状態（DoD） |
|----------|------------------|-----------------|
| `web-cd / deploy-staging` | `Build web app (OpenNext Workers bundle)` step で `next build` exit code 1（ZodError） | step success / staging Worker が更新される |
| `backend-ci / deploy-staging` | `Apply D1 migrations` step で wrangler が `Authentication error [code: 10000]` | step success / migration が remote D1 に適用される |
| staging アクセス確認 | n/a | `https://ubm-hyogo-web-staging.daishimanju.workers.dev/` が HTTP 200 を返す |

## 1.3 ステークホルダー

- Solo dev（daishiman）
- CI ランナー（GitHub Actions）
- Cloudflare staging Worker + D1 (`ubm-hyogo-db-staging`)

## 1.4 タイムライン

- 本サイクル（D'+0）内で task-01 は local 実装完了、task-02 は手順・runbook 固定まで完了。
- task-01 は code change と local deterministic evidence 取得まで完了。dev push 後の CI runtime evidence は Phase 13 user gate 後に取得する。
- task-02 は Cloudflare dashboard 操作（手動・ユーザー実施）+ GitHub Secrets 更新が必要なため、仕様書では手順を明記し、ユーザー操作の trigger point を明示する。外部 mutation 自体は user-gated pending。

## 1.5 非ゴール

- D1 schema 設計変更
- env 不変条件（CLAUDE.md `apps/web` 不変条件）のルール変更
- production 側の本番 deploy 自体（main 側は別 push トリガで自動実行される）
- OIDC への deploy 切替（issue-762 トラック）
