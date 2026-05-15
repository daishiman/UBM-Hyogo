# Runtime Pending Evidence — hourly-run-7day-summary-recovery.json

## Expected Shape

```json
{
  "mode": "recovery",
  "expectedSnapshots": 168,
  "actualSnapshots": 168,
  "leakageHourlyClean": true,
  "fallbackRateMean": 0.05
}
```

## Boundary

The real JSON is created only after D'+7 has elapsed and `cf-audit-log-7day-summary.yml`
runs in recovery mode. This template is not runtime PASS evidence.
