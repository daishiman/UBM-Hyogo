# Phase 9: 品質保証

[実装区分: 実装仕様書]

## メタ情報

- workflow_state: `implemented_local_runtime_pending`
- taskType: `implementation`
- visualEvidence: `VISUAL_ON_EXECUTION`


## 目的

typecheck / lint / token gate / 命名 gate / parity を一括判定する。

## QA チェックリスト

| # | 項目 | コマンド / 基準 |
| --- | --- | --- |
| Q1 | 型チェック | `mise exec -- pnpm typecheck`（全 package green） |
| Q2 | lint | `mise exec -- pnpm lint`（green。fix は `pnpm lint --fix`） |
| Q3 | test suffix gate | 新規 test は `*.spec.{ts,tsx}` のみ（`*.test.*` 0 件） |
| Q4 | design token gate | `verify-design-tokens` 相当。HEX / `bg-[#xxx]` 直書き 0 件 |
| Q5 | mutation hook gate | `@/lib/useAdminMutation` 新規参照 0 件（invariant #10） |
| Q6 | admin input gate | `apps/web/src/components/admin/` 配下に新規 `<input>` 追加なし（invariant #9） |
| Q7 | 旧テーブル名 | `grep -rn tag_assignments apps/api/src` 0 件 |
| Q8 | ALL_TAGS 撤去 | `grep -rn ALL_TAGS apps/web/src` 0 件 |
| Q9 | 型 gate | `memberTags.readonly.test-d.ts` green |
| Q10 | D1 境界 | `apps/web` から D1 binding 直接参照 0 件（invariant #1） |

## 削除/stub 確認（FB-UI-02-1）

- `ALL_TAGS` 定数は完全削除（stub 残存なし）。`grep` で live import 0 件を証跡に残す。

## 実行タスク

- 本 Phase の記載内容を実装時の gate として使用する。

## 成果物

- QA 判定結果（全項目 PASS）

## 統合テスト連携

- 実装時は Phase 4-7 の focused tests と Phase 11 evidence ledger に接続する。

## 参照資料

- docs/30-workflows/completed-tasks/issue-982-drawer-tag-pill-editing/index.md
- .claude/skills/task-specification-creator/SKILL.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 完了条件

- Q1〜Q10 全 PASS
