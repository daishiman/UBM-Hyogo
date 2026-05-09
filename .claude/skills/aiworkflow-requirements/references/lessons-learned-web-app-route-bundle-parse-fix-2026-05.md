# Lessons Learned: web-app-route-bundle-parse-fix

| ID | Lesson |
| --- | --- |
| L-WBRB-001 | Next.js major-version builder defaults can break Cloudflare Workers at runtime even when route code and typecheck are green. |
| L-WBRB-002 | OpenNext build evidence must include `.open-next/worker.js` generation and a targeted bad-specifier grep, not just `next build`. |
| L-WBRB-003 | Existing post-build patch scripts need artifact-existence guards when switching builder paths. |
| L-WBRB-004 | `implemented-local` and `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` should be used when local build evidence is complete but Cloudflare deploy/smoke is user-gated. |
| L-WBRB-005 | Next App Router page modules cannot export arbitrary test helpers; move helpers to sibling modules so current typecheck remains executable after build-generated `.next/types` checks. |
