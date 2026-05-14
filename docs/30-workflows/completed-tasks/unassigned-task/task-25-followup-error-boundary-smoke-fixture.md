# task-25-followup-error-boundary-smoke-fixture

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | `task-25-followup-error-boundary-smoke-fixture` |
| Source | `docs/30-workflows/task-25-ui-mvp-w8-par-routes-smoke-coverage/` |
| workflow_state | `spec_created` |
| Classification | `implementation / NON_VISUAL` |

## 苦戦箇所

Task-25 confirmed that `app/error.tsx` exists but the current smoke suite has no deterministic route or fixture that triggers the error boundary without changing production behavior.

## リスクと対策

| Risk | Mitigation |
| --- | --- |
| Test-only throw route leaks into production behavior | Keep the trigger fixture test-only or mock-only |
| Runtime error assertion becomes flaky | Assert stable error-boundary selectors and status behavior separately |

## 検証方法

- Add a deterministic Playwright fixture or route that triggers `app/error.tsx`.
- Verify the error boundary selector and a11y profile.
- Confirm task-25 matrix can replace `N/A-runtime-observation` for `error.tsx`.

## スコープ

Included: deterministic error-boundary observation and smoke assertion.

Excluded: visual baseline expansion and loading-state latency strategy.
