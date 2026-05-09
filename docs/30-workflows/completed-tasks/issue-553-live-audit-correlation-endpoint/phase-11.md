# Phase 11: NON_VISUAL evidence 収集

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 |
| Source | `outputs/phase-11/main.md` |
| 区分 | evidence 収集（NON_VISUAL） |
| 想定所要 | 0.5 人日 |
| visualEvidence | NON_VISUAL（スクリーンショットは収集しない） |
| state vocabulary | `RESERVED_RUNTIME_EVIDENCE_PENDING`（本 spec_created close-out では計画のみ。後続 implementation wave で local / staging / production evidence を取得） |

## 目的

`apps/api/src/routes/audit-correlation/` および `apps/api/src/audit-correlation/` の live wiring 実装に対する NON_VISUAL evidence path を `outputs/phase-11/evidence/` 配下に予約し、後続 implementation wave の Phase 13 PR 本文から参照可能にする。

evidence は次の 2 層構造で取得する:

1. **local PASS 5 点セット**（typecheck / lint / test / build / grep-gate）— ローカル CI 等価コマンドの green を証跡化。
2. **runtime / governance evidence 8 種**（wrangler dev scheduled / staging cron 1run / Slack dry-run payload / D1 grep-gate / D1 migration apply staging / actionlint / shellcheck / bats）— staging 取得分のみ Phase 11 で完了させる。

production runtime（production cron 1run / production D1 migration apply / production Slack production channel 投稿）は Phase 13 G1〜G4 ゲート後に取得する。本 spec_created close-out の Phase 11 は evidence path と取得条件を予約するだけで、実測 PASS と扱わない。

## canonical paths（絶対パスは worktree root 起点の相対表記）

### local PASS 5 点セット

| パス | コマンド | 期待出力 / PASS 判定 |
| --- | --- | --- |
| `outputs/phase-11/evidence/typecheck.log` | `mise exec -- pnpm --filter @ubm/api typecheck` | `EXIT: 0` / TS error 0 件 |
| `outputs/phase-11/evidence/lint.log` | `mise exec -- pnpm --filter @ubm/api lint` | `EXIT: 0` / lint warning 0 件 |
| `outputs/phase-11/evidence/test.log` | `mise exec -- pnpm --filter @ubm/api test src/audit-correlation src/routes/audit-correlation` | `EXIT: 0` / 全 vitest case PASS / 主要分岐 inventory を tail に追記 |
| `outputs/phase-11/evidence/build.log` | `mise exec -- pnpm --filter @ubm/api build` | `EXIT: 0` / wrangler bundle 成功 / `Total Upload` 行が出力される |
| `outputs/phase-11/evidence/grep-gate.log` | `mise exec -- bash scripts/audit-correlation/grep-gate.sh outputs/phase-11/evidence/slack-dryrun-payload.json` | `EXIT: 0` / secret / full IP / full email / full UA / salt literal / webhook URL 検出 0 件 |

### runtime / governance evidence 8 種

| パス | コマンド | 期待出力 / PASS 判定 |
| --- | --- | --- |
| `outputs/phase-11/evidence/wrangler-dev-scheduled.log` | `mise exec -- bash scripts/cf.sh dev --config apps/api/wrangler.toml --test-scheduled` を 30 秒起動し、別ターミナルで `curl http://127.0.0.1:8787/__scheduled?cron=*%2F15+*+*+*+*` | `EXIT: 0` / scheduled handler が runCorrelation() を 1 回完走 / log に `correlation: completed` |
| `outputs/phase-11/evidence/staging-cron-1run.log` | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` 後、Cloudflare dashboard の Triggers / Cron Triggers 履歴を確認し、最新 invocation の log を `wrangler tail --env staging` で取得 | invocation 1 件以上成功 / `Status: OK` / 例外なし |
| `outputs/phase-11/evidence/slack-dryrun-payload.json` | staging で HIGH severity を意図的に作る fixture を `POST /internal/audit-correlation/run` に投入し、Slack dry-run channel に届いた payload を Slack 側からコピーして保存 | `severity: "HIGH"` / `fingerprint_hash_prefix` 8 文字 / `actor_domain` / `ip_prefix` / `ua_bucket` のみ / runbook URL 含む |
| `outputs/phase-11/evidence/d1-grep-gate.log` | `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "SELECT * FROM audit_correlation_findings LIMIT 50;"` の出力を `scripts/audit-correlation/grep-gate.sh` に通す | `EXIT: 0` / D1 row に full IP / full email / full UA / secret / salt literal が無い |
| `outputs/phase-11/evidence/d1-migration-apply-staging.log` | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging` 実行ログ + `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "PRAGMA table_info(audit_correlation_findings);"` の出力を併記 | `EXIT: 0` / `Migrations to apply: 1` → `Applied` / PRAGMA で全列 (`id`, `fingerprint_hash_prefix`, `fingerprint_version`, `actor_domain`, `ip_prefix`, `ua_bucket`, `severity`, `event_type`, `observed_at`, `created_at`) を確認 |
| `outputs/phase-11/evidence/actionlint.log` | `mise exec -- pnpm dlx @rhysd/actionlint-runner@latest .github/workflows/audit-correlation-verify.yml` | `EXIT: 0` / 違反 0 件 |
| `outputs/phase-11/evidence/shellcheck.log` | `shellcheck scripts/audit-correlation/*.sh scripts/cf.sh` | `EXIT: 0` / SC エラー 0 件 |
| `outputs/phase-11/evidence/bats.log` | `mise exec -- bats scripts/audit-correlation/__tests__/` | `EXIT: 0` / 全 bats case PASS（`live-mode.bats` を含む） |

### D1 schema parity verification（staging vs production）

D1 schema drift を Phase 11 時点で検出するため、次の手順で staging / production 並列取得し evidence 化する。

| パス | コマンド | 期待出力 / PASS 判定 |
| --- | --- | --- |
| `outputs/phase-11/evidence/d1-parity-staging.log` | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging` + `PRAGMA table_info(audit_correlation_findings)` 抜粋 | applied 件数・列定義を表で記録 |
| `outputs/phase-11/evidence/d1-parity-production.log` | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production` + `PRAGMA table_info(audit_correlation_findings)`（production migration apply 前は `pending` 件数を記録） | pending 件数 / 列定義差分を表で記録 |
| `outputs/phase-11/evidence/d1-parity-diff.md` | 上記 2 ファイルから applied/pending 数値・列定義 diff を手動で抽出した markdown table | drift 0 件 もしくは「production apply は Phase 13 G2 で実施」と記載 |

#### drift 検出時の followup task 自動発行ルール

以下の条件いずれかを満たした場合、`docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-04-FU-01-D1-PARITY-DRIFT-NN.md` を Phase 12 Task 4 で自動発行する:

1. staging / production 間で applied 列定義に差分がある（型 / NOT NULL / DEFAULT のいずれか）。
2. staging に applied だが production に未 apply の migration が、Phase 13 G2 承認スコープ外（別 migration ID）として残存する。
3. PRAGMA table_info の列順が staging / production で異なる（D1 復旧時の互換性影響）。

drift が 0 件の場合でも、`d1-parity-diff.md` に「drift 0 件」と明記して evidence として保存する。

## redact-safe 不変条件（Phase 11 evidence 全体に適用）

evidence ログ・JSON・markdown のいずれにも次の値を**書かない**:

- `GITHUB_AUDIT_PAT` の値（`ghp_` / `github_pat_` プレフィックス含む）
- `SLACK_AUDIT_INCIDENT_WEBHOOK_URL` の値（`https://hooks.slack.com/...` 含む）
- `AUDIT_CORRELATION_INTERNAL_TOKEN` の値
- `AUDIT_CORRELATION_SALT` の値（literal も hex も）
- full IP（`/24` 等の prefix のみ可）
- full email（`@` 以降の domain のみ可）
- full User-Agent（`ua_bucket` 値のみ可）
- 1Password 参照そのものは可（例: `op://CloudflareSecurity/SlackAuditIncidentWebhook/url`）

各 evidence 取得後に `scripts/audit-correlation/grep-gate.sh` を必ず通し、`grep-gate.log` に PASS 記録を残す。

## 実行タスク

1. `outputs/phase-11/evidence/` ディレクトリを作成する。
2. local PASS 5 点セットのコマンドを順に実行し、stdout/stderr を tee で各ログに保存し、末尾に `EXIT: $?` を追記する。
3. staging へ deploy 済前提で runtime / governance evidence 8 種を取得する。
4. D1 schema parity verification を staging / production 両方に対して実行し、差分を `d1-parity-diff.md` に記載する。
5. すべての evidence に対して `grep-gate.sh` を通し、redact-safe 不変条件を確認する。
6. `outputs/phase-11/main.md` から各 evidence ファイルへの相対リンクを記載し、PASS / runtime_pending を表で示す。

## 検証 / 期待出力

- [ ] local PASS 5 点セットすべての log 末尾に `EXIT: 0`。
- [ ] 後続 implementation wave で runtime / governance evidence 8 種を staging で取得する。spec_created close-out では reserved path のみを PASS とする。
- [ ] D1 schema parity verification 3 ファイル（staging / production / diff）が揃う。drift 検出時は followup task が Phase 12 で発行される。
- [ ] `grep-gate.log` で全 evidence の PII / secret 検出 0 件。
- [ ] `slack-dryrun-payload.json` の `severity === "HIGH"` かつ redact-safe（fingerprint_hash_prefix が 8 文字、IP は prefix のみ、UA は bucket のみ）。

## 統合テスト連携

- 本 Phase の `test.log` は Phase 4 で設計した契約テスト群（`apps/api/src/audit-correlation/__tests__/{run-correlation,persist,notify-slack,run-route}.test.ts`）の出力を含む。
- `bats.log` は Phase 6 で実装した `scripts/audit-correlation/__tests__/live-mode.bats` の出力を含む。
- `actionlint.log` は Phase 7 で更新した `.github/workflows/audit-correlation-verify.yml` の検証出力。

## 参照資料

- skill `task-specification-creator` の NON_VISUAL evidence template
- 親ワークフロー Phase 11: `docs/30-workflows/completed-tasks/issue-516-github-audit-log-cross-source-correlation/phase-11.md`
- CLAUDE.md「Cloudflare 系 CLI 実行ルール」（`bash scripts/cf.sh` 経由必須）
- CLAUDE.md「ローカル `.env` の運用ルール（AI 学習混入防止）」

## 成果物

- `outputs/phase-11/main.md`
- `outputs/phase-11/evidence/typecheck.log`
- `outputs/phase-11/evidence/lint.log`
- `outputs/phase-11/evidence/test.log`
- `outputs/phase-11/evidence/build.log`
- `outputs/phase-11/evidence/grep-gate.log`
- `outputs/phase-11/evidence/wrangler-dev-scheduled.log`
- `outputs/phase-11/evidence/staging-cron-1run.log`
- `outputs/phase-11/evidence/slack-dryrun-payload.json`
- `outputs/phase-11/evidence/d1-grep-gate.log`
- `outputs/phase-11/evidence/d1-migration-apply-staging.log`
- `outputs/phase-11/evidence/actionlint.log`
- `outputs/phase-11/evidence/shellcheck.log`
- `outputs/phase-11/evidence/bats.log`
- `outputs/phase-11/evidence/d1-parity-staging.log`
- `outputs/phase-11/evidence/d1-parity-production.log`
- `outputs/phase-11/evidence/d1-parity-diff.md`

## 完了条件（DoD）

- [ ] local PASS 5 点セットがすべて green。
- [ ] runtime / governance evidence 8 種が staging で取得済み。
- [ ] D1 schema parity verification 3 ファイルが揃い、drift 0 件もしくは followup task 発行を Phase 12 に申し送り済。
- [ ] redact-safe 不変条件の grep gate が全 evidence で PASS。
- [ ] `outputs/phase-11/main.md` から evidence への相対リンクが整っており、Phase 13 PR 本文から参照可能。
- [ ] visualEvidence=NON_VISUAL のため、スクリーンショット項目を `main.md` / PR 本文に**作らない**。
- [ ] production runtime evidence は Phase 13 G1〜G4 後に追記する旨 `main.md` に明記。
