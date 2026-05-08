# Audit Correlation

> 管理: `.claude/skills/aiworkflow-requirements/`
> 状態: implemented-local / implementation / NON_VISUAL / fixture evidence captured / runtime pending
> 対象 workflow: `docs/30-workflows/completed-tasks/issue-516-github-audit-log-cross-source-correlation/`

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

## References

- Workflow: `docs/30-workflows/completed-tasks/issue-516-github-audit-log-cross-source-correlation/`
- Upstream: `docs/30-workflows/completed-tasks/issue-408-cf-audit-logs-monitoring/`
- Downstream (Issue #554, branch protection required check): `docs/30-workflows/issue-554-audit-correlation-branch-protection-required-check/` / `references/branch-protection.md`
- Runbook target: `docs/runbooks/audit-correlation.md`
- Lessons learned: `lessons-learned/lessons-learned-issue-516-audit-correlation-2026-05.md`、`lessons-learned/lessons-learned-issue-554-branch-protection-required-check-2026-05.md`
