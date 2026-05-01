# link-checklist

dashboard URL placeholder と 09a / 09c 引き渡しリンクを検証する。NON_VISUAL のため click 結果は「placeholder としての形式整合」を確認のみ。

## 1. Cloudflare Dashboard URL（6 種、placeholder）

| # | env var | URL | 確認 |
| --- | --- | --- | --- |
| 1 | ANALYTICS_URL_API_STAGING | `https://dash.cloudflare.com/<account>/workers/services/view/ubm-hyogo-api-staging/staging/analytics` | placeholder 形式 OK |
| 2 | ANALYTICS_URL_API_PRODUCTION | `https://dash.cloudflare.com/<account>/workers/services/view/ubm-hyogo-api/production/analytics` | placeholder 形式 OK |
| 3 | ANALYTICS_URL_D1_STAGING | `https://dash.cloudflare.com/<account>/d1/databases/ubm-hyogo-db-staging/metrics` | placeholder 形式 OK |
| 4 | ANALYTICS_URL_D1_PRODUCTION | `https://dash.cloudflare.com/<account>/d1/databases/ubm-hyogo-db-prod/metrics` | placeholder 形式 OK |
| 5 | ANALYTICS_URL_PAGES_STAGING | `https://dash.cloudflare.com/<account>/pages/view/ubm-hyogo-web-staging` | placeholder 形式 OK |
| 6 | ANALYTICS_URL_PAGES_PRODUCTION | `https://dash.cloudflare.com/<account>/pages/view/ubm-hyogo-web` | placeholder 形式 OK |

## 2. cron Triggers URL（補助）

| env var | URL |
| --- | --- |
| TRIGGER_URL_API_STAGING | `https://dash.cloudflare.com/<account>/workers/services/view/ubm-hyogo-api-staging/staging/triggers` |
| TRIGGER_URL_API_PRODUCTION | `https://dash.cloudflare.com/<account>/workers/services/view/ubm-hyogo-api/production/triggers` |

## 3. 09a 引き渡しリンク

| 種別 | パス |
| --- | --- |
| 09a outputs Phase 11 | `docs/30-workflows/02-application-implementation/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/outputs/phase-11/` |
| 09a outputs Phase 12 | `docs/30-workflows/02-application-implementation/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/outputs/phase-12/` |

## 4. 09c 引き渡し先

| 種別 | パス |
| --- | --- |
| 09c Phase 1 で参照 | `docs/30-workflows/02-application-implementation/09c-serial-production-deploy-and-post-release-verification/phase-01.md` |
| 09c Phase 5 deploy 中で参照 | `docs/30-workflows/02-application-implementation/09c-serial-production-deploy-and-post-release-verification/phase-05.md` |

## 5. 内部 spec link

| spec | パス |
| --- | --- |
| 03-data-fetching | `docs/00-getting-started-manual/specs/03-data-fetching.md` |
| 08-free-database | `docs/00-getting-started-manual/specs/08-free-database.md` |
| 14-implementation-roadmap | `docs/00-getting-started-manual/specs/14-implementation-roadmap.md` |
| 15-infrastructure-runbook | `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` |

## 6. 本タスク内 cross-link

| 種別 | パス |
| --- | --- |
| Phase 2 cron schedule design | `outputs/phase-02/cron-schedule-design.md` |
| Phase 5 cron deployment runbook | `outputs/phase-05/cron-deployment-runbook.md` |
| Phase 6 failure cases | `outputs/phase-06/failure-cases.md` |
| Phase 6 rollback procedures | `outputs/phase-06/rollback-procedures.md` |
| Phase 7 AC matrix | `outputs/phase-07/ac-matrix.md` |
| Phase 12 release runbook（最終版） | `outputs/phase-12/release-runbook.md` |
| Phase 12 incident response runbook（最終版） | `outputs/phase-12/incident-response-runbook.md` |

## 7. dead link 検出（grep base）

```bash
# 内部 link 整合性
rg -n '\]\(([^)]+\.md)\)' docs/30-workflows/09b-.../outputs/ \
  | awk -F'(' '{print $2}' | tr -d ')' | sort -u
# 上記で抽出されたパスの存在確認は Phase 12 documentation-changelog.md で再 verify
```

期待: 全て存在するファイル / spec への参照のみ。`<placeholder>` 文字列以外の broken link 0 件。
