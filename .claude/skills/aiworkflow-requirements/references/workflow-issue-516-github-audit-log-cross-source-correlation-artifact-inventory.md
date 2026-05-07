# Artifact Inventory — issue-516-github-audit-log-cross-source-correlation

## canonical root

`docs/30-workflows/issue-516-github-audit-log-cross-source-correlation/`

## root artifacts

| artifact | status |
| --- | --- |
| `index.md` | present |
| `artifacts.json` | present |
| `phase-01.md` ... `phase-13.md` | present |

## phase 12 strict 7 files

| artifact | status |
| --- | --- |
| `outputs/phase-12/main.md` | present |
| `outputs/phase-12/implementation-guide.md` | present |
| `outputs/phase-12/system-spec-update-summary.md` | present |
| `outputs/phase-12/documentation-changelog.md` | present |
| `outputs/phase-12/unassigned-task-detection.md` | present |
| `outputs/phase-12/skill-feedback-report.md` | present |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | present |

## phase 11 evidence (NON_VISUAL alternative)

| artifact | status |
| --- | --- |
| `outputs/phase-11/main.md` | present |
| `outputs/phase-11/typecheck.log` | present |
| `outputs/phase-11/lint.log` | present |
| `outputs/phase-11/test.log` | present (vitest 26 件 PASS) |
| `outputs/phase-11/build.log` | present |
| `outputs/phase-11/bats.log` | present (12 cases) |
| `outputs/phase-11/shellcheck.log` | present |
| `outputs/phase-11/actionlint.log` | present |
| `outputs/phase-11/grep-gate.log` | present (PII/secret 検出 PASS) |
| `outputs/phase-11/coverage.log` | present |
| `outputs/phase-11/high-alert-sample.json` | present (correlated finding sample, redaction済) |

## implementation artifacts

| artifact | status |
| --- | --- |
| `apps/api/src/audit-correlation/types.ts` | branded `FingerprintHash` / Severity / NormalizedAuditEvent / CorrelatedFinding |
| `apps/api/src/audit-correlation/errors.ts` | `AuditFetchAuthError` / `AuditFetchRateLimitError` / `FingerprintInputEmptyError` |
| `apps/api/src/audit-correlation/redact.ts` | `normalizeEmail` / `truncateIp` (IPv4 /24, IPv6 /48) / `bucketUserAgent` (7 labels) / `computeFingerprint` (Web Crypto SHA-256 + per-env salt) / `redactGitHub` / `redactCloudflare` |
| `apps/api/src/audit-correlation/github-fetch.ts` | `/orgs/{org}/audit-log` fetcher with Link pagination, 401→AuthError, 429→Retry-After exponential backoff (max 3) |
| `apps/api/src/audit-correlation/correlate.ts` | fingerprint group → occurredAt sort → HIGH (cross-source perm change ≤5min + ipPrefix Δ) / MEDIUM / LOW |
| `apps/api/src/audit-correlation/index.ts` | barrel export |
| `apps/api/src/audit-correlation/__tests__/redact.test.ts` | redaction policy contract |
| `apps/api/src/audit-correlation/__tests__/correlate.test.ts` | severity decision contract |
| `apps/api/src/audit-correlation/__tests__/github-fetch.test.ts` | pagination / auth error / rate limit backoff |
| `apps/api/src/audit-correlation/__tests__/contract.test.ts` | NormalizedAuditEvent shape contract |
| `scripts/audit-correlation/runner.ts` | tsx CLI entry (apps/api 関数を呼び JSON 出力) |
| `scripts/audit-correlation/run.sh` | shell wrapper（`--github` / `--cloudflare` / `--salt` / `--out`、esbuild mismatch 時 `pnpm dlx tsx@4.21.0` fallback） |
| `scripts/audit-correlation/grep-gate.sh` | 出力 JSON の PII/secret 検出（IPv4 / IPv6 / email / UA / `ghp_*` / `github_pat_*` / salt literal） |
| `scripts/audit-correlation/fixtures/*.json` | 6 件 (github-org-update-member, github-workflow-run-success, cloudflare-login-fail, cloudflare-token-rotate, edge-empty, edge-rate-limit) |
| `scripts/audit-correlation/__tests__/grep-gate.bats` | 9 cases |
| `scripts/audit-correlation/__tests__/runner-determinism.bats` | 3 cases |
| `.github/workflows/audit-correlation-verify.yml` | typecheck → lint → vitest → bats → shellcheck → actionlint |
| `.github/CODEOWNERS` | `apps/api/src/audit-correlation/**` / `scripts/audit-correlation/**` / `.github/workflows/audit-correlation-verify.yml` 追加 |
| `docs/runbooks/audit-correlation.md` | HIGH alert 6 step runbook + salt rotation 手順 + Cloudflare Secrets 登録手順 |

## same-wave skill sync

| target | file | state |
| --- | --- | --- |
| references / SSOT | `references/audit-correlation.md` | 新規 SSOT (目的 / 入出力契約 / Redaction Policy / MVP Boundary / References) |
| references / task-workflow | `references/task-workflow-active.md` | issue-516 task definition row 追加 |
| references / artifact inventory | この file | 新規作成 |
| references / lessons-learned | `lessons-learned/lessons-learned-issue-516-audit-correlation-2026-05.md` | 新規作成（join key 改訂・fixture-only boundary・grep-gate salt rotation） |
| indexes / quick-reference | `indexes/quick-reference.md` L7-23 | issue-516 早見導線追加 |
| indexes / resource-map | `indexes/resource-map.md` L18 | issue-516 canonical row 追加 |
| indexes / topic-map | `indexes/topic-map.md` L3140-3149 | `references/audit-correlation.md` セクション + 本 inventory 行 register |
| indexes / keywords | `indexes/keywords.json` | Audit / Correlation / Redaction / MVP / Boundary 等 8 キーワード追加 |
| changelog | `changelog/20260507-issue516-audit-correlation.md` | wave entry 追加 |

## boundary

- Phase 12 close-out: `implemented-local / implementation / NON_VISUAL / fixture evidence captured / runtime pending`.
- Phase 12 verdict: `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`（4 conditions all PASS / strict 7 files present）.
- fixture-only MVP の境界を明示: production GitHub audit log live fetch / Cloudflare Worker endpoint / 実 secret 登録 / branch protection 必須 status check は follow-up。

## upstream / downstream

| 関係 | workflow |
| --- | --- |
| upstream | `docs/30-workflows/completed-tasks/issue-408-cf-audit-logs-monitoring/` (Cloudflare audit logs canonical source) |
| source unassigned | `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-04-github-audit-merge.md`（formalized_by_issue_516） |

## deferred follow-ups

| ID | scope | gate |
| --- | --- | --- |
| FU-01 | Live audit-correlation endpoint（Cloudflare Worker route + production GitHub PAT 登録） | user-approved live wiring wave |
| FU-02 | Branch protection: `audit-correlation-verify / verify` を required status check に登録 | first empirical green run 後 |
| FU-03 | Salt rotation 自動化（`fingerprintVersion=2` 移行） | live wiring 設計後 |
| FU-04 | D1 schema 設計（incident 永続化） | live wiring 後の persistence 必要性確定後 |
