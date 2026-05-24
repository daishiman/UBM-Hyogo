# Phase 12 Task Spec Compliance Check

## 1. Summary verdict

`completed (local implementation evidence captured / NON_VISUAL / 2026-05-23)`.

`apps/web` response security headers hardening を `implementation` / `NON_VISUAL` として close-out。`apps/web/src/lib/security-headers.ts` を SSOT に `apps/web/middleware.ts` で全 route response へ `applySecurityHeaders()` を適用し、CSP は初期 `Content-Security-Policy-Report-Only`、`Permissions-Policy` は `browsing-topics` を列挙しない、`require-trusted-types-for` / `trusted-types` は出力しない契約で固定した。focused Vitest、Playwright HTTP smoke、web typecheck、web lint、build いずれもローカル PASS。staging / production response 検証、commit、push、PR は user-gated。

## 2. Changed-files classification

| Path | Classification | Status |
| --- | --- | --- |
| `apps/web/src/lib/security-headers.ts` | implementation (SSOT) | completed (local) |
| `apps/web/middleware.ts` | implementation (middleware injection) | completed (local) |
| `apps/web/src/lib/security-headers.spec.ts` | focused unit test | completed (local) |
| `apps/web/playwright/tests/security-headers.spec.ts` | HTTP response smoke | completed (local) |
| `docs/30-workflows/apps-web-security-headers-hardening/**` | workflow spec / evidence | completed (local) |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | aiworkflow index | completed (same-wave sync) |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | aiworkflow index | completed (same-wave sync) |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow ledger | completed (same-wave sync) |
| `.claude/skills/aiworkflow-requirements/references/security-web-response-headers.md` | new reference (SSOT) | completed (same-wave sync) |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md` | reference (middleware boundary) | completed (same-wave sync) |
| `.claude/skills/aiworkflow-requirements/references/workflow-apps-web-security-headers-hardening-artifact-inventory.md` | artifact inventory | completed (same-wave sync) |
| `.claude/skills/aiworkflow-requirements/SKILL.md` / `SKILL-changelog.md` | skill ledger | completed (same-wave sync) |

## 3. `workflow_state` and phase status consistency

| Item | Value | Status |
| --- | --- | --- |
| `artifacts.json.status` | `implemented_local_evidence_captured` | completed (local) |
| `artifacts.json.metadata.workflow_state` | `implemented_local_evidence_captured` | completed (local) |
| `artifacts.json.metadata.taskType` | `implementation` | completed (local) |
| `artifacts.json.metadata.visualEvidence` | `NON_VISUAL` | completed (local) |
| Phase 1-10 | all `completed` with artifact pointer | completed (local) |
| Phase 11 | `completed` (NON_VISUAL) with unit / Playwright / typecheck / lint / build PASS | completed (local) |
| Phase 12 | strict 7 outputs present | completed (local) |
| Phase 13 | `blocked` pending user approval | runtime_pending (user-gated PR) |

## 4. Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| manual test result | outputs/phase-11/manual-test-result.md | present |
| screenshot | n/a (NON_VISUAL) | n/a |

## 5. Phase 12 strict 7 file inventory

| Output | Status |
| --- | --- |
| `main.md` | completed (present) |
| `implementation-guide.md` | completed (present) |
| `system-spec-update-summary.md` | completed (present) |
| `documentation-changelog.md` | completed (present) |
| `unassigned-task-detection.md` | completed (present) |
| `skill-feedback-report.md` | completed (present) |
| `phase12-task-spec-compliance-check.md` | completed (present) |

`outputs/artifacts.json` は workflow root `artifacts.json` の Phase 12 strict 7 mirror として配置し、root/output parity を PASS とする。

## 6. Skill/reference/system spec same-wave sync

| Target | Status | Evidence |
| --- | --- | --- |
| aiworkflow `quick-reference.md` | completed (same-wave) | apps-web-security-headers-hardening entry added |
| aiworkflow `resource-map.md` | completed (same-wave) | workflow row added with canonical paths |
| aiworkflow `task-workflow-active.md` | completed (same-wave) | active workflow registered |
| aiworkflow `security-web-response-headers.md` | completed (same-wave) | new SSOT reference for response security headers |
| aiworkflow `deployment-cloudflare-opennext-workers.md` | completed (same-wave) | middleware injection boundary appended |
| aiworkflow artifact inventory | completed (same-wave) | `workflow-apps-web-security-headers-hardening-artifact-inventory.md` |
| `SKILL.md` / `SKILL-changelog.md` | completed (same-wave) | new reference indexed and changelog entry recorded |
| Skill feedback routing | completed (no template mutation needed) | improvements recorded in `outputs/phase-12/skill-feedback-report.md` |

## 7. Runtime or user-gated boundary

| Boundary | Status | Reason |
| --- | --- | --- |
| Local implementation | completed (local) | SSOT + middleware + tests implemented |
| Focused Vitest | completed (local) | `apps/web` suite 872 passed / 1 skipped |
| Playwright HTTP smoke | completed (local) | 6 passed (desktop-chromium) |
| Web typecheck | completed (local) | `pnpm --filter @ubm-hyogo/web typecheck` exit 0 |
| Web lint | completed (local) | `pnpm --filter @ubm-hyogo/web lint` exit 0 |
| Build | completed (local) | OpenNext Workers build exit 0 |
| Grep guard | completed (local) | `127.0.0.1:8888` / `browsing-topics` / `require-trusted-types-for` 焼き込み 0 hit |
| Staging / production response verification | runtime_pending (user-gated) | external runtime observation required for CSP enforce / Report-To rollout decisions |
| Commit / push / PR | runtime_pending (user-gated) | explicit user approval required |

## 8. Archive/delete stale-reference gate

No workflow root was deleted or moved. `NEXT_PUBLIC_API_ORIGIN` drift は Phase 1 baseline grep 段で検出し、`NEXT_PUBLIC_API_BASE_URL` (`apps/web/src/lib/env.ts` `getPublicEnv()` canonical) に補正済。stale reference は workflow / skill / specs にゼロ。U-AWSHH-001..004（CSP enforce 切替 / nonce 化 / Reporting-Endpoints / `apps/api` header hardening）は外部 runtime 観測または別 surface 合意が必要なため `unassigned-task-detection.md` で user-gated follow-up として保留。

## 9. Four-condition verdict

| Condition | Verdict | Evidence |
| --- | --- | --- |
| 矛盾なし | completed (local PASS) | env canonical (`NEXT_PUBLIC_API_BASE_URL`) / CSP mode (Report-Only) / Permissions-Policy 非列挙契約 / Trusted Types 非出力契約 が implementation・spec・reference 全てで一致 |
| 漏れなし | completed (local PASS) | strict 7 outputs、Phase 11 evidence inventory、artifact inventory、aiworkflow same-wave sync、skill feedback、未タスク検出が揃う |
| 整合性あり | completed (local PASS) | root `artifacts.json` と `outputs/artifacts.json` が workflow_state 表現を共有、Phase 11/12 ドキュメントと quick-reference / resource-map が同一語彙 |
| 依存関係整合 | completed (local PASS) | middleware injection 境界は `deployment-cloudflare-opennext-workers.md` を更新、SSOT は `security-web-response-headers.md` に固定、追加 reference は SKILL ledger / artifact inventory にすべて登録 |
