# Lessons Learned — Issue #560 Next Standalone Instrumentation Patch

## L-560-001: Current Script First

Symptom: A generated spec treated an existing script as if it were not implemented and froze a different target path.

Resolution: Phase 2 must inspect current script input/output paths before Phase 3 freezes API constants.

## L-560-002: Logical Artifact vs Physical Path

Symptom: "instrumentation.js exists" was correct at the logical level but wrong at the physical path level.

Resolution: Record both the logical artifact and the physical path: `.next/standalone/apps/web/.next/server/instrumentation.js`.

## L-560-003: CI Workflow Placeholder Gate

Symptom: a generic workflow filename placeholder stayed in the spec after workflow discovery.

Resolution: Implementation specs must resolve CI workflow names during Phase 2. For this task the owner is `.github/workflows/pr-build-test.yml`.

## L-560-004: RED With Existing Code

Symptom: TDD RED wording assumed the implementation file did not exist.

Resolution: When code exists, RED means "existing code fails the new acceptance criteria", not "script missing".

## L-560-005: Patch Script Idempotency

Symptom: A second run of the patch script could re-copy / re-write `instrumentation.js` and clobber a manually fixed file or surface a false-positive `--verify-only` failure.

Resolution: Patch scripts that mutate `.next/standalone/...` outputs must be idempotent: detect the post-patch fingerprint (presence + content hash) before writing, and short-circuit when the target already matches. Provide an explicit `--verify-only` mode that exits non-zero only when the fingerprint diverges. Source: `scripts/patch-next-standalone-instrumentation.mjs`.

## L-560-006: Silent Failure Prevention On Trace Parse

Symptom: When the OpenNext server-trace parse failed (missing/malformed `.nft.json`), the script previously continued with an empty include list and produced a standalone bundle that lost `instrumentation.js` without any diagnostic — a classic silent failure.

Resolution: Trace parse failures must throw with a canonical error string (`"trace parse failure"`) so CI gates and the runbook RUN BOOK can match on it. Never fall back to an empty include set; either succeed with the resolved physical path (`.next/standalone/apps/web/.next/server/instrumentation.js`) or fail loudly. Tests in `scripts/__tests__/patch-next-standalone-instrumentation.test.mjs` lock this contract.

## L-560-007: OpenNext / Next.js Upstream Workaround Boundary

Symptom: It was unclear whether the patch script is a permanent fix or a workaround that should be removed once upstream resolves the standalone instrumentation propagation bug.

Resolution: Document the workaround boundary explicitly in the runbook (`docs/runbooks/next-standalone-instrumentation-patch.md` removal-criteria section) and in `unassigned-task-detection.md` as a Deferred Boundary, not as a new unassigned task. The removal trigger is: upstream Next.js / OpenNext ships standalone instrumentation propagation natively AND `--verify-only` passes without the patch step. Until both conditions hold, the patch script is canonical.
