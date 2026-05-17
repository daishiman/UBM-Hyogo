---
name: observability-monitoring
description: UBM-Hyogo の Cloudflare Workers / Pages / D1 を対象としたモニタリング・アラート設計の正本リファレンス。WAE 6 イベント、UptimeRobot 無料枠境界、アラート閾値、PII 除外ルール、識別子 drift 対策を集約する。
type: reference
---

# Observability / Monitoring 正本リファレンス

> 対象タスク: UT-08 monitoring/alert design（unassigned）/ 05a-parallel-observability-and-cost-guardrails（自動化前段の手動観測）
>
> 責務境界: 05a は「手動確認可能な観測点の優先」が方針。UT-08 は次段として自動化を追加し、05a の `observability-matrix.md` / `cost-guardrail-runbook.md` を上書きせず差分追記する。

---

## 1. 無料枠の境界

### 1.1 Cloudflare Workers Analytics Engine（WAE）

| 項目 | 値 / 制約 |
| --- | --- |
| 書き込み単位 | `event = { blobs[], doubles[], indexes[] }` の構造化イベント |
| 計装方法 | Workers コードから明示的に `env.WAE.writeDataPoint()` 呼び出し |
| データ保持期間 | デフォルト 31 日（無料プラン） |
| クエリ手段 | Workers Analytics Engine SQL API |
| コスト | 無料プランは公開時点で利用可だが、書き込みボリューム / クエリ頻度の上限は将来変更され得る |

> 不確実性メモ: 無料プラン上限（書き込み件数 / クエリ列数）は Cloudflare 側で値を変更する例があるため、設計時の値を `cost-guardrail-runbook.md` に取得日付付きで固定し、四半期に一度確認する。

### 1.2 UptimeRobot 外形監視

| 項目 | 無料プラン値 |
| --- | --- |
| 監視間隔 | 5 分（最短） |
| モニタ数 | 50 |
| 通知チャネル | メール / Slack / Webhook |
| ステータスページ | 1 つまで |

> SLA 影響: 5 分以内に発生した瞬断は検知できない。ユーザー要件と照合して許容範囲を先に合意する。

---

## 2. WAE 6 イベント設計（reference）

UBM-Hyogo の最小計装セット。各イベントは `index1` をテナント / 環境キー、`blob1` をイベント種別、`double1` を主要メトリクスとして固定する。

| # | event 名 | index1 | blob1 | doubles | 用途 |
| --- | --- | --- | --- | --- | --- |
| 1 | `request_lifecycle` | `<env>` | route | latency_ms, status_code | Workers レスポンスタイム / エラーレート |
| 2 | `d1_query` | `<env>` | statement_kind（SELECT/INSERT/...） | duration_ms, rows | D1 ボトルネック検知 |
| 3 | `kv_op` | `<env>` | op（get/put/delete） | duration_ms | KV 無料枠書き込み消費の実測 |
| 4 | `r2_op` | `<env>` | op（put/get/list） | bytes, duration_ms | R2 Class A/B 操作分布 |
| 5 | `sheets_sync` | `<env>` | result（ok/fail） | duration_ms, rows_synced | Sheets→D1 同期失敗検知 |
| 6 | `quota_pulse` | `<env>` | resource（d1_writes/kv_writes/r2_class_a/...） | used_count, used_ratio | 無料枠消費率の継続観測 |

### 2.1 issue-402 retention purge イベント（追加）

| イベント | 主要フィールド | 用途 |
| --- | --- | --- |
| `cron.retention.start` | env, mode（dry-run/apply/off）, limit | 日次 retention purge job 開始 |
| `cron.retention.end` | env, processed_count, purged_count, dry_run_count, duration_ms | retention purge job 結果 |
| `audit_log.action=retention_purge` | member_id, retention_policy_version, mode | `audit_log` に物理削除 1 件単位で記録（PII を含めない。SSOT は [data-retention-policy.md](./data-retention-policy.md)） |

> identifier drift 防止: `index1` / `blob` 名はリポジトリ内で 1 か所（`apps/api` の WAE 計装ヘルパ）に集約し、文字列リテラルの直書きを禁止する。drift が起きると WAE クエリが silently 0 件返しになり検知の正本が壊れる。

---

## 3. アラート閾値設計指針

### 3.1 二段階閾値（WARNING / CRITICAL）

| メトリクス | WARNING | CRITICAL | 根拠 |
| --- | --- | --- | --- |
| Workers エラーレート（5 分平均） | 1% | 5% | UI 側で再試行可能か否かの境界 |
| Workers p95 レスポンスタイム | 1,000 ms | 3,000 ms | 一般的な対話 UI 受容上限 |
| D1 クエリ失敗（5 分） | 1 件 | 10 件 | スキーマ drift 検知用に WARNING を低く保つ |
| KV 書き込み無料枠消費率（日次） | 60% | 85% | 1,000/日 上限への到達余裕 |
| Sheets→D1 同期失敗 | 連続 1 回 | 連続 3 回 | 単発の Google API ゆらぎとシステム障害の切り分け |

### 3.1.1 ALERT_DEDUP_KV quota guard（UT-17 follow-up 006）

`infra/cloudflare-alerts/` の Cloudflare Notification Policy IaC に
`workers-kv-writes-per-day` と `workers-kv-stored-bytes` を追加済み。
どちらも initial `enabled:false` で、Cloudflare apply / Slack runtime smoke /
`enabled:true` 切替は user-gated。

Cloudflare native billing usage alert は account 集計であり、namespace filter を持たない。
そのため、この 2 policy は `ALERT_DEDUP_KV` 固有監視ではなく Workers KV account quota guard
として扱う。将来 KV namespace が増えた場合は、GraphQL / Workers Analytics pull 監視または
namespace-specific alert support の再調査が必要。

### 3.2 30 分 dedupe（重複抑止）

- 同一 `event 種別 × 環境 × 閾値レベル` の通知は 30 分間は 1 通に集約する。
- 30 分窓内の追加発火は「カウンタのみ更新（再送しない）」で、窓が閉じた時点で発火が継続していれば再通知する。
- UptimeRobot 側でも Down 通知の repeat interval を 30 分以上に揃え、二重通知を排除する。

### 3.3 Webhook fallback

- 一次通知: Slack Incoming Webhook（`SLACK_ALERT_WEBHOOK_URL`、1Password Environments 経由）。
- フォールバック: Slack 配送失敗 / 5xx の際はメール通知（運用代表アドレス）に切り替える。
- 通知本文は `event 種別 / 環境 / 閾値レベル / 直近 5 分の値 / runbook URL` を最小要素とする。

---

## 4. PII 除外ルール

WAE / ログ / アラート本文には以下を絶対に書き込まない。

| 種別 | 例 | 代替 |
| --- | --- | --- |
| メールアドレス | `responseEmail`, `email` | ハッシュ（SHA-256 + per-env salt）または会員 ID |
| 氏名 | フォーム回答の氏名項目 | 会員 ID |
| 電話番号 | フォーム回答の電話番号 | 取得しない |
| OAuth トークン / Magic Link | `Authorization` ヘッダ | 完全除去 |
| Cookie 値 | session / CSRF | 完全除去 |

> 計装ヘルパで強制: `writeWAE(event, payload)` のラッパで `payload` を allowlist フィールド（`route`, `status_code`, `duration_ms` など）にフィルタする。allowlist 外フィールドは書き込み時点で drop する。

---

## 5. 苦戦箇所（恒久対策）

### 5.1 アラート疲れ

- 症状: 閾値を緩く設定すると誤報が頻発し、担当者が通知をミュートする。CRITICAL も無視される。
- 対策:
  1. 初期は WARNING のみ運用し、対応実績ログ（`alert-response-log.md`）を 2〜4 週間蓄積する。
  2. 実績から「1 週間で対応に至った発火 / 対応不要だった発火」の比率を算出。対応不要が 70% を超えるメトリクスは閾値を緩めるか、メトリクス自体を削除する。
  3. CRITICAL 閾値はログを見て初めて設定する（最初から設定しない）。

### 5.2 identifier drift 防止

- 症状: WAE の `blob1` 名やイベント名がコード内で複数箇所に直書きされ、表記ゆれにより WAE クエリ結果が空集合になる。
- 対策:
  1. イベント名 / blob / index の名称定数は `apps/api/src/observability/wae-events.ts` に集約。
  2. 計装呼び出しはこの定数経由のみ許可（lint ルール案: 文字列リテラルでの `writeDataPoint` 禁止）。
  3. WAE クエリ側も同じ定数を参照する（クエリビルダ関数化）。

### 5.3 05a outputs 個別ファイル DEFERRED の解消

- 05a Phase 12 では `observability-matrix.md` / `cost-guardrail-runbook.md` を root canonical として確定済み。Phase 11 は UI 変更なしの NON_VISUAL evidence。
- UT-08 / UT-13 / UT-12 など下流の自動化タスクが「05a の DEFERRED 部分」を引き取る。引き取り時は 05a の成果物を上書きせず、新規 `monitoring-design.md` / `kv-runbook.md` / `r2-runbook.md` に差分追記する。

---

## 6. 関連ファイル

| 役割 | 参照先 |
| --- | --- |
| 05a 観測マトリクス | `docs/05a-parallel-observability-and-cost-guardrails/outputs/observability-matrix.md` |
| 05a コストガードレール runbook | `docs/05a-parallel-observability-and-cost-guardrails/outputs/cost-guardrail-runbook.md` |
| Cloudflare デプロイ正本 | `references/deployment-cloudflare.md` |
| シークレット管理 | `references/deployment-secrets-management.md` |
| 監視設計教訓 | `references/lessons-learned-monitoring-design-2026-04.md` |
| KV 教訓 | `references/lessons-learned-kv-session-cache-2026-04.md` |
| 未タスク仕様 | `docs/30-workflows/unassigned-task/UT-08-monitoring-alert-design.md` |

## 7. 09b Cron / Incident Response Runbook Linkage（2026-05-01）

09b は runtime 設定を変更しない docs-only / `NON_VISUAL` runbook 仕様として、sync monitoring の運用境界を固定する。`sync_jobs.running` 30 分超は P1、`sync_jobs.failed` 3 連続は P2 以上の調査開始条件として扱い、詳細手順は `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/outputs/phase-12/incident-response-runbook.md` を参照する。

`sheets_sync` イベント名は legacy 表記を含むため、Forms sync 正本化後の WAE event rename は別タスクで扱う。09b では Cloudflare Analytics / manual SQL / runbook evidence を正本とし、Sentry DSN 登録と Slack 自動通知は unassigned task に分離済み。

## 8. 09b-A Sentry / Slack Runtime Smoke Contract（2026-05-05）

09b-A は 09b で未実行として残した Sentry project 受信確認と Slack incident webhook 疎通を、`docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/` の implementation / `NON_VISUAL` / `implemented-local` workflow として正本化する。API Worker route は `apps/api/src/routes/admin/smoke-observability.ts` に実装済みで、Phase 11 は live provider PASS ではなく `provider_smoke_pending_user_approval` である。Issue #495 production extension では同 route を production にも開くが、Bearer 認証に加えて `x-smoke-production-confirm: YES` を必須化し、Slack prefix `[PRODUCTION SMOKE]`、Sentry `environment: production`、G1-G4 approval gate、staging / production evidence file 分離を正本契約にする。実 Sentry event / Slack message / production secret 登録は user approval 後の runtime execution wave で取得する。

| Runtime trigger | Severity | Primary evidence | Destination |
| --- | --- | --- | --- |
| `sync_jobs.failed` 3 consecutive | P2 | Slack permalink + redacted runbook link | `SLACK_WEBHOOK_INCIDENT` |
| `sync_jobs.running` stale > 30 min | P1 | Slack permalink + incident runbook reference | `SLACK_WEBHOOK_INCIDENT` |
| Workers 5xx spike | P1/P2 | Sentry event id + Slack permalink | `SENTRY_DSN_API` / `SLACK_WEBHOOK_INCIDENT` |
| Sentry P1 tag | P1 | Sentry event id, timestamp, `dsn=redacted=YES` | `SLACK_WEBHOOK_INCIDENT` |
| Magic Link send failure | P2 | redacted error class + Slack permalink | `SLACK_WEBHOOK_INCIDENT` |

Redaction is part of the contract: DSN URL, Slack webhook URL, Sentry auth token, Cloudflare token, and value hashes are never stored in workflow outputs. Evidence may store secret names, `op://...` reference patterns, short Sentry event ids, timestamps, and Slack message permalinks.

Production smoke evidence is stored separately from staging evidence:

| Environment | Slack prefix | Sentry environment | Evidence path |
| --- | --- | --- | --- |
| staging | `[STAGING SMOKE]` | `staging` | `docs/30-workflows/issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension/outputs/phase-11/staging-smoke-log.md` |
| production | `[PRODUCTION SMOKE]` | `production` | `docs/30-workflows/issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension/outputs/phase-11/production-smoke-log.md` |

The production log may record a non-secret Slack channel name or redacted channel id to detect cross-environment webhook mistakes. It must not record webhook URLs.

### 8.1 Issue #520 Slack incident channel provisioning contract（2026-05-07）

Issue #520 formalizes the external SaaS prerequisite for the 09b-A / Issue #495 runtime smoke: the canonical incident channel is `#ubm-hyogo-incidents`, and `SLACK_WEBHOOK_INCIDENT` is the incoming webhook secret used by staging and production observability smoke.

Operational boundaries:

- Channel and webhook creation are user-approved Slack workspace operations gated by G1.
- The webhook value is stored only in 1Password and distributed to Cloudflare / GitHub as derived copies.
- Staging messages must use `[STAGING SMOKE]`; production messages must use `[PRODUCTION SMOKE]`.
- Evidence may record channel name, short channel ID prefix, timestamp, status code, and smoke prefix. Evidence must not record full webhook URLs, token fragments, value hashes, or full Slack permalinks.
- The provisioning runbook is `docs/30-workflows/runbooks/slack-incidents-channel-provisioning.md`.

## 9. Issue #408 Cloudflare Audit Logs Monitoring Contract（2026-05-06）

Issue #408 は Cloudflare Audit Logs から API Token 利用イベントを 1 時間ごとに取得し、D1 へ 30 日保管し、HIGH / MEDIUM / LOW 判定に応じて GitHub Issue を起票する監視 workflow 仕様である。runtime コード（`.github/workflows/cf-audit-log-monitor.yml`、`scripts/cf-audit-log/**`、`apps/api/migrations/0014_create_cf_audit_log.sql`）は 2026-05-06 の Issue #408 実装 PR で merge 済み。2026-05-07 の Issue #518 で自動監視は HOLD へ縮退し、`cf-audit-log-monitor.yml` は `workflow_dispatch` のみ、`dry_run` 既定値 `true`、`cf-audit-log-monitor-watchdog.yml` は削除済みとする。状態は `implementation_merged / NON_VISUAL / HOLD / manual-check-only`：Token 発行・1Password / GitHub Secret 登録・migration apply・7 日 baseline 学習・hourly run の連続 green 化は再開条件成立まで要求しない。

| 項目 | 正本 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-408-cf-audit-logs-monitoring/` + HOLD spec `docs/30-workflows/issue-518-cf-audit-logs-monitoring-hold/` |
| 監視用 secret | `CF_AUDIT_TOKEN_PROD`（`Account > Audit Logs:Read` のみ） |
| D1 書き込み secret | `CF_AUDIT_D1_TOKEN_PROD`（監視 workflow 専用。deploy 用 `CLOUDFLARE_API_TOKEN` は注入しない） |
| deploy token 分離 | `CLOUDFLARE_API_TOKEN` とは名前・scope・rotation を分離し、監視 workflow の env から除外 |
| storage | D1 `cf_audit_log` / `cf_audit_baseline` / `cf_audit_finding_dedupe`。migration `apps/api/migrations/0014_create_cf_audit_log.sql` は local 実装済み、production apply は runtime gate |
| baseline | 7 日学習。rotation window は学習対象外 |
| alert labels | HIGH=`priority:high`, MEDIUM=`priority:medium`, LOW=`priority:low`, 共通=`type:security` |
| evidence boundary | HOLD 中は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を runtime PASS と扱わない。実 `PASS` は再開後に hourly run / D1 row / synthetic issue / dedup / watchdog / token scope / baseline artifact の 7 evidence が実値化した後 |

Runtime trigger matrix:

| Trigger | Severity | Alert destination | Primary evidence |
| --- | --- | --- | --- |
| unexpected IP authentication success | HIGH | GitHub Issue `priority:high` + `type:security` | `synthetic-high-event-issue.json` / D1 `cf_audit_log` row |
| 403 failure spike above p99 x 1.5 | MEDIUM | GitHub Issue `priority:medium` + `type:security` | analyzer summary + baseline artifact |
| off-hours token use outside JST 09:00-19:00 | LOW | GitHub Issue `priority:low` + `type:security` | event timestamp + rotation exclusion check |
| monitor workflow stale/failure | HOLD 中は停止 | watchdog は Issue #518 で削除済み。再開時のみ GitHub Issue alert を復元 | `watchdog-alert.json` |

Redaction rule: raw token value, bearer header, full actor IP, user agent, and credential-like values are not stored in workflow outputs or Issue bodies. Evidence may store secret names, redacted IP prefix, fingerprint hash, timestamps, issue number, and GitHub run id.

## 10. Issue #515 Cloudflare Audit Logs ML-ready Classifier Contract（2026-05-07）

Issue #515 は Issue #408 の threshold 監視を直ちに ML 本番切替するタスクではなく、`scripts/cf-audit-log/classifier/**` に `Classifier` abstraction を追加し、redacted feature extraction と offline replay で後続比較を可能にする ML-ready 化タスクである。状態は `implemented_local_runtime_pending / implementation / NON_VISUAL`。production classifier switch は 90 日 runtime Gate 後の別タスクとする。

| 項目 | 正本 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-515-cf-audit-logs-ml-anomaly/` |
| classifier default | `CF_AUDIT_CLASSIFIER` 未指定時は `threshold` |
| classifier modules | `scripts/cf-audit-log/classifier/{types,threshold,ml,index}.ts` |
| redacted features | `scripts/cf-audit-log/features/{schema,extract}.ts`。raw IP / full UA / email / token value を出力しない |
| evaluation | `scripts/cf-audit-log/evaluation/offline-replay.ts` と `secret-leakage-grep.ts` |
| storage extension | `apps/api/migrations/0016_cf_audit_log_classification.sql`。`classifier_used` / `classifier_version` / `confidence` |
| rollback | forward-safe。D1 追加列は残し、`CF_AUDIT_CLASSIFIER=threshold` へ戻す |

## 11. Issue #571 Staging Runtime Smoke CI Contract（2026-05-08）

Issue #571 implements the staging-only GitHub Actions integration for the attendanceProvider runtime smoke established by Issue #531. Current workflow state is `implemented-local / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`; GitHub Environment mutation, staging smoke execution, Slack real post, commit, push, and PR remain user-gated.

| Item | Contract |
| --- | --- |
| workflow root | `docs/30-workflows/issue-571-runtime-smoke-ci-staging-integration/` |
| parent | `docs/30-workflows/completed-tasks/issue-531-runtime-smoke-attendance-provider-migration/` |
| workflow | `.github/workflows/runtime-smoke-staging.yml` |
| trigger | reusable `workflow_call` from `backend-ci.yml` after API staging deploy; `workflow_dispatch` for debug |
| runtime command | `bash scripts/smoke/runtime-attendance-provider.sh staging --out-dir ci-evidence --ci-summary` |
| artifact | summary-only, 30-day retention, no raw body / cookie / bearer |
| incident post | failure-only Slack post via required `SLACK_WEBHOOK_INCIDENT`; success posts 0 messages |
| required status check | optional in first cycle; evaluate after 30 consecutive days of staging PASS and false-positive rate < 2% |
| production extension | do not create or execute now; revisit after 30-day staging observation |

Redaction contract: workflow logs and artifacts must not contain Cookie, Authorization, Bearer values, Slack webhook URLs, Sentry DSN URLs, or Slack bot tokens. Evidence may store secret names, run IDs, artifact names, status codes, redacted summary fields, and short non-secret identifiers.

Gate decision:

| 判定状態 | 条件 | 次アクション |
| --- | --- | --- |
| threshold 継続 | false positive rate ≤ 5% かつ tuning cost < 4h/month | ML switch しない |
| threshold 再調整 | false positive rate > 5% かつ baseline 7 日 | 30〜90 日 baseline へ延長 |
| ML 比較開始 | 90 日 evidence あり、false positive rate > 5% または tuning cost ≥ 4h/month | redacted dataset で offline replay |
| production ML 切替 | offline replay で改善、fallback rate 許容、rollback 承認済み | 別 PR で env switch |

## 11. Issue #549 Cloudflare Audit Logs ML production switch contract（2026-05-08）

Issue #549 は Issue #515 の ML-ready classifier を production で `ml` に切り替えるための Gate / runbook / 7 日観測 contract である。現在状態は `implemented-local / implementation / NON_VISUAL / IMPLEMENTED_LOCAL_RUNTIME_PENDING`。本サイクルでは observation scripts / fallback alert / leakage grep CLI を local 実装し、`.github/workflows/cf-audit-log-monitor.yml` は編集しない。Gate-0〜C 通過後の runtime cycle で env switch PR を作る。

| 項目 | 正本 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/` |
| classifier switch | `CF_AUDIT_CLASSIFIER=ml` は Gate-0〜C 通過後のみ |
| model path | `ML_MODEL_PATH=op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PROD` |
| fallback alert | fallback rate > 5% が 3 hour 連続で GitHub Issue 起票 + Slack (`SLACK_WEBHOOK_INCIDENT`) + mail HTTP webhook (`EMAIL_WEBHOOK_URL` / `EMAIL_FROM` / `EMAIL_TO`) を実行。Slack / mail は optional best-effort、GitHub Issue は必須 audit trail |
| observation | production switch merge 後 7 日、168 hourly snapshots を確認 |
| rollback | `CF_AUDIT_CLASSIFIER=threshold` へ戻し、D1 `classifier_used` / `classifier_version` / `confidence` は削除しない |

Gate:

| Gate | 条件 | 未通過時 |
| --- | --- | --- |
| Gate-0 | 90 日 baseline 条件を満たした、または同等の例外承認 evidence で置換済み | switch 不可 |
| Gate-A | FU-03-C offline replay で ML が threshold より precision / recall 改善 | threshold 継続 |
| Gate-B | fallback rate と Issue body redaction が許容範囲 | artifact 再評価 |
| Gate-C | rollback runbook approval / governance evidence 取得 | merge 凍結 |

Runtime PASS は 7 日観測完走後だけに使う。implemented-local / local template / skeleton dry-run だけで `pass_runtime_synced` に昇格しない。

## 12. Issue #587 Cloudflare Audit Logs ML model artifact rotation contract（2026-05-10）

Issue #587 は Issue #549 の production ML switch 後に、次世代 ML model artifact を安全に入れ替えるための rotation contract である。現在状態は `implemented_local_runtime_pending / implementation / NON_VISUAL`。本サイクルで rotation scripts (`scripts/cf-audit-log/rotation/artifact-canary.ts`, `rotation-evidence-collector.ts`)、focused vitest 19 件、canary workflow (`.github/workflows/cf-audit-log-artifact-canary.yml`)、local fixture canary evidence、runbook contract、SSOT 同期までを完了済み。production artifact promotion は Gate-R0〜R3 と user approval 後の runtime cycle に残す。

| 項目 | 正本 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/` |
| parent | `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/` |
| runbook contract | `docs/30-workflows/runbooks/ml-model-artifact-rotation.md` |
| candidate op reference | `op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_CANDIDATE` |
| production op reference | `op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PROD` |
| previous op reference | `op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PREVIOUS` |
| evidence schema | `CanaryOutput` includes `precisionProxy`, `recallProxy`, `fallbackRate`, `p95LatencyMs`, `leakageHits`, baseline metrics, candidate metrics, and verdict |
| rotation scripts | `scripts/cf-audit-log/rotation/artifact-canary.ts`, `scripts/cf-audit-log/rotation/rotation-evidence-collector.ts`, `__tests__/*.test.ts` |
| canary workflow | `.github/workflows/cf-audit-log-artifact-canary.yml` (`workflow_dispatch` only, validates op references, uploads canary evidence) |
| canary fail gate | leakage hits > 0, fallback rate >= 5%, p95 latency > 1.5x baseline, or precision/recall worse than baseline |
| rollback | restore production artifact reference to the previous op-managed value; do not drop D1 `classifier_used` / `classifier_version` / `confidence` |

Gate-R0〜R3:

| Gate | 条件 | 未通過時 |
| --- | --- | --- |
| Gate-R0 | Issue #549 runtime boundary or equivalent approval evidence is recorded | artifact promotion 不可 |
| Gate-R1 | candidate offline replay is no worse than baseline | candidate discard / Issue #548 selectionへ戻す |
| Gate-R2 | fallback rate / p95 latency / leakage grep are within thresholds | promotion PR 作成不可 |
| Gate-R3 | previous artifact reference and rollback owner are recorded | promotion PR 作成不可 |

Redaction rule: docs, logs, artifacts, PR body, and commit messages may contain op reference names, classifier version, run id, aggregate metrics, and redacted summaries only. Resolved artifact paths, raw feature datasets, full IP, full user-agent, actor email, bearer headers, token values, and value hashes are forbidden.

## 11.1 Issue #586 post-switch 7-day close-out contract（2026-05-09）

Issue #586 は Issue #549 の close-out として、production hourly run に leakage grep / fallback rate alert / artifact upload の 3 post-step を組み込み、`cf-audit-log-7day-summary.yml` で 168 hourly snapshots を集約して `pass_runtime_synced` 昇格を判定する契約である。状態昇格は 3 段:

| 段階 | 条件 | runtime path |
| --- | --- | --- |
| `implemented_local_runtime_pending` | workflow YAML 編集 + SSOT 4 ファイル更新 + Phase 11 local 5 evidence + Phase 12 strict 7 outputs | merge 前 |
| `pass_boundary_synced_runtime_pending` | base=`dev` PR merge 完了 + production env で `vars.CF_AUDIT_CLASSIFIER=ml` 設定済み | merge 後 D+0 |
| `pass_runtime_synced` | 168 hourly snapshots 集約完了 + leakage grep 7 日連続 clean + fallback rate mean ≤ 5% | D+7 |

| 項目 | 正本 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-586-post-switch-7day-close-out/` |
| hourly workflow | `.github/workflows/cf-audit-log-monitor.yml`（Issue #518 HOLD 解除 / `schedule: '5 * * * *'` / `dry_run` 既定 `false` / 3 post-step + artifact upload） |
| 7-day summary workflow | `.github/workflows/cf-audit-log-7day-summary.yml`（`cron '0 1 */7 * *'` + `workflow_dispatch` / cross-run `gh api workflows/<name>/runs` + artifact zip download / `peter-evans/create-pull-request@v6`） |
| evidence canonical path | `docs/30-workflows/issue-586-post-switch-7day-close-out/outputs/phase-11/evidence/{hourly-run-7day.md,hourly-run-7day-summary.json,leakage-grep-7day.log,issue-rate-comparison.md}` |
| local 5 evidence | `outputs/phase-11/evidence/{typecheck.log,lint.log,test.log,build.log,grep-gate.log}` |
| rollback | `gh variable set CF_AUDIT_CLASSIFIER --env production --body "threshold"` の env 1 行戻し。D1 列・schema には触らない |

Gate:

| Gate | 条件 | 未通過時 |
| --- | --- | --- |
| Gate-RUNTIME-CLASSIFIER-SET | production env で `vars.CF_AUDIT_CLASSIFIER=ml` 設定済み | hourly post-step は ml に切り替わらず threshold で 7 日 evidence 取り直し |
| Gate-RUNTIME-7DAY | 168 hourly snapshots 蓄積完了（artifact retention 8 日内） | snapshot 不足 hour を `hourly-run-7day.md` に明記し、infra 障害なら昇格許容 / production 起因なら再観測 |
| Gate-LEAKAGE-CLEAN-7DAY | 7 日連続で leakage grep clean | `pass_runtime_synced` 昇格不可 |
| Gate-FALLBACK-RATE | 7 日 mean fallback rate ≤ 5% かつ 3h 連続超 alert 0 件 | rollback 検討 |
| Gate-SNAPSHOT-INTEGRITY | aggregate JSON が `expectedSnapshots` / `actualSnapshots` を持ち、run URL 一覧が保存され、全 snapshot が skeleton zero metrics ではない | `pass_runtime_synced` 昇格不可 |

## 11.2 Issue #655 D+7 recovery 2nd-cycle contract（2026-05-14）

Issue #655 は Issue #586 の D+7 evidence が不足または未生成になった場合の
2 周目 recovery contract である。canonical workflow root は
`docs/30-workflows/issue-655-d7-recovery-2nd-cycle/`、状態は
`implemented-local-runtime-pending / implementation / NON_VISUAL / IMPLEMENTED_LOCAL_RUNTIME_PENDING`。

| 項目 | 正本 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-655-d7-recovery-2nd-cycle/` |
| parent workflow | `docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/` |
| recovery aggregate | `outputs/phase-11/evidence/hourly-run-7day-summary-recovery.json` |
| runtime boundary | PR-A implementation / PR-B D'+7 evidence / commit / push / PR / workflow_dispatch は user-gated |
| state vocabulary | workflow root は `spec_created`、runtime collection は `runtime_pending`、D'+7 成功後の業務状態のみ `pass_runtime_synced` |
| inventory | `references/workflow-issue-655-d7-recovery-2nd-cycle-artifact-inventory.md` |

Recovery では 1 周目と 2 周目の evidence を混在させない。2 周目は
`*-recovery.*` suffix と `./hourly-snapshots-recovery` input directory を使う。
親 #586 の `hourly-run-7day-summary.json` が存在しない場合は、
`recovery-rootcause-helper.ts --mark-missing-parent-summary` で missing 自体を
root-cause evidence として記録する。

## 10. Issue #547 Cloudflare Audit Logs Redacted Feature Export Contract（2026-05-08）

Issue #547 は production D1 `cf_audit_log` から 90 日分の ML feature dataset を read-only export する契約である。状態は `implemented_local_runtime_pending / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`。local CLI / schema validation / manifest / leakage scan / focused tests は完了済みで、production export は user approval 後のみ実行する。

| 項目 | 正本 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-547-cf-audit-logs-redacted-production-feature-export/` |
| CLI | `scripts/cf.sh audit-log feature-export` |
| entrypoint | `scripts/cf-audit-log/feature-export.ts` |
| D1 read boundary | `scripts/cf-audit-log/d1-client.ts` `readEventsForFeatureExport()` |
| schema validation | `scripts/cf-audit-log/feature-export/schema-validation.ts` |
| manifest | `scripts/cf-audit-log/feature-export/manifest.ts` |
| fixture | `tests/fixtures/cf-audit/feature-export-raw.json` |
| tests | `scripts/cf-audit-log/__tests__/feature-export.test.ts` |
| evidence boundary | fixture files and production files are separate; production evidence stays `PENDING_RUNTIME_EVIDENCE` until approval; production D1 backend requires `--confirm-production-export` |

Redaction rule: feature JSONL contains `FeatureExportLine` with `id`, `occurredAt`, and `features`. It does not contain raw actor email, full IP, full user-agent, token value, or `raw_json`. `secret-leakage-grep.ts` must pass before manifest success is accepted.

## 10. Issue #514 Cloudflare Audit Logs Cold Storage / R2 Export Contract（2026-05-07）
## 11. Issue #546 Cloudflare Audit Logs 90 Day Baseline Observation（2026-05-08）

Issue #546 は docs-only / NON_VISUAL の runtime observation workflow として、既存 `cf-audit-log-monitor.yml` / watchdog / `scripts/cf-audit-log/*` / D1 `cf_audit_log` を使い、90 日連続稼働・false positive rate・tuning cost を判定する。

2026-05-08 の read-only evidence 取得結果:

| Gate | Result | Evidence | Operational meaning |
| --- | --- | --- | --- |
| Gate-A 90 day continuity | FAIL | `docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/outputs/phase-11/gh-run-list-cf-audit-log-monitor.json` / watchdog evidence | monitor evidence is only 32 failed runs from 2026-05-06 to 2026-05-07; continue observation |
| Gate-B FPR <= 5% | PENDING | `gh-issues-cf-audit.json` has 0 `cf-audit` issues, but D1 read-only query returned `no such table: cf_audit_log` | do not claim FPR PASS until production D1 readiness is confirmed |
| Gate-C tuning cost >= 4h/month | PENDING | related issues #515/#546/#549 exist, but no monthly tuning minutes log | owner-authored tuning log required |

Decision is `observation_continue`. Do not proceed to production ML switch from Issue #546 evidence. Earliest meaningful 90 day review is after 2026-08-05 if successful hourly runs begin on 2026-05-08.

Issue #581 formalizes the next re-observation cycle at `docs/30-workflows/issue-581-cf-audit-90day-reobservation-reminder/`. Its root `workflow_state` remains `spec_created`; `observation_continue` is a runtime decision value, not a root state. Because Issue #518 HOLD deleted the watchdog workflow, Issue #581 stores watchdog lifecycle evidence as a marker JSON instead of querying a non-existent GitHub Actions workflow.

## 12. Issue #514 Cloudflare Audit Logs Cold Storage / R2 Export Contract（2026-05-07）

Issue #514 は Issue #408 の D1 30 日 retention を超える監査用途の cold storage 仕様である。状態は `implemented-local / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`。本サイクルでは仕様・Phase 11/12/13 evidence skeleton・SSOT 同期に加え、R2 binding / D1 migration / exporter / restore drill / GitHub Actions workflow のローカル実装まで完了する。R2 bucket / Secret / production D1 migration apply / 初回 export / PR は G1-G4 の user approval 後にのみ実行する。

| 項目 | 正本 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-514-cf-audit-logs-cold-storage-r2-export/` |
| R2 binding | `UBM_AUDIT_COLD_STORAGE` |
| export secret | `CF_AUDIT_R2_TOKEN_PROD`（監視用 `CF_AUDIT_TOKEN_PROD` と分離） |
| cadence | daily `0 2 * * *`。対象 window は `[now - 29d, now - 26d)`、completed manifest partition は skip |
| manifest | D1 `cf_audit_log_export_manifest`。`(yyyy, mm, dd)` UNIQUE、`pending -> completed/failed` の 2-phase |
| object key | `audit/v1/yyyy=YYYY/mm=MM/dd=DD/cf-audit-log-YYYYMMDD.jsonl.gz` |
| restore drill | 1 月 / 7 月の 1 日に任意 1 object を復元し row count / sha256 を照合 |
| approval order | G1 R2/bucket/secret/deploy -> G2 D1 migration apply -> G3-prod first daily export + restore drill -> G4 commit/push/PR |
| evidence boundary | Phase 11/12 は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`。runtime PASS は G1-G3-prod の実 evidence 後 |

Redaction rule: export 段階で cold-storage 用 redaction transform を適用し、`actor_ip` は IPv4 `/24` / IPv6 `/48`、`actor_email` は domain のみ、`actor_ua` は `redacted-user-agent`、`raw_json` は保存しない。変換後 JSONL に additive grep guard を走らせ、raw token value、Bearer header、full IP、full User-Agent、email、secret value/hash は R2 object、manifest、workflow outputs、Issue body に保存しない。

苦戦知見: 本契約の cadence 補正 / G1-G4 順序固定 / `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` 語彙 / artifacts mirror parity / source schema 整合 + `r2_etag` / 6-category redaction guard の経緯は `references/lessons-learned-issue-514-cf-audit-logs-cold-storage-r2-export-2026-05.md` (L-ISSUE514-001..007) を参照する。

---

## 13. 変更履歴

| 日付 | 変更 |
| --- | --- |
| 2026-05-09 | Issue #586 post-switch 7-day close-out contract を追加。Issue #518 HOLD 解除、`schedule '5 * * * *'` 復活、hourly post-step 3 点 + artifact upload + `cf-audit-log-7day-summary.yml` 新規、`pass_runtime_synced` 3 段昇格、forward-safe rollback を正本化 |
| 2026-05-08 | Issue #546 Cloudflare Audit Logs 90 day baseline observation を追加。Gate-A FAIL、Gate-B/C pending、production ML switch 禁止、最短再判定日を正本化 |
| 2026-05-10 | Issue #587 Cloudflare Audit Logs ML model artifact rotation contract を追加。candidate/canary/promotion/rollback の 4 段、Gate-R0〜R3、candidate/previous op 参照、forward-safe rollback 境界を正本化 |
| 2026-05-10 | Issue #587 rotation scripts (`scripts/cf-audit-log/rotation/artifact-canary.ts`, `rotation-evidence-collector.ts`) と canary workflow (`.github/workflows/cf-audit-log-artifact-canary.yml`) を実装。focused vitest 19 件 pass、local fixture canary evidence を取得し、状態を `implemented_local_runtime_pending` に更新 |
| 2026-05-09 | Issue #581 re-observation reminder を Issue #546 の canonical next-cycle workflow として追加。root `spec_created` と runtime decision `observation_continue` を分離し、watchdog は Issue #518 HOLD 削除済み lifecycle marker として扱う |
| 2026-05-07 | Issue #518 により Cloudflare Audit Logs 自動監視を HOLD 化。`cf-audit-log-monitor.yml` は schedule 削除 + `dry_run=true` 既定、watchdog workflow は削除、週次手動確認 runbook を正本化 |
| 2026-05-08 | Issue #547 Cloudflare Audit Logs redacted feature export contract を追加。fixture/production evidence 分離、read-only D1 export、schema validation、manifest、leakage gate、`Refs #547` 境界を正本化 |
| 2026-05-07 | Issue #515 Cloudflare Audit Logs ML-ready classifier contract を追加。threshold default、redacted features、offline replay、forward-safe rollback、90 日 Gate を正本化 |
| 2026-05-08 | Issue #549 Cloudflare Audit Logs ML production switch contract を追加。Gate-A〜C、`ML_MODEL_PATH` op 参照、fallback rate alert、7 日観測、forward-safe rollback 境界を正本化 |
| 2026-05-10 | Issue #588 fallback alert Slack / mail extension を追加。`SLACK_WEBHOOK_INCIDENT` を GitHub Actions secret 正本に固定し、mail provider は `EMAIL_WEBHOOK_URL` + `EMAIL_FROM` + `EMAIL_TO` の3点成立時のみ best-effort 実送信する |
| 2026-05-07 | Issue #514 Cloudflare Audit Logs cold storage / R2 export contract を追加。daily export cadence、manifest 2-phase、G1-G4 order、R2 binding / Secret 境界を正本化 |
| 2026-05-06 | Issue #495 production extension を追加。`x-smoke-production-confirm: YES`、production prefix / Sentry environment tag、G1-G4 gate、staging/production evidence 分離を固定 |
| 2026-05-07 | Issue #520 Slack incident channel provisioning を追加。`#ubm-hyogo-incidents`、`SLACK_WEBHOOK_INCIDENT`、G1-G4 secret placement / smoke evidence 境界を固定 |
| 2026-05-06 | Issue #408 Cloudflare Audit Logs monitoring contract を追加。`CF_AUDIT_TOKEN_PROD` 分離、severity label、Phase 11 runtime pending evidence 境界を正本化 |
| 2026-05-05 | 09b-A Sentry / Slack runtime smoke contract を追加。`contract_ready_runtime_pending` 境界、5 trigger matrix、secret redaction rules を固定 |
| 2026-05-01 | 09b cron monitoring / release runbook linkage を追加。`sync_jobs.running` 30 分超 / failed 3 連続の incident response 導線を固定 |
| 2026-04-27 | UT-08 / UT-13 / UT-12 同期 wave で新規作成。WAE 6 イベント・30 分 dedupe・PII allowlist・identifier drift 対策を集約 |
