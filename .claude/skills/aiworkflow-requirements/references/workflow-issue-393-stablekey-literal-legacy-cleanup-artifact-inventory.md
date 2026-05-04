# workflow-issue-393-stablekey-literal-legacy-cleanup-artifact-inventory

## Current State

| Item | Value |
| --- | --- |
| Workflow root | `docs/30-workflows/issue-393-stablekey-literal-legacy-cleanup/` |
| State | `strict_ready` |
| visualEvidence | `NON_VISUAL` |
| Phase status | Phase 1-12 completed / Phase 13 pending_user_approval |
| Parent workflow | `03a-stablekey-literal-lint-enforcement` |
| Strict lint result | 0 violations / 14 files / 148 → 0 literals |

## Implementation Artifacts

| Path | Role |
| --- | --- |
| `packages/shared/src/zod/field.ts` | `STABLE_KEY` const SSOT 追加（`as const satisfies { readonly [K in StableKeyName]: K }` で型保証） |
| `apps/api/src/jobs/sync-sheets-to-d1.ts` | family A: sync job の literal を `STABLE_KEY` named import に置換 |
| `apps/api/src/jobs/mappers/sheets-to-members.ts` | family A: sync job mapper の literal 置換 |
| `apps/api/src/repository/_shared/builder.ts` | family B: repository shared builder の literal 置換 |
| `apps/api/src/repository/publicMembers.ts` | family B: public members repository の literal 置換 |
| `apps/api/src/routes/admin/members.ts` | family C: admin members route の literal 置換 |
| `apps/api/src/routes/admin/requests.ts` | family C: admin requests route の literal 置換 |
| `apps/api/src/use-cases/public/list-public-members.ts` | family D: public list use-case の literal + indexed-access 型置換 |
| `apps/api/src/view-models/public/public-member-list-view.ts` | family D: public list view-model の literal + indexed-access 型置換 |
| `apps/api/src/view-models/public/public-member-profile-view.ts` | family D: public profile view-model の literal + indexed-access 型置換 |
| `apps/web/app/profile/_components/RequestActionPanel.tsx` | family E: web profile component の literal + JSX attribute literal 置換 |
| `apps/web/app/profile/_components/StatusSummary.tsx` | family E: web profile status summary の literal + indexed-access 型置換 |
| `apps/web/src/components/public/MemberCard.tsx` | family F: web public member card の JSX attribute literal 置換 |
| `apps/web/src/components/public/ProfileHero.tsx` | family F: web public profile hero の JSX attribute literal 置換 |
| `packages/shared/src/utils/consent.ts` | family G: consent util の literal 置換（SSOT 単一方向 import） |
| `scripts/lint-stablekey-literal.test.ts` | issue-393 0-violation 期待値テスト additive 追加（再発静的ガード） |

## Evidence

| Path | Meaning |
| --- | --- |
| `outputs/phase-11/evidence/lint-strict-after.txt` | `node scripts/lint-stablekey-literal.mjs --strict` 0 violation PASS |
| `outputs/phase-12/main.md` | Phase 12 統合サマリ |
| `outputs/phase-12/implementation-guide.md` | family A〜G 単位の置換手順と SSOT 設計判断 |
| `outputs/phase-12/system-spec-update-summary.md` | `STABLE_KEY` SSOT 導入に伴う仕様更新点 |
| `outputs/phase-12/documentation-changelog.md` | docs / skill 更新差分のチェンジログ |
| `outputs/phase-12/unassigned-task-detection.md` | strict CI gate 昇格 follow-up の検出記録 |
| `outputs/phase-12/skill-feedback-report.md` | aiworkflow-requirements skill への promotion 候補（本 wave で lessons + inventory を反映） |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 仕様準拠チェック結果 |

## Open Follow-Ups

| Task | Reason |
| --- | --- |
| `docs/30-workflows/unassigned-task/task-03a-stablekey-strict-ci-gate-001.md` | strict lint を CI blocking gate へ昇格させる作業は別 wave のまま。issue-393 wave で legacy literal blocker は解消済み。 |
