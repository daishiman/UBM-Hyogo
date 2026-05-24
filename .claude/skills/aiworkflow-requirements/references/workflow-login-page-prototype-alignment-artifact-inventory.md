# workflow-login-page-prototype-alignment artifact inventory

## Metadata

| key | value |
| --- | --- |
| workflow | `docs/30-workflows/completed-tasks/login-page-prototype-alignment/` |
| state | `implemented_local_visual_evidence_captured / implementation / VISUAL_ON_EXECUTION` |
| date | 2026-05-23 |
| primary prototype | `docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx` LoginPage |

## Implementation Targets

| path | role |
| --- | --- |
| `apps/web/app/login/page.tsx` | title/subtitle and `LoginShell` wrapper |
| `apps/web/app/login/_components/LoginShell.tsx` | `.auth-shell` route surface |
| `apps/web/app/login/_components/LoginCard.tsx` | brand mark + jp/en brand title |
| `apps/web/app/login/_components/LoginPanel.client.tsx` | Magic Link primary order, OR divider, register copy |
| `apps/web/app/login/_components/OrDivider.tsx` | OR separator |
| `apps/web/app/login/_components/MagicLinkForm.client.tsx` | primary CTA size/icon/placeholder/label |
| `apps/web/app/login/_components/GoogleOAuthButton.client.tsx` | secondary Google CTA |
| `apps/web/app/login/_components/LoginStatus.tsx` | sent-state inbox block |
| `apps/web/src/components/ui/Icon.tsx` / `icons.ts` | SVG icon names: send/google/inbox/arrow-left |
| `apps/web/src/styles/auth.css` / `globals.css` | auth shell/card/brand/form CSS |
| `apps/web/playwright/tests/login-smoke.spec.ts` | DOM-order, prototype smoke, Phase 11 screenshots |

## Skill Compliance

| skill | evidence |
| --- | --- |
| task-specification-creator | strict 7 files in `outputs/phase-12/`, root `index.md`, root/output artifacts |
| aiworkflow-requirements | `13-mvp-auth.md`, quick-reference/resource-map/task-workflow-active, this inventory |
| automation-30 | compact 30-method evidence in final review; 4 conditions checked |

## Boundaries

- No `apps/api/**` changes.
- No new endpoint or D1 schema changes.
- Local Playwright screenshot evidence is captured under `outputs/phase-11/screenshots/`.
- Staging visual smoke, commit, push, and PR remain user-gated.
