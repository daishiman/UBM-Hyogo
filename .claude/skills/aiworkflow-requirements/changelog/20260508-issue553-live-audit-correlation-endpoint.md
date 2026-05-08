# 2026-05-08 Issue #553 Live Audit-Correlation Endpoint

- Registered `docs/30-workflows/issue-553-live-audit-correlation-endpoint/` as `spec_created / implementation / NON_VISUAL`.
- Added Issue #553 live wiring formalization to `references/audit-correlation.md`.
- Synced `task-workflow-active.md`, `quick-reference.md`, `resource-map.md`, `topic-map.md`, and `keywords.json` for live wiring lookup.
- Boundary: route / cron / D1 / Slack / secrets / runtime evidence remain implementation-wave work behind G1-G4 user approval.

## 2026-05-08 wave addendum (sync of impl landing)

- `references/audit-correlation.md` に以下の 4 章を追記（74→127 行 / 500 行 budget 内）:
  - §Additional implementation surface (Issue #553 wave 2026-05-08 sync) — `runbook-url.ts` 追加実装と `__tests__/` の grep gate scope を明示。
  - §Cloudflare Secrets (5 種) op-reference rule — `GITHUB_AUDIT_PAT` / `SLACK_AUDIT_INCIDENT_WEBHOOK_URL` / `AUDIT_CORRELATION_SALT` / `AUDIT_CORRELATION_INTERNAL_TOKEN` / `AUDIT_CORRELATION_RUNBOOK_BASE_URL` の 1Password op 参照規約と `validateEnv` 検証境界。
  - §Salt rotation procedure (`fingerprintVersion` v1 → v2) — 7 step 手順、cross-version join 禁止、anti-pattern 3 件。
  - §Lessons learned (Issue #553 wave) — L-AC553-001..007（scheduled retry budget なし / Slack per-finding 部分成功 / `INSERT OR IGNORE` dedup / fixture vs grep gate 整合 / `runbook-url.ts` SSOT / env validate throw / redact-safe 3 層）。
- 追跡対象に追加した実装ファイル: `apps/api/src/audit-correlation/runbook-url.ts`、`apps/api/src/audit-correlation/__tests__/{run-route,run-correlation,persist,notify-slack,runbook-url}.test.ts`、`apps/api/migrations/0017_audit_correlation_findings.sql`。
- grep gate 整合性確認: `.github/workflows/audit-correlation-verify.yml` の 5 正規表現（`hooks.slack.com/services/...{20,}` / `ghp_...{20,}` / `ghs_...{20,}` / `github_pat_...{20,}` / `xox[bp]-...{20,}` / `AUDIT_CORRELATION_SALT=...`）に対し、`__tests__/` 内 fixture（`hooks.slack.com/services/X/Y/Z`、`ghp_dummy_test_value_xxxxxxxxxxxxxxxxxxxxxxxx`、`'a'.repeat(32)`、`'test-salt'`）はいずれも非マッチであることを確認した。L-AC553-004 として記録済。
- Indexes regenerated: `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` により `topic-map.md` / `keywords.json` を再生成。`quick-reference.md` には 5 secrets / salt rotation / lessons-learned へのクイックポインタを手動追記。`resource-map.md` の Issue #553 行に `runbook-url.ts` / migration SQL / 新章ポインタを追記。
- File rename / family rename / path move なし。`legacy-ordinal-family-register.md` 更新は不要。
- Cloudflare deploy / D1 apply / secret put / commit / push / PR は引き続き user approval 後のみ。
