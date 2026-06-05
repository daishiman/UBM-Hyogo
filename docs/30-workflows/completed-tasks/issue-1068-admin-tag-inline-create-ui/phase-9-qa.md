# Phase 9: 品質保証

[実装区分: 実装仕様書]

## メタ情報

- workflow_state: `spec_created`
- taskType: `implementation`
- visualEvidence: `VISUAL_ON_EXECUTION`

## 目的

typecheck / lint / token gate / apps/api 差分 0 / 既存 regression を一括判定する。

## QA チェックリスト

| # | 項目 | コマンド / 基準 |
| --- | --- | --- |
| Q1 | 型チェック | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck`（green） |
| Q2 | lint | `mise exec -- pnpm --filter @ubm-hyogo/web lint`（green。fix は `pnpm lint --fix`） |
| Q3 | design token gate | `verify-design-tokens` 観点。`grep -rn -E '#[0-9a-fA-F]{3,8}\|bg-\[#\|text-\[#' apps/web/src/features/admin/components/_members/MemberTagInlineCreate.tsx apps/web/src/features/admin/components/_members/MemberDrawer.tsx` が 0 件（HEX / `bg-[#...]` / `text-[#...]` 直書き 0 を grep 証跡） |
| Q4 | test suffix gate | 新規 test は `*.spec.{ts,tsx}` のみ（`*.test.*` 0 件） |
| Q5 | mutation hook gate | `@/lib/useAdminMutation` 新規参照 0 件（invariant #10） |
| Q6 | admin input gate | `apps/web/src/components/admin/` 配下に新規 `<input>` 追加なし（invariant #9。inline-create は `FormField` 経由） |
| Q7 | apps/api 差分 0 | `git diff --stat apps/api` が空（本 PR は純粋に apps/web） |
| Q8 | D1 境界 | `apps/web` から D1 binding 直接参照 0 件（invariant #1） |
| Q9 | 既存 regression | `mise exec -- pnpm --filter @ubm-hyogo/web test -- MemberDrawer.tags`（B-T1〜B-T8 全 PASS） |
| Q10 | inline-create test | `mise exec -- pnpm --filter @ubm-hyogo/web test -- MemberDrawer.tagInlineCreate`（C-T1〜C-T15 全 PASS） |

## token gate 詳細（Q3）

- 色は `apps/web/src/styles/tokens.css`（OKLch）を正本とする。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止。
- grep 証跡を Phase 11 evidence ledger に残す（0 件）。

## mirror parity について（補足）

- `.claude` / `.agents` mirror parity は **Phase 12 側で実施**する。Phase 9 では触れない。

## 実行タスク

- 本 Phase の記載内容を実装時の gate として使用する。

## 成果物

- QA 判定結果（Q1〜Q10 全 PASS）。

## 統合テスト連携

- 実装時は Phase 4-7 の focused tests と Phase 11 evidence ledger に接続する。

## 参照資料

- docs/30-workflows/completed-tasks/issue-1068-admin-tag-inline-create-ui/index.md
- docs/30-workflows/completed-tasks/issue-1068-admin-tag-inline-create-ui/phase-8-refactor.md
- .claude/skills/task-specification-creator/SKILL.md

## 完了条件

- Q1〜Q10 全 PASS
- HEX / `bg-[#...]` 直書き 0 を grep 証跡で確認
- `git diff --stat apps/api` が空（apps/api 差分 0）
- 既存テスト regression 0（B-T1〜B-T8）
