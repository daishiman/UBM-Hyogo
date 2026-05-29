# Phase 7 — Coverage

## Coverage Matrix

| Surface | Unit/component | E2E | Notes |
| --- | --- | --- | --- |
| PublicHeader auth slot | Yes | Yes | guest/member/admin DOM contract |
| Root `/` | Yes | Yes | direct page mount outside `(public)` group |
| `/privacy`, `/terms` | Yes | Yes | public shell parity |
| `/login` redirect | Yes | Indirect | open redirect covered by pure function and page redirect spec |
| MemberHeader admin CTA | Yes | Yes (`/profile`) | admin state visible in member shell |
| AdminSidebar public-return | Yes | Yes (`/admin`) | exactly one return link |

## Required Coverage Outcome

Focused specs must pass before Phase 11 is promoted from `runtime_pending`. Full repository coverage is not required for this task, but the focused matrix must cover every AC in Phase 1.
