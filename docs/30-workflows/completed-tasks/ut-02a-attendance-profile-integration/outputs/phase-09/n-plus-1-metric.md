# N+1 Metric

## Expected Observation

For N member profiles, attendance lookup performs `ceil(N / 80)` D1 queries rather than N queries.

## Evidence To Capture

- Test spy count for 1 member.
- Test spy count for 80 members.
- Test spy count for 81 members.
- Test spy count for 160 members.
