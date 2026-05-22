# Unassigned Task Detection

| 検出項目 | status | formalize decision | path | 根拠 |
| --- | --- | --- | --- | --- |
| placeholder token expressions | done | same-cycle fix | `docs/00-getting-started-manual/specs/09c-primitives.md` | `token-sized` / `09b-token-value` / `token-mix` を 0 件化 |
| §99 exclusion boundary | done | same-cycle fix | `docs/00-getting-started-manual/specs/09c-primitives.md` | TweaksPanel / data-theme switcher / AvatarStoreProvider#localStorage を復元 |
| deterministic verification script | done | same-cycle fix | `scripts/verify-09c-no-visual-values.sh` | grep gate + placeholder gate + §99 content gate を実体化 |
| branch adjacent code diff | done | same-cycle evidence separation | `apps/api/src/repository/identity-conflict.ts` | task-19 primary deliverable から分離して Phase 12 summary に記録 |

新規 open unassigned task は 0 件。検出した漏れは同一 cycle 内で修正済み。
