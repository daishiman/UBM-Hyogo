# invariants

判定行: `PENDING_RUNTIME_EVIDENCE`

## Required Runtime Checks

| Invariant | Runtime evidence required |
| --- | --- |
| #5 public/member/admin boundary | public, member, admin smoke results plus admin 403/redirect check |
| #6 apps/web D1 direct access forbidden | bundle inspection and rollback path verification |
| #14 Cloudflare free-tier | T+0 / T+1h / T+6h / T+24h Workers and D1 metric screenshots |

No invariant is runtime PASS until execution evidence replaces this placeholder.
