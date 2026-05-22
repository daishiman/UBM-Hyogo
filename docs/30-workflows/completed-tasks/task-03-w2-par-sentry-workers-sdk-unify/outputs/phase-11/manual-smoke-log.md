# Manual Smoke Log

## Current Cycle

- date: 2026-05-07
- result: `not_run`
- reason: `implemented-local` workflow。staging deploy は今回 scope 外で user approval 後。

## Planned Runtime Smoke

| Check | Command / Operation | Expected |
| --- | --- | --- |
| staging top | `curl -s -o /dev/null -w "%{http_code}" https://<staging>/` | `200` |
| staging members | `curl -s -o /dev/null -w "%{http_code}" https://<staging>/members` | `200` |
| server event | intentional server throw | Sentry event tagged server |
| browser event | intentional browser throw | Sentry event tagged browser |

Runtime smoke requires explicit user approval for deploy and dashboard verification.
