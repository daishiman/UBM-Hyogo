# Unassigned Task Detection

| Item | Status | Formalize decision | Reason |
| --- | --- | --- | --- |
| Runtime dynamic stableKey guard | open | Defer to implementation/release backlog | Static lint does not guarantee runtime string composition. |
| 03b explicit rollout confirmation | open | Defer | Common lint config may apply automatically, but explicit trace is still needed. |
| consent key literal rule | open | Defer | Related invariant #2, but outside stableKey rule scope. |
| Legacy stableKey literal cleanup | formalized | `docs/30-workflows/unassigned-task/task-03a-stablekey-literal-legacy-cleanup-001.md` | Strict mode currently finds 147 existing violations; blocking CI cannot be enabled until this reaches 0. |
| Strict CI gate integration | formalized | `docs/30-workflows/unassigned-task/task-03a-stablekey-strict-ci-gate-001.md` | `package.json` exposes strict mode, but GitHub Actions is not yet guaranteed to run it as a blocking gate. |

Required sections for any formalized follow-up:

- 苦戦箇所【記入必須】
- リスクと対策
- 検証方法
- スコープ（含む / 含まない）
- 完了条件
