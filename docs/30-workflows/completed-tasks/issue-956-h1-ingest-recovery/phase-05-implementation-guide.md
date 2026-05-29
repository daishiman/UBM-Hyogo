# Phase 05 — 実行手順 (runtime ops)

[実装区分: ドキュメントのみ / runtime ops]

本タスクではコード変更を行わない。production runtime ops を以下の順で実行する。各ステップで生成された evidence は Phase 11 inventory に従い保存する。

## S1: 事前 snapshot 取得

```bash
# admin 認証 cookie を取得した状態で
curl -sS -H "cookie: <auth>" \
  https://<api-worker-host>/admin/diagnostics/forms-pipeline \
  | tee docs/30-workflows/completed-tasks/issue-956-h1-ingest-recovery/outputs/phase-11/snapshot-before.json \
  | jq '{ secretsReadiness, hypothesisFlags, latestSyncRuns: .latestSyncRuns[0:3], counts }'
```

判定:
- `secretsReadiness.{googleServiceAccountEmail, googlePrivateKey}` が false の場合 → S3 実施
- 両方 true かつ `H1 === false` → 本タスク自体不要 (`completed-tasks/` 直行可)

## S2: secrets readiness 欠落キー特定

snapshot の `secretsReadiness` から false のキーを列挙する。

## S3: Cloudflare Secrets 投入

> 値は 1Password から `op://` 参照で stdin に渡す。コマンド履歴・docs・log への転記禁止。

```bash
bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_EMAIL \
  --config apps/api/wrangler.toml --env production
# stdin に 1Password 参照値を貼付

bash scripts/cf.sh secret put GOOGLE_PRIVATE_KEY \
  --config apps/api/wrangler.toml --env production
# stdin に 1Password 参照値を貼付 (改行含む PEM はそのまま投入可)

# GOOGLE_FORM_ID は wrangler.toml の [vars] で宣言済のため通常不要
# secretsReadiness.googleFormId が false の場合のみ:
bash scripts/cf.sh secret put GOOGLE_FORM_ID \
  --config apps/api/wrangler.toml --env production
```

投入確認 (キー名のみ):

```bash
bash scripts/cf.sh secret list \
  --config apps/api/wrangler.toml --env production \
  | tee docs/30-workflows/completed-tasks/issue-956-h1-ingest-recovery/outputs/phase-11/cf-secret-list.txt
```

## S4: cron schedule drift 確認

```bash
grep -nE 'crons|GOOGLE_FORM_ID' apps/api/wrangler.toml \
  | tee docs/30-workflows/completed-tasks/issue-956-h1-ingest-recovery/outputs/phase-11/wrangler-cron-grep.txt
```

期待: `["0 18 * * *", "*/15 * * * *", "*/5 * * * *"]` と `GOOGLE_FORM_ID = "119ec539..."`。drift があればコード変更扱いとなり別 PR (Phase 03 例外参照)。

## S5: cron 起動観測

```bash
# 投入直後から 16 分以上張る (1 cycle 確保)
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env production \
  | tee docs/30-workflows/completed-tasks/issue-956-h1-ingest-recovery/outputs/phase-11/cron-tail.log
```

ログから `scheduled` / `sync-forms-responses` / 401 reason 等を抜粋し、AC-6 達成を確認。

## S6: stale lock check

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "SELECT job_id, status, started_at FROM sync_jobs \
             WHERE status='running' AND started_at < datetime('now','-1 hour')" \
  | tee docs/30-workflows/completed-tasks/issue-956-h1-ingest-recovery/outputs/phase-11/stale-lock-select.txt
```

該当 row が 0 件 → S7 スキップ。

## S7: stale lock reset (該当時のみ)

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "UPDATE sync_jobs SET status='aborted', finished_at=datetime('now') \
             WHERE job_id='<job_id>' AND status='running'" \
  | tee -a docs/30-workflows/completed-tasks/issue-956-h1-ingest-recovery/outputs/phase-11/stale-lock-reset.txt
```

`sync-lock` 側の expired-DELETE は acquire 時に自動実行されるが、`sync_jobs` 側の status 不整合は手動 reset が必要。

## S8: 事後 snapshot 取得

```bash
curl -sS -H "cookie: <auth>" \
  https://<api-worker-host>/admin/diagnostics/forms-pipeline \
  | tee docs/30-workflows/completed-tasks/issue-956-h1-ingest-recovery/outputs/phase-11/snapshot-after.json \
  | jq '{ secretsReadiness, hypothesisFlags, latestSyncRuns: .latestSyncRuns[0:3] }'
```

## S9: 差分 / AC 確認

`outputs/phase-11/snapshot-diff.md` を作成し、Phase 01 AC-1〜AC-6 の達成可否を列挙する。
