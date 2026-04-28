# Phase 4: Test Strategy

## 状態

pending。派生実装タスクで `.gitattributes` を編集した後に実行する検証セットを固定する。

## テストケース

| ID | 対象 | 期待 |
| --- | --- | --- |
| TC-1 | `_legacy.md` 系 | `merge: union` |
| TC-2 | JSON / YAML / `SKILL.md` / lockfile / code | `merge: unspecified` |
| TC-3 | 2〜4 worktree smoke | unmerged file 0、追記行保存 |
| TC-4 | broad glob 誤適用 | review で reject |

## タスク100%確認

- Phase 4 のテスト設計は Phase 5 / 9 / 11 の入力として追跡する。
