# Phase 7: カバレッジ確認

[実装区分: 実装仕様書]

## メタ情報

- workflow_state: `implemented_local_runtime_pending`
- taskType: `implementation`
- visualEvidence: `VISUAL_ON_EXECUTION`


## 目的

本タスクで変更した範囲のみの coverage を可視化する（広域指定にしない / Feedback BEFORE-QUIT-002）。

## 対象範囲（変更ファイルのみ）

| ファイル | 目標 | 重点 |
| --- | --- | --- |
| `apps/api/src/routes/admin/members.ts`（追記分） | line 100% / branch 100% | 404/409/400 分岐・audit 条件分岐 |
| `apps/api/src/repository/memberTags.ts`（追加関数） | line 100% / branch 100% | `changes>0` の true/false |
| `apps/web/src/features/admin/components/_members/MemberDrawer.tsx`（編集分） | line ≥ 90% / branch ≥ 85% | 楽観更新 success/error 経路、pending disabled |
| `apps/web/src/features/admin/api/members.ts`（追加分） | line 100% | header 付与・error throw |

## 実測コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- --coverage members.tags
mise exec -- pnpm --filter @ubm-hyogo/api test -- --coverage memberTags
mise exec -- pnpm --filter @ubm-hyogo/web test -- --coverage MemberDrawer.tags
```

> 変更行 / branch の実測値（例: POST 分岐 line 100% / branch 100%）を証跡に残す。変更外ファイルは対象外。

## 実行タスク

- 本 Phase の記載内容を実装時の gate として使用する。

## 成果物

- 変更範囲の coverage 実測（証跡）

## 統合テスト連携

- 実装時は Phase 4-7 の focused tests と Phase 11 evidence ledger に接続する。

## 参照資料

- docs/30-workflows/completed-tasks/issue-982-drawer-tag-pill-editing/index.md
- .claude/skills/task-specification-creator/SKILL.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 完了条件

- 各 mutation 分岐・楽観更新 success/error 経路が coverage に含まれる
- coverage gate（`scripts/coverage-guard.sh`）を通過
