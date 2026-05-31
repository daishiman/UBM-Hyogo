# Artifact Inventory: issue-981-admin-members-table-list-enrichment

## Summary

| Field | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-981-admin-members-table-list-enrichment/` |
| state | `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION` |
| issue | #981 CLOSED（2026-05-29 GitHub 実確認） |
| parent | `admin-ui-prototype-alignment-followup-003-admin-members-prototype-redesign` |

## Implementation Artifacts

| Path | Purpose |
| --- | --- |
| `apps/web/src/features/admin/components/_members/MembersTable.tsx` | Render occupation, zone chip, membership type chip, tag pills, and empty tag state |
| `apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx` | Component regression coverage for enrichment fields |

## Workflow Artifacts

| Path | Purpose |
| --- | --- |
| `docs/30-workflows/completed-tasks/issue-981-admin-members-table-list-enrichment/index.md` | Workflow overview and AC mapping |
| `docs/30-workflows/completed-tasks/issue-981-admin-members-table-list-enrichment/artifacts.json` | Root ledger |
| `docs/30-workflows/completed-tasks/issue-981-admin-members-table-list-enrichment/outputs/artifacts.json` | Output ledger mirror |
| `docs/30-workflows/completed-tasks/issue-981-admin-members-table-list-enrichment/outputs/phase-11/main.md` | Local evidence summary |
| `docs/30-workflows/completed-tasks/issue-981-admin-members-table-list-enrichment/outputs/phase-11/screenshot-plan.json` | Local screenshot state plan |
| `docs/30-workflows/completed-tasks/issue-981-admin-members-table-list-enrichment/outputs/phase-11/screenshots/admin-members-table-enriched.png` | Local enriched table screenshot |
| `docs/30-workflows/completed-tasks/issue-981-admin-members-table-list-enrichment/outputs/phase-11/screenshots/admin-members-table-untagged.png` | Local untagged table screenshot |
| `docs/30-workflows/completed-tasks/issue-981-admin-members-table-list-enrichment/outputs/phase-12/` | Phase 12 strict 7 outputs |

## Evidence

| Evidence | Result |
| --- | --- |
| focused MembersTable Vitest | PASS: 21 tests |
| API/schema boundary | No change |
| local visual screenshots | present: enriched / untagged |
| staging authenticated visual | pending_user_approval |
| commit / push / PR | pending_user_approval |

## Lessons Learned

- `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-981-admin-members-table-list-enrichment-2026-05.md`
  - L-I981-001: rendering-only gap と data-layer gap の判別（prop に値が来ているかを先に確認し、来ていれば API/schema/D1 を触らず描画追加のみで AC を満たす）
  - L-I981-002: 既存 primitive 再利用（`Chip` + `zoneTone`/`statusTone`）・新規 primitive/tone map 生成禁止
  - L-I981-003: optional field の条件描画（occupation/zone/type は空なら非描画）と empty fallback（tags 空は `未タグ` warning chip）の使い分け
  - L-I981-004: tag overflow の `+N` 集約と wrapper `<span>` の `title` tooltip 契約（`Chip` は title pass-through しない）
  - L-I981-005: VISUAL_ON_EXECUTION workflow の docs-only close-out 禁止（implementation 再分類）
  - L-I981-006: enrichment component の TC granularity（部分欠損の組合せ・tag 0/2/3 件境界・混在行 a11y を分解）
