# Phase 11 Manual Smoke Log

## status

LOCAL_NON_VISUAL_EXECUTED

## scope

This implementation workflow does not execute staging, production, deploy, commit, push, or PR operations. Local NON_VISUAL evidence is provided by contract tests, route tests, typecheck, and lint.

## reserved runtime checks

| Check | Expected runtime evidence | Status |
| --- | --- | --- |
| `/me` with valid Auth.js session cookie | 200 response from apps/api after implementation | LOCAL_TESTED via resolver cookie cases; staging smoke pending |
| `/me/profile` with valid Auth.js session cookie | 200 response and member profile payload | LOCAL_ROUTE_TESTED; staging smoke pending |
| Missing or invalid session cookie | 401 response | LOCAL_TESTED |
| Deleted member | 410 response | LOCAL_ROUTE_TESTED |
| dev-only `x-ubm-dev-session` in production | Disabled outside development | LOCAL_TESTED |

## boundary

The entries above are measured local PASS results unless explicitly marked staging smoke pending. Live environment evidence is intentionally not claimed.
