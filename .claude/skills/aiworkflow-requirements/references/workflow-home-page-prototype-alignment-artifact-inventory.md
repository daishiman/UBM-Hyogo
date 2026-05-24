# Workflow Artifact Inventory: home-page-prototype-alignment

| Item | Path |
| --- | --- |
| workflow root | `docs/30-workflows/home-page-prototype-alignment/` |
| root artifacts | `docs/30-workflows/home-page-prototype-alignment/artifacts.json` |
| output artifacts | `docs/30-workflows/home-page-prototype-alignment/outputs/artifacts.json` |
| compliance check | `docs/30-workflows/home-page-prototype-alignment/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| source prototype | `docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx`, `docs/00-getting-started-manual/claude-design-prototype/styles.css` |
| public blueprint | `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md` |
| desktop screenshot | `docs/30-workflows/home-page-prototype-alignment/outputs/phase-11/screenshots/home-desktop-2026-05-23.png` |
| mobile screenshot | `docs/30-workflows/home-page-prototype-alignment/outputs/phase-11/screenshots/home-mobile-2026-05-23.png` |
| historical umbrella parent | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/` |
| current implementation owner | `docs/30-workflows/ui-prototype-design-system-foundation/` |

## Classification

`implemented / implementation / VISUAL / local runtime screenshots captured`

## Implementation Targets

- `apps/web/src/styles/legacy-public.css`
- `apps/web/src/components/public/CallToActionCTA.tsx`
- `apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx`
- `apps/web/app/opengraph-image.tsx`
- `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx`

## Boundary

`legacy-public.css` is the selected target for public component data-attribute rules in this workflow. `globals.css` remains the broader rhythm / Tailwind / foundation selector owner. Local visual evidence is captured; staging deploy, commit, push, and PR are user-gated.
