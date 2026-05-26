# Runtime Evidence Follow-up Pattern

Use this pattern when a completed local implementation still needs staging or provider evidence, and the runtime operation is user-gated.

## Required Local Implementation

Do not stop at a spec-only follow-up when the helper and evidence shell can be created safely without external mutation.

Create these local files in the same cycle:

| Artifact | Requirement |
| --- | --- |
| helper script | A repo-local command under `scripts/` with `--dry-run`, explicit environment selection, bounded identifier validation before command construction, HTTP status capture for mutating calls, and fail-closed confirmation before mutation |
| evidence placeholder | A tracked evidence file at the parent workflow evidence path, with `runtime_pending` rows for each scenario |
| parent cross-link | Parent Phase 11 result and artifacts keep runtime status pending but point to the real placeholder path |
| child workflow | Phase 12 compliance records `implemented_local_runtime_pending`, not `spec_created`, once the helper exists |

## Runtime Boundary

The following remain user-gated unless the user explicitly approves them:

- Cloudflare deploys
- D1 mutation or rollback POST calls
- provider delivery checks
- completion mutation that promotes parent Phase 11 / Gate-C to passed
- commit, push, PR

## Redaction Contract

Shell helpers that touch provider output must pipe all stdout through redaction before evidence capture. At minimum, redact webhook URLs, bearer tokens, Cloudflare auth keys, and token query parameters. Expand the pattern only when a new provider introduces a new secret shape.

## Command Construction Contract

Runtime smoke helpers that interpolate user-provided IDs into URLs or D1 SQL must validate the ID before constructing commands. Use a narrow allowlist such as `[A-Za-z0-9._:-]+` unless the owning API contract requires a broader shape. Mutating HTTP calls must record `http_status` in the redacted evidence stream so operators can distinguish provider failure from rollback API failure.

## Example

Issue #908 created `scripts/runtime-smoke/schema-alias-rollback.sh` and parent evidence placeholder `outputs/phase-11/evidence/staging-smoke.md` while keeping staging rollback execution user-gated.
