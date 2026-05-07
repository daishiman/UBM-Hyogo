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

## salt rotation 手順（記録のみ・実施は別タスク）

1. 1Password で新 salt を生成（32 byte 以上の random hex）。
2. `bash scripts/cf.sh secret put AUDIT_CORRELATION_SALT --config apps/api/wrangler.toml --env staging` で staging に登録。
3. 動作確認後 production に展開。
4. `apps/api/src/audit-correlation/types.ts` の `FingerprintVersion` を `2` に上げ、過去データは別 version として扱う（join 不可）。
5. live wiring follow-up タスクで実装。

## Cloudflare Secrets 登録手順（live wiring follow-up）

```bash
# 本タスクでは実行しない。user gate 後のみ。
bash scripts/cf.sh secret put AUDIT_CORRELATION_SALT --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh secret put AUDIT_CORRELATION_SALT --config apps/api/wrangler.toml --env production
```

## 関連
- 仕様書: `docs/30-workflows/issue-516-github-audit-log-cross-source-correlation/`
- SSOT: `.claude/skills/aiworkflow-requirements/references/audit-correlation.md`
- CI: `.github/workflows/audit-correlation-verify.yml`
