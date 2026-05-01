# Verify Suite

| ID | Check | Expected | Source |
| --- | --- | --- | --- |
| C-1 | `GET /health` on API staging | 200 | deployment |
| C-2 | `POST /admin/sync/schema` | success job | 03a |
| C-3 | `POST /admin/sync/responses` | success job | 03b |
| E-1 | public route screenshots | current staging capture | 06a/08b |
| E-2 | login/profile screenshots | current staging capture | 05a/06b |
| E-3 | admin route authorization | 401/403/200 as applicable | 05a/06c |
| H-1 | web bundle has no D1 import | 0 hits | invariant #5 |
| H-2 | 24h staging free-tier check | within budget | invariant #10 |
