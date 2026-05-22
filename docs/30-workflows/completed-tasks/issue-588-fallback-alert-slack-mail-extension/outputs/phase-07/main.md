# Phase 7 Output — DevOps

仕様書: `../../phase-07.md`

## workflow YAML diff（実装済）

`.github/workflows/cf-audit-log-monitor.yml` の `fetch-and-analyze` job 末尾に新規 step を追加:

```yaml
- name: Evaluate fallback rate notification
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    GITHUB_REPOSITORY: ${{ github.repository }}
    SLACK_WEBHOOK_INCIDENT: ${{ secrets.SLACK_WEBHOOK_INCIDENT }}
    EMAIL_WEBHOOK_URL: ${{ secrets.EMAIL_WEBHOOK_URL }}
    EMAIL_FROM: ${{ vars.EMAIL_FROM }}
    EMAIL_TO: ${{ vars.EMAIL_TO }}
  run: |
    if compgen -G "outputs/observation/*.json" > /dev/null; then
      if [ "${{ inputs.dry_run }}" = "true" ]; then
        pnpm exec tsx scripts/cf-audit-log/observation/fallback-rate-alert.ts \
          --window=3 --threshold=0.05 --input=outputs/observation --dry-run
      else
        ...
      fi
    fi
```

`outputs/observation/*.json` snapshot が存在する場合のみ実行する guard を含む。Issue #518 の HOLD（dry_run=true 強制）はこのプロンプト内では維持。

## secret 投入手順（user-gated）

実投入はユーザー承認後に手動で実施する。

```bash
# Slack webhook（既存・op に正本あり）
gh secret set SLACK_WEBHOOK_INCIDENT --env production \
  --body "$(op read 'op://Employee/ubm-hyogo-env/SLACK_WEBHOOK_INCIDENT_PROD')"

# Mail webhook（provision pending — 未契約時はこの step を skip）
gh secret set EMAIL_WEBHOOK_URL --env production \
  --body "$(op read 'op://Cloudflare/UBM-Hyogo Shared/email-webhook-incident')"

gh variable set EMAIL_FROM --env production --body "alerts@ubm-hyogo.example"
gh variable set EMAIL_TO   --env production --body "incidents@ubm-hyogo.example"
```

未投入のままでも Slack / mail dispatcher は no-op で skip するため、Issue 起票機能は阻害しない。
