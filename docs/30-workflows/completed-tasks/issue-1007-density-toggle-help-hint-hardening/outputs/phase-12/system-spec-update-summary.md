# System Spec Update Summary

## Step 1-A: Updated Specs

| Path | Update |
| --- | --- |
| `docs/00-getting-started-manual/specs/09-ui-ux.md` | `DensityToggle` contract now includes unique description ids, HelpHint open/close states, and `help` icon usage. |
| `docs/00-getting-started-manual/specs/09d-icons.md` | Added `help` icon catalog row for HelpHint / auxiliary explanation. |

## Step 1-B: Code Contracts

| Path | Contract |
| --- | --- |
| `apps/web/src/components/ui/icons.ts` | `IconName` includes `"help"`. |
| `apps/web/src/components/ui/Icon.tsx` | `iconGlyph("help")` renders currentColor SVG. |
| `apps/web/src/components/public/DensityToggle.client.tsx` | `useId` description ids and non-controlled `<details>` close hardening. |

## Step 1-C: No-Change Boundaries

No API endpoint, database schema, Auth.js, Cloudflare binding, or route query contract changed.
`density` query semantics remain `comfy` default delete, `dense`/`list` explicit query values.

## Step 2: aiworkflow Sync

The same wave adds active workflow, quick-reference, resource-map, changelog, LOGS, and artifact inventory entries under `.claude/skills/aiworkflow-requirements/`.
