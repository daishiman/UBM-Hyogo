# issue-891-member-detail-kind-exhaustiveness-guard

| 項目 | 内容 |
| --- | --- |
| タスクID | issue-891-member-detail-kind-exhaustiveness-guard |
| Issue | #891 |
| 状態 | implemented_local_evidence_captured / implementation / NON_VISUAL / Phase 13 pending_user_approval |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| 親仕様 | `docs/30-workflows/completed-tasks/issue-827-member-detail-adapter-and-visibility-defense/` |
| 起票元 | `docs/30-workflows/unassigned-task/issue-827-followup-001-displayable-kinds-exhaustiveness-guard.md` |

## 目的

`FieldKindZ` の全 kind を `apps/web/src/lib/adapters/member-detail.ts` の `KIND_ROUTE` で網羅分類し、enum 拡張時の分類漏れを `pnpm typecheck` と adapter unit test の両方で検出可能にする。

## 主成果物

- `apps/web/src/lib/adapters/member-detail.ts`
- `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts`
- `apps/web/src/components/public/MemberDetail.tsx`
- `docs/30-workflows/issue-891-member-detail-kind-exhaustiveness-guard/outputs/phase-12/phase12-task-spec-compliance-check.md`

## ユーザー承認ゲート

commit、push、PR 作成、visual baseline 更新はユーザー明示指示後のみ実行する。
