# Phase 11 Manual Smoke Log

## Local Component Smoke

| Check | Result |
| --- | --- |
| occupation visible under member name | PASS |
| zone chip uses `zoneTone` + dot | PASS |
| membership type chip uses `statusTone` without dot | PASS |
| tags show first 2 labels and `+N` | PASS |
| empty/undefined tags show `未タグ` warning chip | PASS |
| `+N` exposes all tag labels through `title` | PASS |

## Screenshot Evidence

| State | Screenshot |
| --- | --- |
| enriched | `outputs/phase-11/screenshots/admin-members-table-enriched.png` |
| untagged | `outputs/phase-11/screenshots/admin-members-table-untagged.png` |

Authenticated staging smoke remains `pending_user_approval`.
