# task-25-followup-loading-state-observation-fixture

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | `task-25-followup-loading-state-observation-fixture` |
| Source | `docs/30-workflows/task-25-ui-mvp-w8-par-routes-smoke-coverage/` |
| workflow_state | `spec_created` |
| Classification | `implementation / NON_VISUAL` |

## 苦戦箇所

Task-25 confirmed that `loading.tsx` exists, but the current smoke suite has no stable latency-control fixture for observing loading UI without relying on flaky network sleeps.

## リスクと対策

| Risk | Mitigation |
| --- | --- |
| Network delay based test flakes | Use deterministic mock latency or controlled route fixture |
| Loading state differs by route group | Cover root loading and admin audit loading separately if both remain in scope |

## 検証方法

- Add deterministic latency control for the target route.
- Assert the loading selector before resolving the deferred response.
- Confirm task-25 matrix can replace `N/A-runtime-observation` for `loading.tsx`.

## スコープ

Included: deterministic loading-state observation fixture and smoke assertion.

Excluded: visual baseline expansion and error-boundary fixture design.
