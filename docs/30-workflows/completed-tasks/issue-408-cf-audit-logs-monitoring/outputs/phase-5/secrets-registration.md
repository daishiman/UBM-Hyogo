# Phase 5 / S13: Secrets registration runbook

production 担当者が手動で実行する。コード merge 後に runtime green 化に必要な手順。

| step | 操作 | 確認 |
| --- | --- | --- |
| 1 | Cloudflare Dashboard で `Audit Logs:Read` のみの API Token を発行（Token 名 `audit-log-reader-prod`） | Cloudflare 管理画面の Token list に表示 |
| 2 | 1Password vault `UBM-Hyogo Production` に Item `CF_AUDIT_TOKEN_PROD` 作成（field: `credential`） | `op item get CF_AUDIT_TOKEN_PROD` |
| 3 | `.env`（プロジェクトルート）に `CF_AUDIT_TOKEN_PROD="op://UBM-Hyogo Production/CF_AUDIT_TOKEN_PROD/credential"` を追記 | `op run --env-file=.env -- printenv CF_AUDIT_TOKEN_PROD` で展開 |
| 4 | GitHub `production` environment secret `CF_AUDIT_TOKEN_PROD` を実値で登録（`gh secret set CF_AUDIT_TOKEN_PROD --env production`） | `gh secret list --env production` |
| 5 | GitHub repository variable `CF_AUDIT_LAST_SUCCESS_AT` を `0` で初期化（`gh variable set CF_AUDIT_LAST_SUCCESS_AT --body 0`） | `gh variable list` |
| 6 | D1 production migration を適用: `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production` | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production` で `0014_create_cf_audit_log` が `applied` |
| 7 | `gh workflow run cf-audit-log-monitor.yml -f dry_run=true` で dry-run dispatch | run が success、stdout に `[DRY-RUN] would create issue` または `findings:0` |
| 8 | dry-run 解除して 1 サイクル実行、`gh issue list --label cf-audit` で起票観測 | HIGH 合成イベントは Phase 11 で別途検証 |
| 9 | 7 日経過後 `bash scripts/cf.sh audit-log baseline --days 7` を 1 回実行 | D1 `cf_audit_baseline` に 3 行 |
| 10 | watchdog 動作確認: `gh workflow run cf-audit-log-monitor-watchdog.yml` | heartbeat 直後なら起票なし |

注意:
- token 値・Bearer header・full IP・UA は logs / Issue / PR / docs に書かない。保存可能なのは secret 名、run id、issue number、timestamp、fingerprint hash、redacted IP prefix まで。
- `CF_AUDIT_TOKEN_PROD` は `CLOUDFLARE_API_TOKEN` と独立に rotation する。rotation window は `CF_AUDIT_ROTATION_WINDOW=<since>,<until>` で `analyze` step に渡し baseline 学習対象から除外する。
