# Audit Correlation

> 管理: `.claude/skills/aiworkflow-requirements/`
> 状態: implemented-local / implementation / NON_VISUAL / fixture evidence captured / runtime pending
> 対象 workflow: `docs/30-workflows/issue-516-github-audit-log-cross-source-correlation/`

## 目的

Cloudflare Audit Logs と GitHub organization audit log を redact-safe な `fingerprintHash` で相関し、HIGH severity の security event を単一 incident timeline として扱う。

## 入出力契約

| 入力 | 出力 | 境界 |
| --- | --- | --- |
| GitHub `/orgs/{org}/audit-log` event | `NormalizedAuditEvent(source="github")` | production live fetch は follow-up。Issue #516 は fixture + contract test まで |
| Cloudflare audit finding | `NormalizedAuditEvent(source="cloudflare")` | current canonical upstream は `docs/30-workflows/completed-tasks/issue-408-cf-audit-logs-monitoring/` |
| `NormalizedAuditEvent[]` | `CorrelatedFinding[]` | `fingerprintHash` group を timeline sort |

## Redaction Policy

| Raw value | Persisted value | Rule |
| --- | --- | --- |
| actor email local-part | hash input only | plain local-part 保存禁止 |
| actor email domain | `actorDomain` | domain のみ保存可 |
| full IP address | `ipPrefix` | full IPv4 / IPv6 保存禁止 |
| full user agent | `userAgentBucket` | raw UA 保存禁止 |
| PAT / secret / salt | none | docs / logs / evidence / source 保存禁止 |

`fingerprintHash` は SHA-256 + per-environment salt + canonical input で生成する。email がある場合は `email|<localPart>|<domain>`、email が無い場合は `network|<ipPrefix>|<uaBucket>` を canonical input とする。salt は `AUDIT_CORRELATION_SALT` として 1Password / Cloudflare Secrets から注入し、repository には実値を置かない。rotation 時は `fingerprintVersion` を増やし、旧 version と混在 join しない。

## MVP Boundary

Issue #516 の実装範囲は fixture-driven verify、redaction / fingerprint / correlation engine、GitHub fetch client contract test、CI grep gate、runbook dry-run まで。production GitHub audit log live 接続、Cloudflare Worker endpoint、実 secret 登録、branch protection 必須 status check の適用は follow-up。

## Issue #553 Live Wiring Formalization

Issue #553 is `implemented-local / implementation / NON_VISUAL` at `docs/30-workflows/issue-553-live-audit-correlation-endpoint/`. It does not reopen the closed GitHub issue and does not execute Cloudflare runtime mutation without user approval.

Planned implementation contract:

| Boundary | Contract |
| --- | --- |
| Worker route | `POST /internal/audit-correlation/run` with `Authorization: Bearer <AUDIT_CORRELATION_INTERNAL_TOKEN>` and timing-safe comparison |
| Scheduled entry | Worker cron `*/15 * * * *` calls the same `runCorrelation()` orchestration path |
| GitHub source | `/orgs/{org}/audit-log` live fetch via `GITHUB_AUDIT_PAT`; repository stores no PAT value |
| Persistence | D1 `audit_correlation_findings` stores redact-safe fields only |
| Notification | HIGH severity findings post to Slack incoming webhook with runbook URL and no secret/raw PII |
| Evidence | Phase 11 local/staging evidence is reserved for the implementation wave; production evidence remains user-gated |

Allowed persisted fields for FU-01: `fingerprint_hash_prefix`, `fingerprint_version`, `actor_domain`, `ip_prefix`, `ua_bucket`, `severity`, `event_type`, `reason`, `observed_at`, `created_at`.

Forbidden fields remain unchanged: full email, full IP, raw user agent, PAT, webhook URL, salt literal, internal token.

State split: `implemented-local` means route / cron hook / D1 migration / Slack notify / script / CI / runbook source changes exist locally. It does not mean Cloudflare deploy, D1 apply, secret injection, or production runtime evidence has been executed.

## Live wiring (Issue #553) implementation landing

Issue #553 implementation wave delivers the route / cron / persist / Slack wiring:

- `apps/api/src/routes/audit-correlation/run.ts` mounts `POST /internal/audit-correlation/run` with timing-safe Bearer comparison and 401 redact-safe body.
- `apps/api/src/audit-correlation/scheduled.ts` runs on the existing `*/15 * * * *` cron (shared with forms response sync) so production cron count stays at 3.
- `apps/api/src/audit-correlation/run-correlation.ts` orchestrates GitHub live fetch + Cloudflare D1 `cf_audit_log` load → redact → correlate → `persistFindings` → `notifyHighFindingsToSlack`.
- `apps/api/src/audit-correlation/persist.ts` writes only the allowed columns via `INSERT OR IGNORE` against `audit_correlation_findings` (migration `0017_audit_correlation_findings.sql`).
- `apps/api/src/audit-correlation/notify-slack.ts` posts HIGH findings to the incoming webhook; payload contains fingerprint prefix (8 chars), domain, ipPrefix, uaBucket, severity, eventType, reason, observed_at, environment, and the public runbook URL only.
- CI gate `.github/workflows/audit-correlation-verify.yml` adds bats `live-mode.bats` and a source-tree grep gate for `hooks.slack.com/services/...` / `ghp_...` / `ghs_...` / `github_pat_...` literals.

Cloudflare runtime mutation (D1 migrate / secret put / deploy) remains user-gated and is documented in `docs/runbooks/audit-correlation.md` under "live wiring 手順".

### Additional implementation surface (Issue #553 wave 2026-05-08 sync)

- `apps/api/src/audit-correlation/runbook-url.ts` derives the runbook anchor (`permission-change-with-ip-shift` / `token-rotate-without-permission-change` / `login-fail-burst` / `unknown`) from `CorrelatedFinding` shape and composes the public `#anchor` URL via `buildRunbookUrl()`. This module is the only source of truth for Slack `Open Runbook` button URLs and must not concatenate `runbookBaseUrl` elsewhere.
- `apps/api/src/audit-correlation/__tests__/{run-route,run-correlation,persist,notify-slack,runbook-url}.test.ts` provide route-level authz / orchestration / D1 contract / Slack payload / anchor selection coverage. Production grep gate scope is restricted to `apps/api/src/audit-correlation`, `apps/api/src/routes/audit-correlation`, `scripts/audit-correlation`; `__tests__/` is in scope, so fixture literals must remain non-matching against the gate patterns (see lessons-learned L-AC553-004).

## Cloudflare Secrets (5 種) op-reference rule

Live wiring requires exactly 5 secrets. Each has a 1Password op-reference path and is injected via `bash scripts/cf.sh secret put` (CLAUDE.md `scripts/cf.sh` rule). Repository, docs, evidence, logs, and source must never store the literal value.

| Secret name | Purpose | 1Password op-reference (placeholder shape) | Validation in `run-correlation.ts` |
| --- | --- | --- | --- |
| `GITHUB_AUDIT_PAT` | GitHub `/orgs/{org}/audit-log` live fetch | `op://Employee/ubm-hyogo-env/GITHUB_AUDIT_PAT_<ENV>` | required; redacted from any error string |
| `SLACK_AUDIT_INCIDENT_WEBHOOK_URL` | HIGH finding incoming webhook | `op://Employee/ubm-hyogo-env/SLACK_WEBHOOK_INCIDENT_<ENV>` | required; never logged in payload |
| `AUDIT_CORRELATION_SALT` | per-env salt for `fingerprintHash` | `op://Employee/ubm-hyogo-env/AUDIT_CORRELATION_SALT_<ENV>` | required; min length 16 |
| `AUDIT_CORRELATION_INTERNAL_TOKEN` | Bearer for `POST /internal/audit-correlation/run` (timing-safe compare) | `op://Employee/ubm-hyogo-env/AUDIT_CORRELATION_INTERNAL_TOKEN_<ENV>` | required; min length 32 |
| `AUDIT_CORRELATION_RUNBOOK_BASE_URL` | public runbook URL for Slack button | non-secret var; set via `wrangler.toml` `[vars]` per env | required; `#anchor` is appended in `runbook-url.ts` |

Notes:

- The 5th row is a non-secret var rather than a Cloudflare Secret, but it is part of the same env contract; `runCorrelation()` rejects when it is absent.
- `AUDIT_CORRELATION_GITHUB_ORG` is also required env but is non-secret and is set via `wrangler.toml`.
- Rotation of any secret is a Cloudflare runtime mutation and is user-gated.

## Salt rotation procedure (`fingerprintVersion` v1 → v2)

Salt rotation is incident-class history mutation. Cross-version join is forbidden.

| Step | Action | Boundary |
| --- | --- | --- |
| 1 | Decide rotation window (low traffic; cron `*/15` cadence respected). | docs only |
| 2 | Generate new salt off-platform; store in 1Password. | no repo, no logs |
| 3 | `bash scripts/cf.sh secret put AUDIT_CORRELATION_SALT --env <env>` with new value. | user-gated runtime mutation |
| 4 | Bump `fingerprintVersion` constant (currently `1`) used by `redactGitHub()` / `loadCloudflareAuditEvents()` salt input wrapper to `2`. | source change wave |
| 5 | After deploy, persisted findings start writing `fingerprint_version = 2`. Old rows remain at `1` and are read-only. | D1 contract |
| 6 | Operational queries grouping by `fingerprint_hash_prefix` MUST also filter by `fingerprint_version`. Cross-version `fingerprint_hash_prefix` collisions are coincidence, not identity. | runbook contract |
| 7 | Slack notify is unaffected by version (each finding embeds its own version implicitly via the freshly persisted row). | notify contract |

Anti-patterns:

- Rotating salt without bumping `fingerprintVersion` (silently corrupts incident timeline correlation).
- Backfilling old rows with the new hash (forbidden; salt is per-env, not per-row, and re-hash requires raw inputs which are not retained).
- Mixing version 1 and version 2 rows in a single `GROUP BY fingerprint_hash_prefix` query.

## Lessons learned (Issue #553 wave)

- **L-AC553-001 / scheduled.ts has no synchronous retry budget.** Cloudflare Worker `scheduled` handler must return promptly via `ctx.waitUntil`; in-handler `setTimeout` retry is forbidden. Failure recovery is delegated to the next cron cycle (`*/15` ⇒ ≤15 min RTO). Error logging records `name` only — never message / stack — to keep redact-safe. Source: `apps/api/src/audit-correlation/scheduled.ts`.
- **L-AC553-002 / Slack notify failure is per-finding, not per-batch.** `notifyHighFindingsToSlack()` iterates HIGH findings and increments `succeeded` only on `res.ok`; non-ok and thrown errors log `status` or `name` only. Callers MUST treat `attempted - succeeded > 0` as partial success and rely on the next cron to re-attempt via `INSERT OR IGNORE` deduplication. Source: `notify-slack.ts`.
- **L-AC553-003 / `INSERT OR IGNORE` is the deduplication primitive.** `audit_correlation_findings` enforces `UNIQUE (fingerprint_hash_prefix, observed_at, event_type)`; `persistFindings()` returns `inserted` from D1 `meta.changes`. This is what makes cron-driven retry safe. Source: `persist.ts`, migration `0017_audit_correlation_findings.sql`.
- **L-AC553-004 / Test fixture placeholders must be designed against the production grep gate regex.** The CI gate at `.github/workflows/audit-correlation-verify.yml` greps `apps/api/src/audit-correlation` (which includes `__tests__/`). Fixture values used: `https://hooks.slack.com/services/X/Y/Z` (path segment 5 chars, gate requires ≥20), `ghp_dummy_test_value_xxxxxxxxxxxxxxxxxxxxxxxx` (underscore breaks `[A-Za-z0-9]{20,}` continuity), `'a'.repeat(32)` for salt (gate matches `AUDIT_CORRELATION_SALT=...` literal form, not test variable assignment). When adding new fixtures, run the grep regexes locally before commit; do not introduce values that resemble real secrets even shape-wise.
- **L-AC553-005 / `runbook-url.ts` is the single source of runbook URL composition.** Slack payload construction must not concatenate `baseUrl + '#' + anchor` inline. `pickRunbookAnchor()` derives the anchor from finding shape so that anchor names stay synchronized with `docs/runbooks/audit-correlation.md` headings. Adding a new anchor requires updating both this module and the runbook headings in the same wave.
- **L-AC553-006 / Env validation is lift-and-throw, not soft-degrade.** `validateEnv()` in `run-correlation.ts` throws `AuditCorrelationEnvError` with the missing key list (no values). Both the cron entrypoint and route entrypoint surface this as 500/redact-safe error; callers must not catch and degrade to partial run. Salt min-16 / token min-32 are enforced here, not at deploy time.
- **L-AC553-007 / Redact-safe boundary lives in source, not just docs.** Forbidden persisted fields (full email, full IP, raw UA, PAT, webhook URL, salt literal, internal token) are enforced by (a) `redact.ts` shaping the `NormalizedAuditEvent`, (b) `persist.ts` only binding the allowed columns, (c) the bash grep gate scanning the source tree. Loosening any one layer requires updating all three plus this lessons-learned entry.

## References

- Workflow: `docs/30-workflows/issue-516-github-audit-log-cross-source-correlation/`
- Live wiring spec: `docs/30-workflows/issue-553-live-audit-correlation-endpoint/`
- Upstream: `docs/30-workflows/completed-tasks/issue-408-cf-audit-logs-monitoring/`
- Runbook target: `docs/runbooks/audit-correlation.md`
