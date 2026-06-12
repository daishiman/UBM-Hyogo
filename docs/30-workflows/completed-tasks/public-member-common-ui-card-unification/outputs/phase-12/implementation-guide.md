# Implementation Guide — public-member-common-ui-card-unification

## Part 1: Concept

Think of the public and member pages as rooms in one community building. Today, each room chooses its own shelves, signs, boxes, and doors. That makes every room harder to improve because a small style change has to be repeated in many places.

This task creates one shared set of building parts:

| Part | Plain explanation |
| --- | --- |
| PageShell | The land and outside wall: page background, width, and spacing |
| PageHeader | The sign at the entrance: page title, short guide text, and action area |
| SectionCard | A labeled shelf: one clear group of information |
| ContentCard | A small box: one item or one compact block of information |
| Prose | The reading rulebook: long text is easier to scan and read |
| ButtonLink | One shared door handle: links that look and behave like buttons |

The reason is simple: when every screen uses the same parts, the next design improvement can start from one shared place instead of eight separate pages.

### Terminology Check

| Term | Plain wording |
| --- | --- |
| primitive | shared building part |
| component | screen part made from code |
| prop | setting passed into a part |
| token | named color, spacing, or shadow value |
| visual evidence | screenshot proof that the screen looks right |

## Part 2: Technical Contract

### Scope

The implementation target is apps/web only:

- `apps/web/src/components/ui/layout/{PageShell,PageHeader,SectionCard,ContentCard,Prose,index}.tsx`
- `apps/web/src/components/ui/ButtonLink.tsx`
- `apps/web/src/styles/layout-primitives.css`
- public/member/auth pages listed in `phase-1-requirements.md`

`apps/api`, D1 migrations, Google Form schema, and public API response contracts remain unchanged.

### Props and Data Attributes

The props contract is defined in `phase-2-design.md`:

| Component | Required contract |
| --- | --- |
| `PageShell` | `maxWidth`, `background`, `gap`, `data-component="page-shell"` |
| `PageHeader` | `title`, optional `eyebrow`, `lead`, `actions`, `align` |
| `SectionCard` | `title`, `description`, `actions`, `tone`, `padding`, `as`, transparent `data-*` |
| `ContentCard` | `heading`, `media`, `footer`, optional `href`, `interactive`, `tone`, `padding` |
| `Prose` | `size`, long-form typography under `.ui-prose` |
| `ButtonLink` | `variant`, `size`, `block`, `leftIcon`, `rightIcon`; same visual class system as `Button` |

### Acceptance Trace

| AC | Implementation evidence after code work |
| --- | --- |
| AC-1/2 | new component files and barrel exports exist locally |
| AC-3 | direct anchor/button style paths are handled through `ButtonLink`, including the legacy hero `secondary` CTA |
| AC-4 | card-mapping rows are implemented in apps/web; screenshot proof remains pending |
| AC-5 | background/width/rhythm are owned by `PageShell` for target routes |
| AC-6 | privacy/terms text is rendered through the shared prose path |
| AC-7 | existing `data-testid`, `aria-label`, and `role` remain part of the contract |
| AC-8 | token and inline-style gates must pass before visual PASS |
| AC-9 | `git diff --name-only -- apps/api` is empty |
| AC-10/11 | focused apps/web Vitest/typecheck/lint/build must pass before final PASS |
| AC-12 | 16 local screenshots remain pending |

## Current Boundary

This guide records the local implementation contract. It intentionally does not claim screenshot PASS, staging PASS, commit, push, or PR.
