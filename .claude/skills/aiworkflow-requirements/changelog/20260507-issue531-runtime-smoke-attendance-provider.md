# 2026-05-07 Issue #531 attendanceProvider staging runtime smoke

- workflow root: `docs/30-workflows/issue-531-runtime-smoke-attendance-provider-migration/`
- state: `spec_created / implementation / NON_VISUAL / runtime_evidence_pending_user_credentials`
- 親: `docs/30-workflows/completed-tasks/issue-371-ut-02a-followup-003-hono-ctx-di-migration/`（state 変更なし。`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を維持）

## 追加 references / specs

- `references/task-workflow-active.md` Issue #531 行（route contract / DI-bound evidence / secret-PII boundary / parent state boundary）
- `references/workflow-issue-531-runtime-smoke-attendance-provider-artifact-inventory.md` — 新規（root artifacts / strict 7 phase-12 outputs / Phase 11 placeholder evidence / smoke scripts / parent task linkage）
- `references/lessons-learned-issue-531-runtime-smoke-attendance-provider-2026-05.md` — 新規（L-ISSUE531-001..005）
- `indexes/quick-reference.md` Issue #531 attendanceProvider runtime smoke 早見
- `indexes/resource-map.md` Issue #531 workflow 行
- `LOGS/_legacy.md` 2026-05-07 entry（本 changelog の summary）
- `SKILL.md` changelog `v2026.05.07-issue531-runtime-smoke-attendance-provider`

## 実装

- `scripts/smoke/runtime-attendance-provider.sh` — read-only GET smoke。GET-only by design。raw body は `mktemp` + `trap rm`、persistent evidence は summary-only（label / status / jq contract / count or type）
- `scripts/smoke/redact.sh` — persistent evidence redaction filter（cookie / session token / email / member ID）
- `docs/30-workflows/issue-531-runtime-smoke-attendance-provider-migration/` — Phase 1-13 task specification + artifacts.json（root / outputs parity）
- `docs/30-workflows/issue-531-runtime-smoke-attendance-provider-migration/outputs/phase-02/route-inventory.md` — per-route response contract（実 handler 由来）と DI-bound evidence 軸の分離
- `docs/30-workflows/issue-531-runtime-smoke-attendance-provider-migration/outputs/phase-07/shellcheck.log` — smoke / redact スクリプトの shellcheck evidence
- `docs/30-workflows/issue-531-runtime-smoke-attendance-provider-migration/outputs/phase-11/evidence/runtime-smoke.log` — `pending_user_credentials` placeholder（live PASS は credential 提供後に上書き）
- `docs/30-workflows/issue-531-runtime-smoke-attendance-provider-migration/outputs/phase-12/{main,implementation-guide,system-spec-update-summary,unassigned-task-detection,documentation-changelog,phase12-task-spec-compliance-check,skill-feedback-report,elegant-review-evidence}.md` — strict 7 + elegant review
- `docs/30-workflows/completed-tasks/issue-371-ut-02a-followup-003-hono-ctx-di-migration/unassigned-task/runtime-smoke-attendance-provider-migration.md` — 親 unassigned task を Issue #531 で consume したことを明示

## 外部 Gate

- staging credential 提供 + 実 runtime smoke 実行 → `runtime-smoke.log` を live PASS に上書き
- 親 Issue #371 state を `PASS_RUNTIME_VERIFIED` に昇格（live PASS 後のみ）
- production smoke / CI 連携 / write-path provider 移行は scope 外（unassigned-task-detection.md 参照）
- commit / push / PR は user 明示承認後

## skill feedback

- テンプレ改善: NON_VISUAL runtime smoke template に DI-bound vs inventory-only の 2 軸列を追加する依頼
- ワークフロー改善: `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING → PASS_RUNTIME_VERIFIED` の昇格条件を「fresh runtime evidence 存在」に明文化する依頼
- ドキュメント改善: persistent evidence は summary-only、raw body は `mktemp` + `trap`、redact gate 通過を 3 点ルールとして格上げする依頼
