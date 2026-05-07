# Phase 1 サマリ — 09c-incident-runbook-slack-delivery

- 実装区分: 実装仕様書
- visualEvidence: NON_VISUAL
- Issue: [#349](https://github.com/daishiman/UBM-Hyogo/issues/349)（CLOSED のまま正本昇格）
- 目的: 09c Phase 11 share-evidence の手動 placeholder を Slack bot 自動配信＋ message timestamp 永続化に置換
- 配信先: `#ubm-hyogo-incident-runbook` (production) / `#ubm-hyogo-incident-runbook-dryrun` (dry-run)
- Slack workspace team_id: `w1618436027-ek2505248`
- 主成果物コード: `.github/workflows/incident-runbook-slack-delivery.yml` / `scripts/notify/slack-incident-runbook.{ts,sh}` / `scripts/notify/slack-incident-runbook.template.json`
- evidence: `docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/slack-delivery-{dryrun,production}.json`
- token 管理: 1Password 正本 → GitHub Secrets 派生（値は記録禁止）
- 詳細: [phase-01.md](../../phase-01.md)
