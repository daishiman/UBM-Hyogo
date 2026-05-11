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

## Issue #588 fallback alert Slack / mail extension

Issue #588 は Issue #549 の fallback rate alert を、GitHub Issue 起票のみから GitHub Issue + Slack + mail HTTP webhook へ拡張する。実装状態は `implemented-local-runtime-pending / implementation / NON_VISUAL`。`scripts/cf-audit-log/observation/fallback-rate-alert.ts` が `outputs/observation/*.json` の hourly snapshot を評価し、fallback rate > 5% が 3 hour 連続した場合のみ通知する。

Runtime contract:

| Destination | Env | Behavior |
| --- | --- | --- |
| GitHub Issue | `GITHUB_TOKEN`, `GITHUB_REPOSITORY` | 必須 audit trail。失敗は throw 伝播 |
| Slack | `SLACK_WEBHOOK_INCIDENT` | optional。Issue #520 の incident channel 正本名。未設定時 no-op。失敗は stderr に記録して継続 |
| Mail HTTP webhook | `EMAIL_WEBHOOK_URL`, `EMAIL_FROM`, `EMAIL_TO` | optional。3 変数のいずれかが未設定なら no-op。失敗は stderr に記録して継続 |

Notification payload は `redactForNotification()` を必ず経由し、32+ hex、`userId=...`、`tenantId=...`、Bearer token、Slack webhook URL を伏せる。GitHub Issue body は既存 audit trail として `buildIssueBody()` を維持するが、Slack/mail body は redacted body のみを使う。

`.github/workflows/cf-audit-log-monitor.yml` は `analyze.ts` 実行後に `outputs/observation/*.json` が存在する場合だけ fallback-rate alert step を実行する。Issue #518 HOLD 中は `dry_run=true` が強制されるため、Slack/mail 実送信と production completion は user-approved runtime wave または自然発生 incident の観測まで pending とする。Secret / variable mutation、HOLD removal、commit、push、PR は user 明示承認後のみ実行する。

## Issue #587 audit-log ML model artifact rotation

Issue #587 は Issue #549 の production switch 後に、次世代 ML model artifact を candidate evaluation → canary → promotion → rollback の 4 段で入れ替えるための contract である。本サイクルで rotation scripts (`scripts/cf-audit-log/rotation/artifact-canary.ts`, `rotation-evidence-collector.ts`)、focused vitest、canary workflow (`.github/workflows/cf-audit-log-artifact-canary.yml`) を整備済み。実 production promotion は Gate-R0〜R3 と user approval 後に別サイクルで実施する。詳細手順は `docs/30-workflows/runbooks/ml-model-artifact-rotation.md` を正本 runbook contract とする。

Rotation prerequisites:

1. Gate-R0: Issue #549 runtime boundary or equivalent approval evidence exists.
2. Gate-R1: candidate offline replay is no worse than baseline for precision / recall proxy.
3. Gate-R2: fallback rate < 5%, p95 latency <= 1.5x baseline, leakage hits = 0.
4. Gate-R3: previous production artifact reference and rollback owner are recorded.

Rotation order:

1. Read only op reference names: `CF_AUDIT_ML_MODEL_PATH_PROD`, `CF_AUDIT_ML_MODEL_PATH_CANDIDATE`, and `CF_AUDIT_ML_MODEL_PATH_PREVIOUS`.
2. Run canary dry-run and write aggregate metrics to `outputs/phase-11/evidence/canary-dry-run.json`.
3. Run leakage grep and dataset grep before attaching any evidence.
4. If gates pass, open a promotion PR with `Refs #549, #587`. Do not include resolved artifact values.
5. Roll back by restoring the production artifact reference to the previous op-managed value. If classifier behavior is unstable, follow Issue #549 and set `CF_AUDIT_CLASSIFIER=threshold`.

Do not drop D1 `classifier_used` / `classifier_version` / `confidence` during rotation rollback. Evidence may contain op reference names, classifier versions, run ids, and aggregate metrics only.

## Issue #586 post-switch 7 day close-out（Refs #549）

Issue #586 は #549 の close-out として、Issue #518 で HOLD 化していた `cf-audit-log-monitor.yml` の hourly schedule を復活させ、production hourly run に 3 つの post-step（leakage grep / fallback rate alert / artifact upload）を組み込み、`cf-audit-log-7day-summary.yml` で 168 hourly snapshots を集約して `pass_runtime_synced` 昇格を判定する。

3 段昇格:

1. **`implemented_local_runtime_pending`**（merge 前）: workflow YAML 改修 + SSOT 4 ファイル + Phase 11 local 5 evidence + Phase 12 strict 7 outputs
2. **`pass_boundary_synced_runtime_pending`**（merge 後 D+0）: production env で `vars.CF_AUDIT_CLASSIFIER=ml` 設定済み + hourly run が成功
3. **`pass_runtime_synced`**（D+7）: 168 hourly snapshots 集約完了 + leakage grep 7 日連続 clean + fallback rate mean ≤ 5%

Evidence canonical path:

- 本サイクル: `docs/30-workflows/issue-586-post-switch-7day-close-out/outputs/phase-11/evidence/{typecheck,lint,test,build,grep-gate}.log`
- D+7: `docs/30-workflows/issue-586-post-switch-7day-close-out/outputs/phase-11/evidence/{hourly-run-7day.md,hourly-run-7day-summary.json,leakage-grep-7day.log,issue-rate-comparison.md}`

Rollback は `gh variable set CF_AUDIT_CLASSIFIER --env production --body "threshold"` の env 1 行戻し。D1 schema には触らない（forward-safe）。

## Issue #548 audit-log model selection promotion

Issue #548 は Issue #515 の ML-ready classifier を受け、Isolation Forest / XGBoost / Workers AI を threshold baseline と同一 dataset で比較するための実装である。現状態は `implemented_synthetic / implementation / NON_VISUAL`。3 candidate classifier、`evaluation/model-comparison.ts`、`evaluation/selection-criteria.ts`、training script 2 本、synthetic 720 行 fixture、harness smoke evidence (`docs/30-workflows/issue-548-ml-model-selection/outputs/phase-11/`) が実装済み。この runbook は promotion 手順を固定するが production switch は FU-03-D で扱う。Synthetic harness winner（`xgboost`）は informational のみで production winner ではない。

Promotion prerequisites:

1. FU-03-B redacted 90-day dataset が利用可能である。
2. comparison harness が threshold + candidate classifiers の precision / recall / fallback rate / latency p95 を同じ schema で出力している。
3. winner が precision >= baseline + 5pt、recall >= baseline、fallback rate <= 1%、latency p95 <= 500ms を満たす。
4. secret leakage grep が metrics / Markdown report / model artifacts に対して exit 0 である。
5. `CF_AUDIT_CLASSIFIER=threshold` rollback rehearsal が完了している。

Promotion order:

1. Store only redacted model artifact metadata and comparison report path in evidence. Raw feature dataset, full IP, full User-Agent, actor email, token values, and bearer headers are forbidden.
2. If winner is `threshold`, do not switch production.
3. If winner is non-threshold, open FU-03-D and request explicit approval for production variable switch.
4. After switch, observe 7 days of `cf_audit_log.classifier_used` / `classifier_version` / `confidence` and fallback rate.
5. Roll back by setting `CF_AUDIT_CLASSIFIER=threshold`; do not drop D1 classifier metadata columns.

Production env contract:

| Classifier | Required env |
| --- | --- |
| `threshold` | `CF_AUDIT_CLASSIFIER=threshold` only |
| `ml` legacy | `CF_AUDIT_CLASSIFIER=ml`, `ML_MODEL_PATH` |
| `isolation-forest` | `CF_AUDIT_CLASSIFIER=isolation-forest`, `CF_AUDIT_IF_MODEL` |
| `xgboost` | `CF_AUDIT_CLASSIFIER=xgboost`, `CF_AUDIT_XGB_MODEL` |
| `workers-ai` | `CF_AUDIT_CLASSIFIER=workers-ai`, `CF_AUDIT_WORKERS_AI_URL`, `CF_AUDIT_WORKERS_AI_TOKEN` |

## Issue #547 audit-log redacted feature export

Issue #547 の redacted feature export は Issue #515 の ML-ready classifier から分離した production D1 read-only export である。状態は `implemented_local_runtime_pending / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`。local CLI、schema validation、manifest、leakage scan、focused tests、typecheck、lint は完了済みだが、production D1 からの 90 日 export は user approval 後のみ実行する。

Canonical command:

```bash
CF_AUDIT_REDACT_SECRET=... bash scripts/cf.sh audit-log feature-export \
  --days 90 \
  --out /tmp/cf-audit-features.jsonl \
  --manifest-out /tmp/cf-audit-features.manifest.json \
  --confirm-production-export
```

`--confirm-production-export` is allowed only after explicit user approval. `--dry-run` is limited to local/fixture pipeline validation and does not bypass the production confirmation gate.

Evidence boundary:

- fixture evidence: `fixture-exported-features.jsonl` / `fixture-export-manifest.json`
- production evidence: `production-exported-features.jsonl` / `production-export-manifest.json` only after approval
- pending marker: `production-pending-user-gate.md`

保存可能なのは row count、sha256、exportRunId、redaction policy version、schema version、redacted feature summary まで。raw `cf_audit_log.raw_json`、actor email、full IP、full user-agent、Bearer header、token-like value は JSONL / manifest / logs / Issue body に残さない。

## Issue #546 audit-log 90 day baseline observation

Issue #546 は 90 日連続稼働、false positive rate、tuning cost を read-only evidence で判定する docs-only / NON_VISUAL 観測タスクである。2026-05-08 の実測では Gate-A は FAIL、Gate-B/C は pending のため、運用判断は `observation_continue` とする。

| Gate | 2026-05-08 result | Operator action |
| --- | --- | --- |
| Gate-A | FAIL: monitor 32 runs and watchdog 32 runs from 2026-05-06 to 2026-05-07 were all failure | production readinessを整え、successful hourly run が90日分そろうまで継続観測 |
| Gate-B | PENDING: `cf-audit` label issue 0, but D1 query returned `no such table: cf_audit_log` | Issue #408 の D1 migration / runtime readiness を確認してから FPR を再判定 |
| Gate-C | PENDING: monthly tuning minutes log missing | owner-authored tuning minutes log を残す |

Issue #546 は CLOSED のまま維持し、PR / commit 文脈では `Refs #546` のみを使う。ML comparison または production `CF_AUDIT_CLASSIFIER=ml` switch へ進めるには、Issue #546 の Gate-A/B/C を fresh evidence で再判定する。

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
