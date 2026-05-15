# 2026-05-14 UT-17 followup-003 healthcheck cron

UT-17 alert relay weekly healthcheck cron was synchronized as implemented-local runtime pending.

- Existing `0 18 * * *` API Worker cron is reused; no new cron slot.
- UTC Monday gate drives weekly execution.
- Slack webhook `200 + body != "ok"` is treated as failure.
- Resend fallback mail is documented via optional `HEALTHCHECK_FALLBACK_EMAIL` / `RESEND_API_KEY`.
- Monthly runbook is demoted to quarterly / consecutive-failure deep-dive.
