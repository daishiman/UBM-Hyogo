# System Spec Update Summary

## Step 1-A

タスク仕様書 `docs/30-workflows/ut-06-followup-H-health-db-endpoint/` を `spec_created` として記録する。Issue #121 は CLOSED のまま参照し、reopen しない。

## Step 1-B

実装状況はコード実装済み。`apps/api/src/index.ts` に `HEALTH_DB_TOKEN`、`timingSafeEqual`、`GET /health/db`、D1 `SELECT 1`、401/503/`Retry-After: 30` を追加し、`apps/api/src/health-db.test.ts` で単体テストを追加した。残作業は `HEALTH_DB_TOKEN` Secret 投入、Cloudflare WAF rule、staging/production deploy、実環境 smoke。

## Step 1-C

関連タスクは UT-22、UT-06 Phase 11 S-03/S-07、UT-06-FU-I、UT-08。依存順序は UT-22 完了後に本 endpoint 実装。

## Step 2

REQUIRED。新規 API contract `GET /health/db` を `docs/00-getting-started-manual/specs/01-api-schema.md`、`.claude/skills/aiworkflow-requirements/references/api-endpoints.md`、`.claude/skills/aiworkflow-requirements/references/environment-variables.md` に同期する。`apps/api` README は存在しないため N/A。
