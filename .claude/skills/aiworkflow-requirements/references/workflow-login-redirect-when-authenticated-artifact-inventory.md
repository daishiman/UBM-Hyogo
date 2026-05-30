# Workflow Artifact Inventory: login-redirect-when-authenticated

| item | path |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/login-redirect-when-authenticated/` |
| root artifacts | `docs/30-workflows/completed-tasks/login-redirect-when-authenticated/artifacts.json` |
| output artifacts mirror | `docs/30-workflows/completed-tasks/login-redirect-when-authenticated/outputs/artifacts.json` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/login-redirect-when-authenticated/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| source task | `docs/30-workflows/public-header-logged-in-nav-cleanup/tasks/task-d-login-redirect-when-authenticated.md` |

## Implementation

| path | role |
| --- | --- |
| `apps/web/src/lib/url/safe-next.ts` | `searchParams.next` whitelist wrapper over `isSafeInternalRedirect`, with length and colon guards |
| `apps/web/src/lib/url/__tests__/safe-next.spec.ts` | 16-case open-redirect, non-string, length, and `/login` loop guard |
| `apps/web/app/login/page.tsx` | Server Component session check and authenticated redirect before anonymous login render |
| `apps/web/app/login/__tests__/page.spec.tsx` | anonymous render regression plus authenticated redirect cases |

## Evidence

```bash
mise exec -- pnpm exec vitest run apps/web/src/lib/url/__tests__/safe-next.spec.ts apps/web/app/login/__tests__/page.spec.tsx
```

Result: PASS, 2 files, 22 tests.

## Boundary

Local implementation and deterministic evidence are captured. Browser/staging runtime confirmation, commit, push, and PR remain user-gated.

## Lessons Learned

詳細は [`lessons-learned/lessons-learned-login-redirect-when-authenticated-2026-05.md`](../lessons-learned/lessons-learned-login-redirect-when-authenticated-2026-05.md) を参照。

- **L-LRWA-001** 既存 predicate の薄い wrapper として helper を導入する（`safeNext` は `isSafeInternalRedirect` を内部呼び出しし、`MAX_NEXT_LENGTH=256` と colon guard のみ上乗せ）
- **L-LRWA-002** 同階層 `ls` / `rg --files` で命名規則多数派を実測し、spec の camelCase literal よりも既存 kebab-case path + camelCase export 規約を優先する
- **L-LRWA-003** 自己ループ防止は helper 側で `null` に倒し、call site は `safeNext(...) ?? "/profile"` 1 行で受ける
- **L-LRWA-004** server-side redirect wiring + 純関数 helper のみのタスクは Phase 1 で `NON_VISUAL` 早期分類し、Phase 11 は focused vitest + typecheck + lint で close out する
- **L-LRWA-005** skill 同期は同一 wave で SKILL history / changelog / LOGS / quick-reference / resource-map / topic-map / task-workflow-active / artifact inventory / lessons-learned + `indexes:rebuild` の 9 surface 全反映を確認する
