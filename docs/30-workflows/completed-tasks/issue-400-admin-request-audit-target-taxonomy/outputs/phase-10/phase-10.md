# Phase 10: ドキュメント連動

## 更新対象

| ドキュメント | 更新内容 |
| --- | --- |
| `docs/00-getting-started-manual/specs/` 内の audit_log 章（存在時） | `target_type` enum に `admin_member_note` を追記、用途と既存 `member` との分離方針を 1 段落で説明 |
| `.claude/skills/aiworkflow-requirements/references/` 配下 audit taxonomy ドキュメント（存在時） | enum 一覧の `member` 直後に `admin_member_note` を追加し、既存行 migration なし方針を明記 |
| `docs/30-workflows/unassigned-task/task-04b-admin-request-audit-target-taxonomy-001.md` | 状態を `spec_created` → このタスク仕様書 (`docs/30-workflows/issue-400-...`) へリンク（存在時のみ。ファイル不在なら省略） |

## indexes 同期

`aiworkflow-requirements` 配下を更新した場合のみ:

```bash
mise exec -- pnpm indexes:rebuild
```

CI の `verify-indexes-up-to-date` gate が drift を検知しないことを確認。

## 完了条件

- 該当ドキュメントが更新済み
- `pnpm indexes:rebuild` 後 `git diff` で indexes drift がないこと
