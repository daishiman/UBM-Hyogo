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

## Evidence 方針

docs-only / NON_VISUAL の運用タスクでは screenshot は必須ではない。代替 evidence として、実行予定コマンド、期待出力、manual smoke log、link checklist、Dashboard 目視確認項目を残す。

## Cloudflare API Token Rotation

Cloudflare API Token の 90 日 rotation は `docs/30-workflows/operations/cf-token-rotation-runbook.md` を運用手順正本、`docs/30-workflows/operations/cf-token-rotation-log.md` を実施記録正本とする。Issue #407 の reminder workflow `.github/workflows/cf-token-rotation-reminder.yml` は GitHub repository variable `CF_TOKEN_ISSUED_AT` から 85 日経過を判定し、rotation reminder Issue を起票する。

運用境界:

- Token 値、Token ID、scope 値は runbook / log / Issue / PR / evidence に記録しない。
- reminder workflow は `contents: read` / `issues: write` のみを持つ。
- 実 token 発行、1Password 更新、`gh secret set`、production rotation は user approval gate 後のみ実行する。

## 参照

- `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/`
- `docs/30-workflows/operations/cf-token-rotation-runbook.md`
- `docs/30-workflows/operations/cf-token-rotation-log.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`
- `docs/00-getting-started-manual/specs/03-data-fetching.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`
