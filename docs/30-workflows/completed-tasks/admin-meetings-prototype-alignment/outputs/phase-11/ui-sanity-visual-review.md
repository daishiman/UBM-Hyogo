# UI Sanity Visual Review

Status: `runtime_pending`

## Planned Review States

| Route | State | Review focus |
| --- | --- | --- |
| `/admin/meetings` | default | Header hierarchy, KPI density, timeline scanability |
| `/admin/meetings` | empty | Empty state clarity and action placement |
| `/admin/meetings` | drawer open | Focus containment, action grouping, candidate disabled state |
| `/admin/meetings/[id]` | default | Section card hierarchy and CSV import placement |

## Design Constraints

- Use existing admin primitives from `_shared`.
- Keep OKLch token usage only.
- Avoid nested cards and over-large marketing-style layouts.
- Preserve dense operational admin UI rhythm.
