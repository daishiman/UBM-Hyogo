# Phase 12 — Main（strict 7 集約）

## 1. workflow 概要

- workflow_id: `member-header-admin-link`
- workflow_state: `implemented_local_evidence_captured`
- taskType: `implementation`
- visualEvidence: `VISUAL_ON_EXECUTION`
- 本 Phase 12 は **ローカル実装・証跡採取完了時点** の strict 7 集約。staging visual / commit / push / PR は user-gated。

## 2. strict 7 outputs

| # | 名称 | パス |
|---|------|------|
| 1 | Main | `outputs/phase-12/main.md`（本ファイル） |
| 2 | Implementation Guide | `outputs/phase-12/implementation-guide.md` |
| 3 | System Spec Update Summary | `outputs/phase-12/system-spec-update-summary.md` |
| 4 | Documentation Changelog | `outputs/phase-12/documentation-changelog.md` |
| 5 | Skill Feedback Report | `outputs/phase-12/skill-feedback-report.md` |
| 6 | Unassigned Task Detection | `outputs/phase-12/unassigned-task-detection.md` |
| 7 | Phase 12 Compliance Check | `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| mirror | Output Artifacts | `outputs/artifacts.json` |

## 3. 実装・証跡

- 実装: `MemberHeader` admin CTA、`(member)/layout.tsx` async + `getAuthView()`、`apps/web/src/lib/auth-view/` 最小基盤
- 証跡: `outputs/phase-11/evidence/{typecheck,lint,vitest-member-header,grep-no-hex,grep-member-header-contract,playwright-member-header}.log`
- local visual sanity: `outputs/phase-11/screenshots/member-header-member.png`, `outputs/phase-11/screenshots/member-header-admin.png`
- `aiworkflow-requirements` skill と同 wave で sync 済み
- `workflow_state` は `implemented_local_evidence_captured`

## 4. 親 workflow との関係

本 workflow は親 `public-header-logged-in-nav-cleanup` Task E を独立 workflow として切り出したもの。親側 strict 7 と本 workflow strict 7 は別レイヤとして両立する（親は 7 タスク集約、本 workflow は単一タスク close-out）。
