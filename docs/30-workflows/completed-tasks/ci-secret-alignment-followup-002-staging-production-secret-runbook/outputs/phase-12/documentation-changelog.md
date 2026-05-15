# Documentation Changelog

| Date | Change |
| --- | --- |
| 2026-05-14 | Added `staging-secret-provisioning.md` and `production-secret-provisioning.md` for web-cd deploy `CLOUDFLARE_API_TOKEN`. |
| 2026-05-14 | Updated parent CI secret alignment index to reference staging / production / staging-runtime-smoke runbook family. |
| 2026-05-14 | Consumed the source unassigned task with a canonical workflow pointer and added Phase 11/12 evidence ledgers. |
| 2026-05-14 | Synchronized aiworkflow-requirements deployment secret references and indexes, including stale `--body -` stdin guidance correction. |
| 2026-05-14 | Corrected `scripts/smoke/provision-staging-secrets.sh` to pipe `op read` into `gh secret set` without the stale `--body -` flag. |
