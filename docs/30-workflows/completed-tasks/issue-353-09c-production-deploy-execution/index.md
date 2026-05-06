# issue-353-09c-production-deploy-execution

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| task name | issue-353-09c-production-deploy-execution |
| GitHub Issue | #353 (CLOSED — keep closed; spec mirrors canonical 09c-A execution scope) |
| wave | 9c-fu |
| mode | serial |
| owner | - |
| 状態 | spec_created / implementation-spec / remaining-only |
| taskType | implementation |
| 実装区分 | 実装仕様書（runbook execution + evidence collection） |
| visualEvidence | VISUAL_ON_EXECUTION |

## purpose

09c docs-only runbook を実 production deploy / smoke / 24h verification に進める。

> このディレクトリは canonical な 09c-A workflow の issue-353 ミラーであり、spec tracking のために作成されたもの。Issue #353 は CLOSED のままであり、本 spec 作成タスクで再オープンしてはならない。

## why this is not a restored old task

このタスクは完了済み本体タスクの復活ではなく、正本上で未実装・未実測として残った follow-up gate だけを扱う。

09c は production release runbook specification として完了しているが、実 production deploy、D1 migration、release tag、runtime smoke、24h verification は user approval 後の別 operation として未実行である。

## scope in / out

### Scope In
- user approval evidence
- main merge commit と deploy target 照合
- production D1 migration list/apply evidence
- api/web production deploy evidence
- release tag
- production smoke
- 24h verification

### Scope Out
- 09c docs-only 仕様書の再設計
- 新規機能開発
- secret 値の記録
- 09a staging smoke 未完了時の production 実行

## dependencies

### Depends On
- 09a staging smoke green
- 09b release/incident runbook
- 09b-B-cd-post-deploy-smoke-healthcheck（post-deploy healthcheck mechanism が green。silent failure 検知の前提）
- 09b-A-observability-sentry-slack-runtime-smoke（runtime observability が疎通済み）
- spec PR creation approval

### Blocks
- post-release observation follow-ups

## refs

- docs/30-workflows/completed-tasks/task-09c-production-deploy-execution-001.md
- docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/
- docs/00-getting-started-manual/specs/15-infrastructure-runbook.md
- .claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md

## AC

- AC-1: user approval evidence が保存される（`outputs/phase-11/user-approval-log.md`）
- AC-2: production D1 migration が Applied として確認される（`outputs/phase-11/d1-migrations-list-{before,after}.txt` + `d1-migrations-apply.txt`）
- AC-3: api/web production deploy が exit 0（`outputs/phase-11/api-deploy.log` / `web-deploy.log`、正規経路は `bash scripts/cf.sh deploy --config <path> --env production` 直接呼び出し）
- AC-4: production public/member/admin smoke が green（10 ルートの HTTP status + VISUAL evidence 23 枚）
- AC-5: release tag と 24h verification summary が保存される（`release-tag.txt` + `24h-verification-summary.md` + 24h metrics screenshot 8 枚）

## deploy 経路（正本）

`apps/api` / `apps/web` の `package.json` には `deploy:production` script は **存在しない**（Phase 4 で確認済み）。正規経路:

| 対象 | コマンド |
| --- | --- |
| API deploy | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production` |
| Web pre-build | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare`（OpenNext build。`.open-next/worker.js` / `.open-next/assets/` 生成が deploy の必須前提） |
| Web deploy | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production` |
| D1 migration | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --remote --env production --config apps/api/wrangler.toml` |

`wrangler` 直接実行は禁止。すべて cf.sh wrapper 経由。

## 13 phases

- [phase-01.md](phase-01.md) — 要件定義
- [phase-02.md](phase-02.md) — 設計
- [phase-03.md](phase-03.md) — 設計レビュー
- [phase-04.md](phase-04.md) — テスト戦略
- [phase-05.md](phase-05.md) — 実装ランブック
- [phase-06.md](phase-06.md) — 異常系検証
- [phase-07.md](phase-07.md) — AC マトリクス
- [phase-08.md](phase-08.md) — DRY 化
- [phase-09.md](phase-09.md) — 品質保証
- [phase-10.md](phase-10.md) — 最終レビュー
- [phase-11.md](phase-11.md) — 手動 smoke / 実測 evidence
- [phase-12.md](phase-12.md) — ドキュメント更新
- [phase-13.md](phase-13.md) — PR 作成

## outputs

- outputs/phase-01/main.md
- outputs/phase-02/main.md
- outputs/phase-03/main.md
- outputs/phase-04/main.md
- outputs/phase-05/main.md
- outputs/phase-06/main.md
- outputs/phase-07/main.md
- outputs/phase-08/main.md
- outputs/phase-09/main.md
- outputs/phase-10/main.md
- outputs/phase-11/main.md
- outputs/phase-12/main.md
- outputs/phase-12/implementation-guide.md
- outputs/phase-12/system-spec-update-summary.md
- outputs/phase-12/documentation-changelog.md
- outputs/phase-12/unassigned-task-detection.md
- outputs/phase-12/skill-feedback-report.md
- outputs/phase-12/phase12-task-spec-compliance-check.md
- outputs/phase-13/main.md
- outputs/phase-13/pr-template.md
- outputs/phase-13/pr-creation-result.md

## invariants touched

- #5 public/member/admin boundary
- #6 apps/web D1 direct access forbidden
- #14 Cloudflare free-tier

## completion definition

全 phase 仕様書が揃い、実装・実測時の evidence path と user approval gate が明確であること。アプリケーションコード実装、deploy、commit、push、PR 作成はこの仕様書作成タスクには含めない。
