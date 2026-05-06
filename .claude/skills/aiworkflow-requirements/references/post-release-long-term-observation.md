---
topic: post-release-long-term-observation
applies_to: operations
related_workflows:
  - 09c-serial-production-deploy-and-post-release-verification
  - issue-350-long-term-production-observation
runbook_canonical: docs/runbooks/post-release-long-term-observation.md
last_updated: 2026-05-06
---

# Post-Release Long-Term Observation (D+7 / D+30)

## 概要

Production release 後の D+7 / D+30 観測は、GitHub Actions reminder Issue と手動 read-only evidence で実施する。Cloudflare Workers cron は無料枠 3 本が既に埋まっているため追加しない。

## 正本 runbook

[docs/runbooks/post-release-long-term-observation.md](../../../../docs/runbooks/post-release-long-term-observation.md)

## Current Contract

| 項目 | 正本 |
| --- | --- |
| reminder workflow | `.github/workflows/post-release-observation-reminder.yml` |
| issue template | `scripts/observation/reminder-issue-template.md` |
| helper script | `scripts/observation/create-reminder-issue.sh` |
| manual checklist | `scripts/observation/check-thresholds.md` |
| source workflow | `docs/30-workflows/issue-350-long-term-production-observation/` |
| 24h baseline | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/` |

## Evidence Boundary

- 保存可: aggregate metrics、redacted CSV、GitHub run id、判定コメント。
- 保存禁止: URL query、request/response body、IP、User-Agent、email、member ID、session token、Cloudflare/GitHub token。
- Runtime evidence collection、commit、push、PR、Issue comment は user approval 後に実施する。

## Follow-up Unassigned Tasks

- [`ut-350-fu-01-ci-actionlint-shellcheck-gate`](../../../../docs/30-workflows/unassigned-task/ut-350-fu-01-ci-actionlint-shellcheck-gate.md) — actionlint / shellcheck CI gate
- [`ut-350-fu-02-post-merge-runtime-evidence`](../../../../docs/30-workflows/unassigned-task/ut-350-fu-02-post-merge-runtime-evidence.md) — マージ後 runtime evidence 取得
- [`lessons-learned-issue-350-long-term-observation-2026-05`](./lessons-learned-issue-350-long-term-observation-2026-05.md) — 苦戦箇所と教訓

## 関連

- 24h baseline: 09c production deploy and post-release verification
- Long-term analytics decision: Issue #347 Cloudflare Analytics export decision
- Reminder workflow: `.github/workflows/post-release-observation-reminder.yml`
