# Phase 7: DevOps（workflow / secrets）

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | completed |

## 1. workflow YAML 編集

対象: `.github/workflows/cf-audit-log-monitor.yml`

実装着手手順:

1. `cat .github/workflows/cf-audit-log-monitor.yml` で fallback-rate-alert step / job の現状を確認する
2. 該当 step / job の `env:` ブロックに以下を追加（既存 env を破壊しない）:
   ```yaml
   SLACK_WEBHOOK_INCIDENT: ${{ secrets.SLACK_WEBHOOK_INCIDENT }}
   EMAIL_WEBHOOK_URL: ${{ secrets.EMAIL_WEBHOOK_URL }}
   EMAIL_FROM: ${{ vars.EMAIL_FROM }}
   EMAIL_TO: ${{ vars.EMAIL_TO }}
   ```
3. `gh workflow view cf-audit-log-monitor.yml` で構文 lint（または `actionlint .github/workflows/cf-audit-log-monitor.yml`）

## 2. GitHub Secrets / Variables 投入手順

**※ 本作業は user 明示承認後のみ実行（Phase 13 PR レビュー時に確認）**

```bash
# Slack webhook（Issue #520 で provision 済み・op 参照のみ使用）
op read "op://Employee/ubm-hyogo-env/SLACK_WEBHOOK_INCIDENT_PROD" \
  | gh secret set SLACK_WEBHOOK_INCIDENT --repo daishiman/UBM-Hyogo

# Email webhook（provider 契約後）
# op read "op://Cloudflare/UBM-Hyogo Shared/email-webhook-incident" \
#   | gh secret set EMAIL_WEBHOOK_URL --repo daishiman/UBM-Hyogo

# 非機密 var
gh variable set EMAIL_FROM --body "alerts@ubm-hyogo.example" --repo daishiman/UBM-Hyogo
gh variable set EMAIL_TO --body "incidents@ubm-hyogo.example" --repo daishiman/UBM-Hyogo
```

> **注**: `EMAIL_WEBHOOK_URL` provider が未確定の場合は secret 投入を skip する。env 未設定なら mail dispatcher は no-op で skip するため、Slack 単独で運用開始できる。

## 3. Cloudflare 側

本タスクは GitHub Actions コンテキストの CLI のみで動作するため、Cloudflare Secrets への投入は不要。

## 4. 検証

```bash
# secrets の存在確認（値は出力されない）
gh secret list --repo daishiman/UBM-Hyogo | grep -E '^(SLACK_WEBHOOK_INCIDENT|EMAIL_WEBHOOK_URL)'
gh variable list --repo daishiman/UBM-Hyogo | grep -E '^(EMAIL_FROM|EMAIL_TO)'
```

## 5. 出力

- `outputs/phase-07/main.md`
