# 15. Infrastructure Runbook

## 目的

UBM 兵庫支部会メンバーサイトの Cloudflare Workers Cron Triggers、D1 migration、release / rollback、incident response の運用基準を固定する。詳細な実行手順は `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/outputs/phase-12/release-runbook.md` を参照する。

## Current Facts（2026-05-05 / issue #377）

`apps/api/wrangler.toml` の cron current facts は次の 3 件である。

| cron | 用途 | 備考 |
| --- | --- | --- |
| `0 18 * * *` | schema sync | 03:00 JST |
| `*/15 * * * *` | Forms response sync | response 差分同期 |
| `*/5 * * * *` | tag queue retry tick | retry 対象 queued row の再試行 / DLQ audit |

legacy Sheets hourly sync (`0 * * * *`) は retry tick 追加時に手動限定へ寄せ、top-level / staging / production の cron 本数を3本以内に維持する。実 deploy / rollback / cron disable は 09c または緊急運用で実行する。

## D1 / Worker 対応表

| 環境 | Worker | DB binding | D1 database_name |
| --- | --- | --- | --- |
| staging | `ubm-hyogo-api-staging` | `DB` | `ubm-hyogo-db-staging` |
| production | `ubm-hyogo-api` | `DB` | `ubm-hyogo-db-prod` |

## Rollback 基準

Rollback は一括実行ではなく、障害種別に応じて最小単位で実行する。

| 種別 | 対象 | 原則 |
| --- | --- | --- |
| Worker rollback | `apps/api` | `scripts/cf.sh rollback` 経由で直前 deploy に戻す |
| Pages rollback | `apps/web` | Cloudflare Dashboard で Pages deployment を選択して戻す |
| D1 migration rollback | `apps/api/migrations` | forward migration で修復し、破壊的直接 SQL を避ける |
| Cron disable / restore | `apps/api/wrangler.toml` | `crons = []` 再 deploy または Dashboard disable。復旧後は repo に反映する |

不変条件 #5 により、rollback 手順で `apps/web` から D1 を直接操作しない。

## Incident Severity

| Severity | 条件 | 初動 |
| --- | --- | --- |
| P0 | public site 全停止、データ破損疑い、認証全停止 | 直ちに rollback / cron disable を検討 |
| P1 | sync 完全停止、`sync_jobs.running` 30 分超、admin endpoint 全件 5xx | incident response runbook に沿って原因切り分け |
| P2 | sync 遅延、`sync_jobs.failed` 連続、dashboard URL / placeholder 不整合 | 次 cron 周期の復旧確認と follow-up 起票 |
| P1 | Issue #408 audit-log HIGH alert（想定外 IP からの Cloudflare API Token 認証成功） | 監視 Token を即失効し、D1 `cf_audit_log` で影響範囲を調査 |

## Issue #408 audit-log alert 対応

Issue #408 の Cloudflare Audit Logs monitoring は 2026-05-06 の実装 PR で runtime コード（workflow / scripts / D1 migration）が merge 済みである。状態は `implementation_merged / runtime pending`：token 発行・GitHub Secret 登録・migration apply・7 日 baseline 学習が完了するまで hourly run は green 化しない。`priority:high` + `type:security` の audit-log HIGH Issue が起票された場合、production 担当者は次の順で対応する。

1. Cloudflare Dashboard で `CF_AUDIT_TOKEN_PROD` を revoke し、deploy 用 `CLOUDFLARE_API_TOKEN` は不要に失効しない。
2. D1 `cf_audit_log` で該当 fingerprint / actor IP prefix / timestamp window の行を確認し、対象 resource と outcome を調査する。
3. 新しい `Audit Logs:Read` 専用 Token を発行し、1Password 正本と GitHub environment secret `CF_AUDIT_TOKEN_PROD` を更新する。
4. rotation window を Issue #408 baseline から除外し、7 日 baseline が汚染された場合は再学習する。
5. 24 時間以内に postmortem を作成し、再発防止 follow-up を `type:operations` または `type:security` で起票する。

Evidence には secret 値、Bearer header、full IP、user agent を残さない。保存可能なのは secret 名、run id、issue number、timestamp、fingerprint hash、redacted IP prefix までとする。

## Issue #515 audit-log classifier rollback

Issue #515 の classifier abstraction は `CF_AUDIT_CLASSIFIER` 未指定時に threshold を使う。ML skeleton または後続 ML model が不安定な場合、production 担当者は destructive rollback を行わず、まず次を実行する。

1. GitHub Actions variable `CF_AUDIT_CLASSIFIER` を `threshold` に戻す。
2. 次回 `cf-audit-log-monitor.yml` hourly run が threshold classifier で動作することを確認する。
3. D1 `cf_audit_log.classifier_used` / `classifier_version` / `confidence` を確認し、rollback 後に `threshold` 記録へ戻っていることを確認する。
4. D1 追加列は残す。列削除は user approval 付きの破壊的 rollback として別操作にする。

Evidence には model path、raw feature dataset、full IP、user agent、actor email を残さない。保存できるのは classifier name/version、fallback reason、run id、redacted feature summary まで。

## Issue #549 audit-log ML production switch / 7 day observation

Issue #549 は `CF_AUDIT_CLASSIFIER=ml` への production switch を扱うが、実 merge は Gate-0〜C 通過後の runtime cycle でのみ行う。Gate-0 は 90 日 baseline 条件を満たした、または同等の例外承認 evidence で置換した記録、Gate-A は offline replay で ML が threshold より precision / recall 改善、Gate-B は fallback rate と Issue body redaction が許容範囲、Gate-C は rollback runbook approval / governance evidence の取得である。

Switch 手順:

1. `CF_AUDIT_CLASSIFIER=ml` と `ML_MODEL_PATH=op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PROD` を実装 PR の contract として確認する。解決値は記録しない。
2. merge 後 7 日間、hourly snapshot 168 件で Issue 起票数、fallback rate、p95 latency、leakage grep result を確認する。
3. fallback rate > 5% が 3 hour 連続、leakage grep positive、または Issue 起票数が baseline を超過した場合は `CF_AUDIT_CLASSIFIER=threshold` へ戻す PR を作る。

Rollback では D1 `classifier_used` / `classifier_version` / `confidence` を削除しない。model artifact 不整合が続く場合は artifact 再選定 Issue へ差し戻す。

## Issue #514 audit-log cold storage / R2 export

Issue #514 の cold storage export は Issue #408 の D1 `cf_audit_log` 30 日 retention を補完する。状態は `implemented-local / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`。本サイクルでは R2 binding / D1 migration / exporter / restore drill / GitHub Actions workflow のローカル実装まで完了するが、production mutation は実行しない。

運用順序:

1. G1: R2 bucket `ubm-hyogo-audit-cold-storage-prod`、R2 binding `UBM_AUDIT_COLD_STORAGE`、GitHub environment secret `CF_AUDIT_R2_TOKEN_PROD` を準備する。
2. G2: D1 migration `0015_add_audit_export_manifest.sql` を production に apply し、`cf_audit_log_export_manifest` の存在を fresh GET で確認する。
3. G3-prod: daily workflow `0 2 * * *` の `workflow_dispatch` で first export を実行し、26〜29 日前 window の row count / object key / sha256 / manifest `completed` を保存する。同 gate 内で任意 1 object の restore drill を実行する。
4. G4: commit / push / PR を行う。Issue #514 は CLOSED のため PR 文脈は `Refs #514` のみ。

Rollback:

- workflow 異常時は `gh workflow disable cf-audit-log-cold-storage.yml` で自動発火を止める。
- redaction 漏れ疑い時は `CF_AUDIT_R2_TOKEN_PROD` を revoke し、新規 PUT を止める。
- R2 object の一括 delete は半期監査要件と相反するため、別途明示承認なしに実行しない。

Evidence には secret 値、Bearer header、full IP、full User-Agent を残さない。保存可能なのは secret 名、run id、object key、row count、sha256、redaction policy version までとする。

## Evidence 方針

docs-only / NON_VISUAL の運用タスクでは screenshot は必須ではない。代替 evidence として、実行予定コマンド、期待出力、manual smoke log、link checklist、Dashboard 目視確認項目を残す。

## 09c-A Production Deploy Execution（Issue #353 mirror / 2026-05-06）

Production deploy execution は `docs/30-workflows/issue-353-09c-production-deploy-execution/` を Issue #353 mirror とし、current canonical root `docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/` と同じ evidence contract を保持する。状態は `spec_created / implementation / VISUAL_ON_EXECUTION / runtime pending` であり、production mutation は user approval 後の execution operation でのみ実行する。

### Canonical Commands

| 操作 | コマンド | evidence |
| --- | --- | --- |
| D1 migration apply | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --remote --env production --config apps/api/wrangler.toml` | `outputs/phase-11/d1-migrations-apply.txt` |
| API deploy | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production` | `outputs/phase-11/api-deploy.log` |
| Web build | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` | `outputs/phase-11/web-build.log` |
| Web deploy | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production` | `outputs/phase-11/web-deploy.log` |
| release tag | `git tag -a <release-tag>` + `git push origin <release-tag>` | `outputs/phase-11/release-tag.txt` |

`wrangler` 直接実行と `pnpm --filter @ubm/* deploy:production` は使わない。

### Approval Gates

| Gate | 対象 | unlock 対象 |
| --- | --- | --- |
| spec PR approval | Issue #353 mirror spec PR | PR 作成のみ。production mutation は許可しない |
| G-1 | dev→main promotion | release/main promotion のみ |
| G-2 | D1 migration apply | `ubm-hyogo-db-prod` mutation |
| G-3 | API production deploy | `ubm-hyogo-api` deploy |
| G-4 | Web production deploy | `ubm-hyogo-web-production` deploy |
| G-5 | release tag push | tag 作成 / push |
| G-R | rollback | Worker rollback / forward migration / incident operation |

### Upstream Blockers

09c-A Phase 11 は、09a-A staging smoke、09b-A observability provider smoke、UT-29 / 09b-B post-deploy smoke healthcheck が green で、`outputs/phase-11/upstream-green-evidence.md`、`observability-sentry.md`、`observability-slack.md`、`post-deploy-healthcheck.md` に citation が揃うまで開始しない。

### 24h Verification

T+0 / T+1h / T+6h / T+24h で Workers requests/errors、D1 reads/writes、`sync_jobs`、attendance duplicate SQL、不変条件 #5 / #6 / #14 を確認する。T+24h の警戒閾値は Workers requests 50k 以上、D1 reads 500k 以上、D1 writes 10k 以上とし、超過時は incident handoff または follow-up 起票へ分岐する。

## Cloudflare API Token Rotation

Cloudflare API Token の 90 日 rotation は `docs/30-workflows/operations/cf-token-rotation-runbook.md` を運用手順正本、`docs/30-workflows/operations/cf-token-rotation-log.md` を実施記録正本とする。Issue #407 の reminder workflow `.github/workflows/cf-token-rotation-reminder.yml` は GitHub repository variable `CF_TOKEN_ISSUED_AT` から 85 日経過を判定し、rotation reminder Issue を起票する。

運用境界:

- Token 値、Token ID、scope 値は runbook / log / Issue / PR / evidence に記録しない。
- reminder workflow は `contents: read` / `issues: write` のみを持つ。
- 実 token 発行、1Password 更新、`gh secret set`、production rotation は user approval gate 後のみ実行する。


## Postmortem 生成（rollback 後の必須運用）

rollback 実行後 24 時間以内に、production 担当者は以下を実施する。

1. `pnpm postmortem:generate` を実行し、`outputs/incident/<date>/postmortem.md` に雛形を生成する。
2. timeline / impact / detection / response / root cause / prevention を、個人名を主語にせず事実ベースで記入する。
3. Prevention セクションを基に `gh issue create --label type:operations` で follow-up issue を 1 件以上起票する。

詳細手順は `docs/30-workflows/runbooks/postmortem/README.md` を参照する。本運用は postmortem 生成のみを担い、incident response 手順と Slack 通知連携は既存 runbook または別タスクの正本に従う。

## GitHub OIDC → Cloudflare short-lived credential target（DERIV-01 / 2026-05-06）

`docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/` は、GitHub Actions deploy 認証を長命 `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_API_TOKEN_STAGING` から OIDC 起点の job-scoped credential retrieval へ移行する target contract である。runtime cutover は未実行であり、本 runbook では承認境界だけを正本化する。

| Gate | 操作 | 承認境界 |
| --- | --- | --- |
| G1 | AWS STS trust policy / broker 設定 | user approval before external IdP mutation |
| G2 | staging cutover (`web-cd.yml` / `backend-ci.yml`) | user approval before staging deploy auth switch |
| G3 | production cutover | user approval after 7-day staging green |
| G4 | old long-lived token revoke | user approval after 24h parallel run with old-token last_used_on unchanged |

G2 では `d1-migration-verify.yml` の `CLOUDFLARE_API_TOKEN_STAGING` 参照も impact check 対象に含める。Rollback は長命 Token の 24h 一時再注入だけを許可し、恒久運用へ戻さない。24h を超える場合は incident / follow-up として扱い、Token 値・hash・OIDC JWT 生値は evidence に残さない。

## 参照

- `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/`
- `docs/30-workflows/operations/cf-token-rotation-runbook.md`
- `docs/30-workflows/operations/cf-token-rotation-log.md`
- `docs/30-workflows/issue-408-cf-audit-logs-monitoring/`
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`
- `docs/00-getting-started-manual/specs/03-data-fetching.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`
- `docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/`
