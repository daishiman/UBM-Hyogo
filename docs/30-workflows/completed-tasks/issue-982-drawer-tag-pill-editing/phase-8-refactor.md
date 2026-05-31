# Phase 8: リファクタリング

[実装区分: 実装仕様書]

## メタ情報

- workflow_state: `implemented_local_runtime_pending`
- taskType: `implementation`
- visualEvidence: `VISUAL_ON_EXECUTION`


## 目的

duplicate / navigation drift を削る（Feedback RT-03: 対象/Before/After/理由）。

## リファクタ候補

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| audit 記録呼出（POST/DELETE 共通） | 各 handler に inline | `recordTagAudit(db, action, actor, memberId, tagId)` の小 helper（members.ts ローカル） | 重複削減・action 名タイポ防止 |
| member 存在/active 検証（POST/DELETE 共通） | 各 handler に inline | `assertMemberMutable(c, memberId): 404|409|ok` ローカル helper | 3 endpoint 共通ガードの一元化 |
| TagRef 整形（GET assigned/available） | 各 SELECT で map | repository 側で TagRef shape へ統一 | web/api shape 一致 |
| web `addTag` 楽観 helper | inline | `MemberDrawer` ローカル純関数 | テスト容易性 |

## 制約

- 振る舞い不変（テスト green を維持したままリファクタ）。
- helper はファイルローカルに留め、新規 public surface を増やさない。
- `ALL_TAGS` の完全撤去を確認（`grep -n ALL_TAGS apps/web/src` が 0 件）。

## 確認コマンド

```bash
grep -rn "ALL_TAGS" apps/web/src                # 0 件
grep -rn "tag_assignments" apps/api/src docs/00-getting-started-manual/specs  # 0 件
mise exec -- pnpm --filter @ubm-hyogo/api test -- members.tags
mise exec -- pnpm --filter @ubm-hyogo/web test -- MemberDrawer.tags
```

## 実行タスク

- 本 Phase の記載内容を実装時の gate として使用する。

## 成果物

- リファクタ後も全テスト green

## 統合テスト連携

- 実装時は Phase 4-7 の focused tests と Phase 11 evidence ledger に接続する。

## 参照資料

- docs/30-workflows/completed-tasks/issue-982-drawer-tag-pill-editing/index.md
- .claude/skills/task-specification-creator/SKILL.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 完了条件

- duplicate 削減 / `ALL_TAGS` 撤去 / 旧テーブル名残存 0
- テスト green 維持
