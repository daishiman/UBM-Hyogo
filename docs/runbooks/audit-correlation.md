# Runbook: Cross-Source Audit Log Correlation (Issue #516)

Cloudflare Audit Logs (Issue #408) と GitHub Actions audit log を fingerprintHash で join し、HIGH severity な不正ログイン / token rotation 事象を単一 incident として追跡する dry-run 手順。

> **本タスク MVP 境界**: live wiring（実 GitHub `/orgs/{org}/audit-log` 取得・実 PAT / salt 登録）は本 runbook 上の手順記述のみで、実行は user gate を伴う follow-up とする。fixture 駆動 verify と incident dry-run は本 runbook で完結する。

## 前提

| 項目 | 値 |
| --- | --- |
| 親 Issue | https://github.com/daishiman/UBM-Hyogo/issues/516 |
| 上流 | Issue #408 (Cloudflare audit logs monitoring) |
| 必要権限 | GitHub Org Owner / PAT scope `audit_log` |
| Secrets | `AUDIT_CORRELATION_SALT` (Cloudflare Secrets / 1Password `op://CloudflareSecurity/AuditCorrelationSalt/value`) |
| Secrets | `GITHUB_AUDIT_PAT` (1Password `op://CloudflareSecurity/GitHubAuditPAT/credential`) |

## ステップ 1: Cloudflare 側 finding の取得

Issue #408 の出力を `cf.json` として用意する:

```bash
bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production --output /tmp/cf-audit.sql
# 出力を Issue #408 の正規化済み schema に変換し /tmp/cf.json に保存
# (本タスクでは Issue #408 完了後の連携。fixture 駆動 verify では fixtures/cloudflare-*.json を直接使う)
```

## ステップ 2: GitHub audit log の取得

**MVP では未実装（live wiring follow-up）**。手動 `curl` 例:

```bash
# 実行は user gate 後のみ。PAT 値は 1Password 経由でしか参照しない。
SINCE="2026-05-07T00:00:00Z"
UNTIL="2026-05-07T23:59:59Z"
op run --env-file=.env -- bash -c '
  curl -sS -H "Authorization: token ${GITHUB_AUDIT_PAT}" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/orgs/daishiman/audit-log?per_page=100&phrase=created:'"${SINCE}..${UNTIL}"'" \
    > /tmp/gh-audit.json
'
```

> PAT 値を log / shell history に絶対に残さないこと。`op run` でラップして揮発的に注入する。`/tmp/gh-audit.json` は raw audit log であり、evidence ディレクトリへ直接コピーしない。保存対象は Step 3 の redacted `merged.json` のみ。

## ステップ 3: correlation 実行

```bash
mise exec -- bash scripts/audit-correlation/run.sh \
  --github /tmp/gh-audit.json \
  --cloudflare /tmp/cf.json \
  --salt "$AUDIT_CORRELATION_SALT" \
  --out /tmp/merged.json
```

salt は CLI 引数でのみ渡す（環境変数 / log にエコーしない）。

## ステップ 4: grep gate

```bash
mise exec -- bash scripts/audit-correlation/grep-gate.sh /tmp/merged.json
```

exit 0 = clean。exit 1 = PII 検出（即 incident escalation: redaction ロジックに bug）。

## ステップ 5: severity 評価 + on-call 連絡

```bash
mise exec -- node -e '
  const f = require("/tmp/merged.json");
  const high = f.filter(x => x.severity === "HIGH");
  console.log(`HIGH=${high.length} MEDIUM=${f.filter(x=>x.severity==="MEDIUM").length} LOW=${f.filter(x=>x.severity==="LOW").length}`);
'
```

- **HIGH** → on-call チャネルへ即時連絡（Slack `#oncall-security`、本番 incident 起票）。
- **MEDIUM** → 翌営業日レビュー、`docs/30-workflows/unassigned-task/` に記録。
- **LOW** → ログ保管のみ。

## ステップ 6: evidence 保管

```bash
TS=$(date -u +%Y%m%d-%H%M)
DIR="outputs/phase-11/incident-${TS}"
mkdir -p "$DIR"
cp /tmp/merged.json "$DIR/merged.json"
# raw GitHub audit log (/tmp/gh-audit.json) はコピー禁止。
# /tmp/cf.json も redact 済みであることを確認できない場合はコピーしない。
```

## salt rotation 手順（Issue #555 実装後）

1. `bash scripts/audit-correlation/rotate-salt.sh --dry-run --env staging` で予定操作を確認する。salt literal は出力しない。
2. user approval 後、staging で `--apply` を実行する。`AUDIT_CORRELATION_SALT_PREVIOUS` と `AUDIT_CORRELATION_SALT` を 1Password / Cloudflare Secrets に同期する。
3. dual-hash window（既定 7 日）では、runner に `--previous-salt "$AUDIT_CORRELATION_SALT_PREVIOUS"` を渡すか、同名環境変数を設定して実行する。既存 v1 `{ fingerprintHash, fingerprintVersion: 1 }` を adapter で v1-only record として扱い、新 v2 record の `fingerprintHashes.v1/v2` と bridge する。
4. window に現れない actor の旧 incident は自動 backfill しない。必要な場合は別途 incident review で扱う。
5. `bash scripts/audit-correlation/rotate-salt.sh --end-rotation --env staging` で previous secret を削除する。削除後に `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` を user gate 後に実行し、Worker 再起動で single-hash mode を有効化する。production は `--confirm-production` を含む explicit user gate 後のみ。
6. end-rotation 後 48h の redacted runner output または FU-01 persistence surface で、新規 v1 生成が 0 件であることを確認する。

## Cloudflare Secrets 登録手順（live wiring follow-up）

```bash
# 本タスクでは実行しない。user gate 後のみ。
bash scripts/cf.sh secret put AUDIT_CORRELATION_SALT --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh secret put AUDIT_CORRELATION_SALT --config apps/api/wrangler.toml --env production
```

## live wiring 手順（Issue #553）

Issue #553 で fixture-only から Worker live 実行へ移行。`*/15 * * * *` cron と `POST /internal/audit-correlation/run` の 2 経路で起動する。

### 構成
- route: `apps/api/src/routes/audit-correlation/run.ts` — `POST /internal/audit-correlation/run`、Bearer token authz（timing-safe）
- scheduled: `apps/api/src/audit-correlation/scheduled.ts` — `*/15 * * * *` cron handler（既存 forms response sync と同 cron に相乗り）
- orchestration: `apps/api/src/audit-correlation/run-correlation.ts` — fetch → redact → correlate → persist → notify-slack
- persist: `apps/api/src/audit-correlation/persist.ts` — `audit_correlation_findings` table へ redact-safe 列のみ INSERT OR IGNORE
- notify: `apps/api/src/audit-correlation/notify-slack.ts` — HIGH only / fingerprint prefix 8 文字 / runbook URL 付き
- migration: `apps/api/migrations/0017_audit_correlation_findings.sql`

### 必要 env / secret（Cloudflare Workers）
| 種別 | 名前 | 1Password 参照 |
| --- | --- | --- |
| secret | `GITHUB_AUDIT_PAT` | `op://CloudflareSecurity/GitHubAuditPAT/credential` |
| secret | `SLACK_AUDIT_INCIDENT_WEBHOOK_URL` | `op://CloudflareSecurity/SlackAuditIncidentWebhook/url` |
| secret | `AUDIT_CORRELATION_SALT` | `op://CloudflareSecurity/AuditCorrelationSalt/value`（≥16 chars） |
| secret | `AUDIT_CORRELATION_INTERNAL_TOKEN` | `op://CloudflareSecurity/AuditCorrelationInternalToken/value`（≥32 chars） |
| var | `AUDIT_CORRELATION_RUNBOOK_BASE_URL` | wrangler.toml [vars] |
| var | `AUDIT_CORRELATION_GITHUB_ORG` | wrangler.toml [vars] |

### 投入手順（staging → production の順 / user gate 後のみ）
```bash
# 1. D1 migration を staging に適用
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging
# 2. secret 投入（1Password 参照経由）
bash scripts/cf.sh secret put GITHUB_AUDIT_PAT --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh secret put SLACK_AUDIT_INCIDENT_WEBHOOK_URL --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh secret put AUDIT_CORRELATION_SALT --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh secret put AUDIT_CORRELATION_INTERNAL_TOKEN --config apps/api/wrangler.toml --env staging
# 3. デプロイ
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
# 4. 手動 POST 経路で 1 回 dry-run
export AUDIT_CORRELATION_INTERNAL_TOKEN="$(op read 'op://CloudflareSecurity/AuditCorrelationInternalToken/value')"
bash scripts/audit-correlation/run.sh --mode=live \
  --endpoint https://ubm-hyogo-api-staging.<account>.workers.dev/internal/audit-correlation/run \
  --token-env AUDIT_CORRELATION_INTERNAL_TOKEN
# production への展開も同手順を --env production で繰り返す。
```

### cron trigger 監視
- 15 分間隔の scheduled invocation が 2 サイクル連続で fail した場合、`wrangler tail` か observability dashboard で原因を確認する。
- D1 に書かれない場合、`SELECT MAX(created_at) FROM audit_correlation_findings` を確認し、最終書き込み時刻が 30 分以上前なら異常とみなす。

### fingerprintVersion またぎ運用
- 現状 `fingerprintVersion=1`。salt rotation を行うと既存 fingerprint と join 不可になる。
- rotation 後は `fingerprint_version` 列で古い row と新しい row を区別する。
- migration を伴うため、後続 FU-03 の責務（本タスク scope 外）。

### redact 不変条件（live wiring 固有）
- D1 に保存する列: `fingerprint_hash_prefix`（8 文字）、`fingerprint_version`、`actor_domain`、`ip_prefix`、`ua_bucket`、`severity`、`event_type`、`reason`、`observed_at`、`created_at` のみ。
- Slack payload / D1 に含めてはいけない値: secret 全般、完全 IP、actor email の local-part、完全 UA、salt 値、webhook URL 値、PAT 値、internal token 値、完全 fingerprint hash（64 文字）。
- CI gate `audit-correlation-verify` の grep gate で `hooks.slack.com/services/...` / `ghp_...` / `ghs_...` / `github_pat_...` の literal が source に混入しないことを恒久化。

## 関連
- 仕様書: `docs/30-workflows/issue-516-github-audit-log-cross-source-correlation/`
- live wiring: `docs/30-workflows/issue-553-live-audit-correlation-endpoint/`
- SSOT: `.claude/skills/aiworkflow-requirements/references/audit-correlation.md`
- CI: `.github/workflows/audit-correlation-verify.yml`
