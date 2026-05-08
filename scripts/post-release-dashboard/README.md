# Post-release Dashboard 30 Day Auto-summary

post-release-dashboard.yml の運用 30 日経過後に conclusion 分布 / failure 比率 / 連続 failure を
自動集計し、`auto/post-release-30day-summary-YYYYMM` ブランチへの push と draft PR 起票、
Slack Incoming Webhook 通知を行う自動化基盤（Refs #517, #497, #351）。

## Slack Channel Bootstrap

The workflow does not create Slack channels and does not use Slack App / Bot OAuth. Prepare the Incoming Webhook manually before treating Slack notification evidence as PASS.

1. Create or confirm Slack channel `w1618436027-ek2505248`.
2. Create an Incoming Webhook and bind it to that channel.
3. Store the webhook URL in 1Password as the canonical value.
4. After user approval, derive GitHub Secret `SLACK_WEBHOOK_URL` from 1Password. Do not paste or commit the webhook URL.
5. Send a Phase 11 test post with prefix `[TEST FROM ISSUE-517 PHASE-11]`.
6. Record only HTTP status, received timestamp, channel id, and deletion confirmation in evidence. Do not record the URL.
7. Delete the test post after confirmation.

If the channel, webhook, or secret is missing, the workflow state is `CONTRACT_READY_SECRET_PENDING`.

## 実行手順

### ローカル dry-run

```bash
bash scripts/post-release-dashboard/30day-summary.sh --dry-run
```

PR 起票・branch push・Slack 送信は行わず、集計 JSON / PR_BODY / SLACK_PAYLOAD を stdout に出力する。

### GitHub Actions workflow_dispatch

GitHub Actions UI から `post-release-30day-auto-summary` を選択し、`Run workflow` で `dry_run: true / false` を指定する。

### 自動 cron

UTC 01:00 daily に自動起動。30 日 gate 不成立なら silent skip（exit 0、副作用なし）。

## Exit Code

| code | 意味 | 経路 |
| --- | --- | --- |
| 0 | success / silent skip / dry-run 成功 | gate skip / 重複 PR skip / 正常 / `--dry-run` |
| 2 | parse / aggregate error | gh run list 失敗 / jq 失敗 |
| 3 | Slack POST failure | curl 非 2xx |
| 64 | 引数不正 / 前提欠落 | unknown arg / 親 workflow 不在 |

## Secret Check

```bash
gh secret list --repo daishiman/UBM-Hyogo | grep '^SLACK_WEBHOOK_URL'
```

If missing or expired, rotate it from 1Password only:

```bash
op run --env-file=.env -- bash -c '
  gh secret set SLACK_WEBHOOK_URL --body "$SLACK_WEBHOOK_URL_VALUE" --repo daishiman/UBM-Hyogo
'
```

## 関連ファイル

- workflow: `.github/workflows/post-release-30day-auto-summary.yml`
- script: `scripts/post-release-dashboard/30day-summary.sh`
- helper: `scripts/post-release-dashboard/lib/aggregate.sh`, `lib/redaction-check.sh`
- tests: `scripts/post-release-dashboard/__tests__/30day-summary.test.sh`
- fixtures: `scripts/post-release-dashboard/__tests__/fixtures/30day-summary/`

## テスト実行

```bash
bash scripts/post-release-dashboard/__tests__/run-all.sh
```

`30day-summary.test.sh` は TC-01〜TC-07 と TC-05b（aggregate / schedule-only gate / redact / render / find_existing_pr / Slack secret failure / dry-run / silent skip）を網羅する。
