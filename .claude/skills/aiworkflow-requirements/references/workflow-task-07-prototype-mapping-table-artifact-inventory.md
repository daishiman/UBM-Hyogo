# Workflow Artifact Inventory: task-07 Prototype Mapping Table

## Summary

task-07 prototype-mapping-table is `spec_created / docs-only / NON_VISUAL / Phase 12 strict outputs present / Phase 13 pending_user_approval`.

The workflow adds `docs/00-getting-started-manual/specs/09a-prototype-map.md` (360+ lines) as the canonical reverse-lookup index from frozen design prototype sources to production implementation targets. It freezes 19 routes (public 6 / member 2 / admin 8 / common 3), 13+ primitive mappings, and 5.1-5.8 derivation rules. It does not modify prototype JSX, does not change tokens, and does not introduce new primitives.

## Canonical Workflow

- Workflow root: `docs/30-workflows/completed-tasks/task-07-prototype-mapping-table/`
- Phase specs: `phase-01.md` … `phase-13.md` + `index.md` + `artifacts.json`
- Outputs: `outputs/phase-01/` … `outputs/phase-13/`
- Parent context: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` (19-route definition, layer counts, OKLch token canonicalization rule)

## Implementation Artifacts

- Spec body (new): `docs/00-getting-started-manual/specs/09a-prototype-map.md`
- Spec backlink (modified): `docs/00-getting-started-manual/specs/09-ui-ux.md` — adds backlink to `./09a-prototype-map.md`
- Verifier script (new): `scripts/verify-09a-prototype-line-ranges.sh`
- Frozen prototype sources (read-only): `docs/00-getting-started-manual/claude-design-prototype/{app.jsx,primitives.jsx,pages-public.jsx,pages-member.jsx,pages-admin.jsx,icons.jsx,data.jsx,styles.css}`

## Runtime Contract

- Routes: exactly 19 — public 6 / member 2 / admin 8 / common 3
- Primitive mappings: 13+
- Derivation rules: exactly 8 sections (§5.1 - §5.8)
- Line range format: `L<start>-L<end>`
- Minimum spec body length: 360 lines
- Minimum line range ledger rows: 25
- Rejection markers (must be flagged out): `TweaksPanel`, `AvatarStoreProvider`, `data-theme="warm"`, `data-theme="cool"`
- No app code, no package code, no schema or migration changes, no token values, no props/state canonicalization.

## Verifier Invariants

`bash scripts/verify-09a-prototype-line-ranges.sh` exits non-zero if any of the following holds:

- `09a-prototype-map.md` is missing.
- Route rows are not exactly 19.
- Derivation sections are not exactly §5.1-§5.8.
- Token literals leak into `09a-prototype-map.md`.
- A frozen prototype file is shorter than its ledger end line.
- An expected symbol is not found at a ledger start line.

Expected pass output: `OK: 09a-prototype-map.md verifier passed`.

## Evidence

- Phase 12 main: `docs/30-workflows/completed-tasks/task-07-prototype-mapping-table/outputs/phase-12/main.md`
- Implementation guide (中学生レベル説明含む): `outputs/phase-12/implementation-guide.md`
- System spec update summary: `outputs/phase-12/system-spec-update-summary.md`
- Documentation changelog: `outputs/phase-12/documentation-changelog.md`
- Unassigned task detection: `outputs/phase-12/unassigned-task-detection.md` (zero new follow-up candidates)
- Skill feedback report: `outputs/phase-12/skill-feedback-report.md` (no skill definition change required; aiworkflow-requirements progressive disclosure entry point added via `references/ui-ux-prototype-map.md`)
- Compliance check: `outputs/phase-12/phase12-task-spec-compliance-check.md` (PASS)

## System Spec Sync

- `docs/00-getting-started-manual/specs/09-ui-ux.md`
- `docs/00-getting-started-manual/specs/09a-prototype-map.md`
- `.claude/skills/aiworkflow-requirements/references/ui-ux-prototype-map.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`
- `.claude/skills/aiworkflow-requirements/indexes/keywords.json`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `.claude/skills/aiworkflow-requirements/changelog/20260507-ui-prototype-scope-gate.md`
- `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md`
- `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-task-07-prototype-mapping-table-2026-05.md`

## Downstream Consumers

| consumer | lookup target |
|----------|---------------|
| task-10 | §2 primitives table + §6 line ledger |
| task-11..17 | §3 route table + §5 derivation rules (§5.1-§5.8) |
| task-19..22 | §4.2 prototype source → 09c-09h spec mapping |

## Invariants

- CLAUDE.md UI prototype alignment 不変条件 #1: 既存 API endpoint surface のみ利用 — 維持（本タスクは API を変更しない）。
- 不変条件 #2: OKLch トークン正本化 — 維持（token 値を `09a` に転写しない）。
- 不変条件 #3: prototype 正本順位（primitives + tokens + rhythm をデザイン言語の正本とする） — 強化（prototype 未掲載画面も既存 primitives で構成、新 primitive 不可を §5.1-§5.8 で固定）。
- 不変条件 #4: D1 直接アクセス禁止 — 維持（本タスクは D1 を扱わない）。
