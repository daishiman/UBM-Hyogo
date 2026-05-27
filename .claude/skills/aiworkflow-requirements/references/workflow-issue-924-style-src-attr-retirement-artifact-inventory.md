# Workflow artifact inventory: issue-924-style-src-attr-retirement

| Item | Path | Status |
| --- | --- | --- |
| Workflow root | `docs/30-workflows/completed-tasks/issue-924-style-src-attr-retirement/` | local_static_pass_browser_pending / implementation / VISUAL |
| Root artifacts | `docs/30-workflows/completed-tasks/issue-924-style-src-attr-retirement/artifacts.json` | present |
| Output artifacts mirror | `docs/30-workflows/completed-tasks/issue-924-style-src-attr-retirement/outputs/artifacts.json` | present |
| Phase 11 result | `docs/30-workflows/completed-tasks/issue-924-style-src-attr-retirement/outputs/phase-11/manual-test-result.md` | local static pass / browser pending |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/issue-924-style-src-attr-retirement/outputs/phase-12/phase12-task-spec-compliance-check.md` | present |
| System spec | `.claude/skills/aiworkflow-requirements/references/security-web-response-headers.md` | synced |
| CSP implementation | `apps/web/src/lib/security-headers.ts` | `style-src-attr` directive removed |
| Inline style gate | `scripts/verify-no-inline-style.sh` | wired to `pnpm lint` and lefthook pre-push; detects `style={` broadly |
| CSS implementation | `apps/web/src/styles/globals.css`, `apps/web/src/styles/legacy-public.css` | class/data-attr replacements |
| Focused evidence | `outputs/phase-11/evidence/{typecheck.log,vitest-focused.log,verify-no-inline-style.txt}` | present |
| Static visual sanity screenshot | `docs/30-workflows/completed-tasks/issue-924-style-src-attr-retirement/outputs/phase-11/screenshots/style-src-attr-retirement-static-sanity.png` | present |

## Boundary

`ImageResponse` routes remain excluded from the inline style grep gate because they generate PNG assets. Full 19-route browser visual regression, staging CSP response verification, commit, push, and PR remain user-gated.
