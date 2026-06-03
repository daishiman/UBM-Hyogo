# issue-1056-kv-alert-policy-binding-drift-detection artifact inventory

## Summary

| Item | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1056-kv-alert-policy-binding-drift-detection/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| issue | #1056 OPEN at spec creation → CLOSED during this cycle (`closedAt: 2026-06-02T03:32:56Z`); docs state reconciled to actual without reopening; Issue mutation is user-gated |
| purpose | Detect drift between active KV/R2 bindings in `apps/api/wrangler.toml` and Cloudflare alert policy `enabled` state |

## Implementation

| Category | Paths |
| --- | --- |
| detector | `infra/cloudflare-alerts/lib/binding-policy-drift.ts` |
| CLI | `infra/cloudflare-alerts/lib/cli.ts`, `scripts/cf.sh`, `package.json` (`cf:alerts:binding-drift`) |
| CI | `.github/workflows/cloudflare-alerts-drift.yml` PR validate gate |
| tests | `infra/cloudflare-alerts/lib/__tests__/binding-policy-drift.spec.ts`, `scripts/__tests__/cf-alerts-cli.spec.ts` |
| system spec | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` |

## Boundary

The detector is local-only and read-only. It does not call Cloudflare APIs, does not require `CLOUDFLARE_ALERTS_TOKEN_READ`, and does not apply or enable alert policies. Policy enablement decisions and runtime apply remain UT-17-followup-006/user-gated.

## Evidence

- `pnpm test:alerts`
- `pnpm cf:alerts:binding-drift --ci`
- `git status --short`
- `git diff --stat`

## Lessons Learned

`.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-1056-kv-alert-policy-binding-drift-detection-2026-06.md`（L-I1056-001..006）:

| ID | Lesson |
| --- | --- |
| L-I1056-001 | wrangler.toml はコメント尊重 line parser で読み「宣言あり・未活性（コメントアウト）」を正しく未活性扱いする（TOML ライブラリは中間状態を取りこぼす） |
| L-I1056-002 | drift 判定は `isActive` / `enabled` の 2 軸から導出する副作用ゼロの純関数 `buildBindingPolicyDrift` に閉じ込め、I/O（`loadActiveBindings`）と分離する |
| L-I1056-003 | read-only・secret 不要・exit code contract（0 整合 / 2 drift / 64 usage）で CI gate を安価にし、PR validate job に secret 注入なしで組み込む |
| L-I1056-004 | 設計型（`ActiveBindingSet` / `BindingPolicyMapping`）と実装型（`ActiveBindings` / `policyNames`）の drift は実装 landed シェイプを正本に同一サイクルで追従させる |
| L-I1056-005 | 2 種（KV / R2）しかない mapping は JSON 外部化せず const `BINDING_POLICY_MAP` で持つ（YAGNI・可読性優先） |
| L-I1056-006 | Issue state divergence（spec 作成時 OPEN → サイクル中 CLOSED）は reopen せず docs の現在形 state 記述を実態へ整合させる |
