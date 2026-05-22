# Lessons Learned: Issue #547 Cloudflare Audit Logs Redacted Feature Export

Issue #547 は production D1 `cf_audit_log` から ML 用 redacted feature JSONL を read-only export する implementation / NON_VISUAL task。local fixture evidence は完了し、production 90 day export は user approval gate に残す。

| ID | symptom | cause | recurrence condition | 5-minute resolution | evidence path |
| --- | --- | --- | --- | --- | --- |
| L-ISSUE547-001 | fixture export PASS を production runtime PASS と誤読しやすい | local JSON fixture と production D1 read-only export の evidence root が近い | `PASS` とだけ書き、`PENDING_RUNTIME_EVIDENCE` を分離しない | fixture files と production files を別名にし、production は `production-pending-user-gate.md` に固定する | `docs/30-workflows/issue-547-cf-audit-logs-redacted-production-feature-export/outputs/phase-11/production-pending-user-gate.md` |
| L-ISSUE547-002 | raw audit row / `raw_json` が feature export 境界を越えかける | D1 row reader を汎用化すると cold storage export と ML feature export の責務が混ざる | D1 client が SELECT * で row object を返す | `readEventsForFeatureExport()` は explicit SELECT list にし、module boundary から `raw_json` を返さない | `scripts/cf-audit-log/d1-client.ts` |
| L-ISSUE547-003 | leakage grep が UUID / hash 系の安全な値も token-like として誤検知する | ML features には identifier-like 値が残るが、raw token と区別が必要 | secret grep を export 後の JSONL に単純適用する | UUID allow-list と token-like block を分け、positive fixture と clean fixture の両方を test に置く | `scripts/cf-audit-log/evaluation/secret-leakage-grep.ts`, `scripts/cf-audit-log/__tests__/feature-export.test.ts` |
| L-ISSUE547-004 | CLOSED Issue の後続実装で PR 文言が Issue を再 close しそうになる | Issue #547 は既に CLOSED で、実装 PR は reference-only でよい | Phase 13 template に `Closes #547` が残る | Phase 13 に `Refs #547 only` を明記し、`Closes/Fixes/Resolves` を禁止する | `docs/30-workflows/issue-547-cf-audit-logs-redacted-production-feature-export/phase-13.md` |
| L-ISSUE547-005 | Phase 12 が strict 7 file existence だけで false green になりやすい | SSOT / LOGS / lessons / artifact inventory / skill feedback routing が別ファイルに散る | `phase12-task-spec-compliance-check.md` が AC と sync target を見ない | AC matrix、Phase 11 evidence、artifact parity、same-wave sync、skill routingを同じ compliance check に入れる | `docs/30-workflows/issue-547-cf-audit-logs-redacted-production-feature-export/outputs/phase-12/phase12-task-spec-compliance-check.md` |

## 5-minute Checklist

1. Confirm workflow root is active `docs/30-workflows/issue-547-cf-audit-logs-redacted-production-feature-export/` until Phase 13 merge.
2. Run fixture export and leakage/schema validation locally before any production command.
3. Keep production command behind `--confirm-production-export` and user approval.
4. Verify `cmp -s artifacts.json outputs/artifacts.json`.
5. Update runbook, observability spec, task-workflow-active, quick-reference/resource-map, LOGS, lessons, and artifact inventory in one wave.
