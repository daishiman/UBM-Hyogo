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

## Evidence 方針

docs-only / NON_VISUAL の運用タスクでは screenshot は必須ではない。代替 evidence として、実行予定コマンド、期待出力、manual smoke log、link checklist、Dashboard 目視確認項目を残す。

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
