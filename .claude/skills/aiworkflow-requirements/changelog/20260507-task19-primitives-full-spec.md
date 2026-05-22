# task-19 09c primitives full spec sync

- Date: 2026-05-07
- State: `spec_created / docs-only / NON_VISUAL / Phase 1-12 completed / Phase 13 blocked_pending_user_approval`
- Workflow root: `docs/30-workflows/task-19-w2-primitives-full-spec/`
- Primary spec: `docs/00-getting-started-manual/specs/09c-primitives.md`
- Sync targets: `references/task-workflow-active.md`, `indexes/quick-reference.md`, `indexes/resource-map.md`, `SKILL.md`
- Evidence: `outputs/phase-11/evidence/grep-gate.log`, `scripts/verify-09c-no-visual-values.sh`, `outputs/phase-12/phase12-task-spec-compliance-check.md`
- Review correction: placeholder token expressions and empty §99 were fixed in the same cycle. Adjacent `apps/api/src/repository/identity-conflict.ts` branch diff is explicitly separated from task-19 primary deliverable.
- Verify script: `scripts/verify-09c-no-visual-values.sh` を新規追加。HEX / `oklch()` / `px` / `bg-[` に加え `token-sized` / `09b-token-value` / `token-mix` の placeholder grep、§99 必須キーワード（TweaksPanel / data-theme / AvatarStoreProvider#localStorage）occurrence ≥ 1 を deterministic gate として固定。
- Lessons learned (5 件): `references/lessons-learned-task19-primitives-full-spec-2026-05.md`
  - L-T19-001: placeholder token grep gate 必須化（`token-sized` / `09b-token-value` / `token-mix`）
  - L-T19-002: §99 見出し PASS だけでなく必須キーワード本文 occurrence の 2 段検証
  - L-T19-003: docs-only タスクの隣接 code diff は Phase 1 staged path scope 検証で分離
  - L-T19-004: prototype `*.jsx` 入力タスクは `export const` 抽出 → 現行 taxonomy 1:1 照合を Phase 2 で必須化
  - L-T19-005: verify script は Phase 1-4 段階で雛形配置（Phase 11 evidence 取得時の後付けは禁止）
