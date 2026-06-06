---
phase: 12
phase_name: ドキュメント同期 / main
task: shell-sidebar-tooltip-footer-header-responsive
状態: implemented_local_evidence_captured
作成日: 2026-06-03
parent_workflow: null
---

# Phase 12 Main

本ファイルは `task-specification-creator` Phase 12 strict 7 の物理成果物 `outputs/phase-12/main.md` である。root 直下 `phase-12-documentation.md` は Phase 本体の読みやすい入口として維持し、strict 7 の実体は本 `outputs/phase-12/main.md` を含む 7 ファイルで数える。

## 状態

| 項目 | 値 |
| --- | --- |
| workflow_state | `implemented_local_evidence_captured` |
| taskType | `implementation` |
| visualEvidence | `VISUAL` |
| visual_status | `local_browser_screenshots_present_staging_visual_pending_user_gate` |
| 実装範囲 | `apps/web` shell components / shell tests / CSS |
| local evidence | focused shell Vitest 5 files / 33 tests PASS; web typecheck PASS; web lint PASS; web verify-design-tokens PASS; root verify:tokens PASS; local browser screenshots 3 files present |
| user-gated | staging visual screenshots、commit、push、PR |

## Strict 7

| # | File | Status |
| --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | present |
| 2 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | present |
| 3 | `outputs/phase-12/implementation-guide.md` | present |
| 4 | `outputs/phase-12/system-spec-update-summary.md` | present |
| 5 | `outputs/phase-12/documentation-changelog.md` | present |
| 6 | `outputs/phase-12/unassigned-task-detection.md` | present |
| 7 | `outputs/phase-12/skill-feedback-report.md` | present |

## Local Evidence

```bash
pnpm vitest run --passWithNoTests --config=vitest.config.ts \
  apps/web/src/components/shell/__tests__/SidebarTooltip.spec.tsx \
  apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx \
  apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx \
  apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx \
  apps/web/src/components/shell/__tests__/SidebarCollapseToggle.spec.tsx
```

Result: 5 files / 33 tests PASS（2026-06-03T23:05:16+09:00）。

```bash
pnpm typecheck
pnpm lint
pnpm --filter @ubm-hyogo/web verify-design-tokens
pnpm verify:tokens
```

Result: all PASS（2026-06-03 JST）。Note: an earlier broad `pnpm --filter @ubm-hyogo/web test --run ...` invocation expanded to the full web suite and failed in existing unrelated admin tests (`IdentityConflictRow.spec.tsx`, `MemberDrawer.tags.spec.tsx`); the corrected focused shell command above is the evidence for this workflow.

## 4 Conditions

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | workflow state を実装済みローカル証跡ありへ再分類し、visual screenshot / PR だけ user-gated pending と分離 |
| 漏れなし | PASS | strict 7 `outputs/phase-12/*.md` 7 件、scope 14 files、aiworkflow inventory/index 同期を同一 cycle で反映 |
| 整合性あり | PASS | root / outputs artifacts parity、scope files、Gate-A/B/C、Phase 12 strict 7 の数え方を統一 |
| 依存関係整合 | PASS | API / D1 / auth 非接触。shell UI と CSS に閉じ、staging visual / commit / PR は user gate として分離 |
