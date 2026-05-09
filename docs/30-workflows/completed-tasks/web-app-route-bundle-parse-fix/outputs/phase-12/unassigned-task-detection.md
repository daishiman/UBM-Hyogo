# Unassigned Task Detection

| Candidate | Decision | Reason |
| --- | --- | --- |
| favicon 404 | not created in this cycle | unrelated low-impact UI asset; no dependency on App Route parse fix |
| Next / OpenNext upgrade | existing future maintenance only | this fix targets current `next@16.2.4` + `@opennextjs/cloudflare@1.19.4`; upgrade is not required to recover runtime |
| Turbopack return condition | documented, no new task | remove `--webpack` only after OpenNext/Next release evidence proves `[project]/` Worker bundle compatibility |
| Workers CD migration | absorbed by existing cutover work | do not duplicate `task-impl-opennext-workers-migration-001`; this task fixes the build output used by OpenNext |
| Issue #547 / #548 deleted workflow dirs | resolved in this cycle | detected by review as active SSOT breakage and restored because quick-reference/resource-map/task-workflow-active still cite those roots |
| task-specification-creator template improvements | not created | routed to skill-feedback-report as applied examples / no-op template edits; existing Phase 12 rules already require command evidence, path normalization, and state vocabulary checks |

No new unassigned task is required for the `web-app-route-bundle-parse-fix` scope.
