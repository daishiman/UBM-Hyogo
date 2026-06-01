# Workflow Artifact Inventory: issue-1010-auth-view-session-contract-integration-test

| Item | Path |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1010-auth-view-session-contract-integration-test/` |
| root artifacts | `docs/30-workflows/completed-tasks/issue-1010-auth-view-session-contract-integration-test/artifacts.json` |
| output artifacts mirror | `docs/30-workflows/completed-tasks/issue-1010-auth-view-session-contract-integration-test/outputs/artifacts.json` |
| Phase 11 evidence | `docs/30-workflows/completed-tasks/issue-1010-auth-view-session-contract-integration-test/outputs/phase-11/manual-test-result.md` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/issue-1010-auth-view-session-contract-integration-test/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| source unassigned task | `docs/30-workflows/completed-tasks/issue-1010-auth-view-session-contract-integration-test/unassigned-task-specs/public-header-auth-view-session-contract-integration-test-001.md` |
| parent workflow | `docs/30-workflows/completed-tasks/public-header-session-aware-auth-view-base/` |
| implementation target | `apps/web/src/lib/auth-view/__tests__/authViewSessionContract.integration.spec.ts` |
| reference source | `apps/web/src/lib/auth.ts`, `apps/web/src/lib/auth-view/{types,resolveAuthView,getAuthView}.ts` |
| focused regression tests | `apps/web/src/lib/auth-view/__tests__/getAuthView.spec.ts`, `apps/web/src/lib/auth-view/__tests__/resolveAuthView.spec.ts`, `apps/web/src/lib/auth.spec.ts` |

Status: `implemented_local_evidence_captured / implementation / NON_VISUAL`.

Evidence:

- Focused Vitest: 4 files / 61 tests PASS.
- Typecheck: `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` exit 0.
- Lint: `mise exec -- pnpm lint` exit 0.

Contract:

- `buildAuthConfig().callbacks.session` is the producer of `session.user.memberId` / `session.user.isAdmin`.
- `resolveAuthView()` and `getAuthView()` are consumers of that app-level session shape.
- The contract test chains real producer output into both consumers and fails closed to `guest` when `memberId` is missing.

User-gated remainder: commit, push, PR. Staging authenticated runtime smoke is outside this NON_VISUAL task.

## Lessons Learned

- **L-I1010-001**: 実 `buildAuthConfig().callbacks.session`（producer）を mock せず `resolveAuthView()` / `getAuthView()`（consumers）へ連鎖する contract integration test で session field drift を検出する。
- **L-I1010-002**: production code 変更ゼロの test-only `implementation` タスクでも spec-only で凍結せず、同 cycle で実 test file + focused evidence（4 files / 61 tests PASS）へ昇格する。
- **L-I1010-003**: `vi.mock(@/lib/auth, ...importOriginal())` の spread + `vi.hoisted()` で `getAuth` のみ差し替え、`buildAuthConfig` は実物を維持して producer/consumer を両取りする。
- **L-I1010-004**: `memberId` 欠落 / 空 / whitespace → `{ kind: "guest" }`、`isAdmin` の `null` / 文字列 `"true"` → `false` という fail-closed・型強制契約を contract test で固定（invariant #11）。
- **L-I1010-005**: `Object.keys(session.user).sort()` で producer 出力 field 集合を `["email","isAdmin","memberId","name"]` に固定し、`ignoredRole` が consumer へ漏れないことを assert する。
- **L-I1010-006**: 親 workflow の unassigned-task FU-001 を独立 workflow で消化し、元 spec の status を `未実施` → `consumed` 化 + `canonical_workflow` 逆リンク。新規 follow-up は detection 0 件。

詳細: [lessons-learned-issue-1010-auth-view-session-contract-integration-test-2026-05.md](../lessons-learned/lessons-learned-issue-1010-auth-view-session-contract-integration-test-2026-05.md)
