# Artifact Inventory: issue-872-google-brand-4tone-icon-and-tokens-exempt

| 項目 | 値 |
|---|---|
| workflow root | `docs/30-workflows/completed-tasks/issue-872-google-brand-4tone-icon-and-tokens-exempt/` |
| status | `local_static_pass_browser_pending / implementation / VISUAL` |
| source | Issue #872 / FU-LOGIN-001 |
| parent | `docs/30-workflows/completed-tasks/login-page-prototype-alignment/` |
| Phase 12 | strict 7 present + validator entry `outputs/phase-12/phase-12.md` |
| Phase 11 | required VISUAL auxiliary files present; render PNG present; browser screenshots pending local disk cleanup (`ENOSPC`) |

## Scope

- `apps/web/src/components/ui/brand-icons/google.svg` is the only HEX-bearing brand asset target.
- `apps/web/src/components/ui/brand-icons/GoogleBrandIcon.tsx` is a wrapper and must contain no HEX literal.
- `verify-design-tokens` exempt scope is exactly `apps/web/src/components/ui/brand-icons/*.svg`; `.tsx`, nested SVG, `.ts`, and `.css` remain non-exempt.

## User-Gated Boundary

Browser screenshot recapture, visual baseline update, commit, push, and PR remain user-gated.
