# observability-target-diff
- legacy:  ubm-hyogo-web
- current: ubm-hyogo-web-production

## R1 Workers Logs
- current: enabled=true head_sampling_rate=1.0
- legacy:  N/A (dashboard fallback: Workers & Pages → ubm-hyogo-web → Logs)

## R2 Tail
- current: target=ubm-hyogo-web-production
- legacy:  target=ubm-hyogo-web

## R3 Logpush
- current: N/A (dashboard fallback: Analytics & Logs → Logpush for ubm-hyogo-web-production)
- legacy:  N/A (dashboard fallback: Analytics & Logs → Logpush for ubm-hyogo-web)

## R4 Analytics Engine
- current: bindings=[] datasets=[]
- legacy:  bindings=[] # ubm-hyogo-web (legacy)

## Diff summary
- legacy-only:  0
- current-only: 1
