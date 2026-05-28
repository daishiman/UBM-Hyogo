# Phase 11 Manual Test Result

Status: `local_visual_captured_staging_pending` (本実装サイクル `2026-05-26` で Phase 5 コード実装 + 回帰防止 spec + local authenticated Playwright screenshot evidence を反映完了。staging deploy / wrangler tail / curl evidence は user-gated)。

This workflow is an `implemented_local_runtime_pending / implementation /
VISUAL` task. Local authenticated `/admin` browser evidence is present through
the in-process Playwright mock API. Staging deploy, `wrangler tail`, and
staging `curl` evidence are intentionally not claimed until user-gated
staging verification runs.

Required evidence placeholders:

| Classification | Planned path | Current status |
| --- | --- | --- |
| screenshot overview | `outputs/phase-11/admin-dashboard-200-overview.png` | present |
| screenshot byZone detail | `outputs/phase-11/admin-dashboard-byZone-detail.png` | present |
| API curl evidence | `outputs/phase-11/curl-byZone-jq.txt` | pending |
| wrangler tail evidence | `outputs/phase-11/wrangler-tail-evidence.txt` | pending |
| Playwright smoke output | `PLAYWRIGHT_EVIDENCE_TASK=admin-dashboard-recovery-and-byZone PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/admin-dashboard-recovery-and-byZone/outputs/phase-11/evidence mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test apps/web/playwright/tests/admin-dashboard-byzone-screenshots.spec.ts --project=desktop-chromium` | pass (1/1) |
