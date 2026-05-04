# Phase 11 Runtime Evidence Placeholder

Status: `blocked_until_user_approval`

Runtime evidence is intentionally pending because staging / production deploy and Google Cloud Console edits require explicit user approval.

Local visual evidence was captured on 2026-05-03 JST with `pnpm exec playwright screenshot` against `next dev` on `127.0.0.1:3100`.

Declared evidence contract:

| Evidence | Path | Current status |
| --- | --- | --- |
| Local privacy screenshot | `screenshots/privacy-local.png` | captured; local HTTP 200 |
| Local terms screenshot | `screenshots/terms-local.png` | captured; local HTTP 200 |
| HTTP smoke | `manual-smoke-log.md` | pending user approval |
| OAuth consent screenshot | `consent-screen-screenshot.png` | pending production URL + Cloud Console access |
| Legal note | `legal-review-note.md` | interim wording recorded; final legal approval pending external review |

Local implementation evidence is handled by Phase 12 compliance and local test commands.
