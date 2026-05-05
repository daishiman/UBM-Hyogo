# Phase 9: 品質保証 — outputs

## 自動 gate

| gate | command | 結果 |
| --- | --- | --- |
| typecheck | `mise exec -- pnpm -F @ubm-hyogo/api typecheck` | PASS (0 errors) |
| lint | `mise exec -- pnpm -F @ubm-hyogo/api lint` | PASS (lint = tsc) |
| test | `mise exec -- pnpm -F @ubm-hyogo/api test` | PASS (69 files / 405 tests) |

## 不変条件 grep gate

```bash
$ grep -rn "INSERT INTO member_tags" apps/api/src --include="*.ts" | grep -v test
apps/api/src/repository/memberTags.ts:73   # 既存 02b の assignTagsToMember
apps/api/src/workflows/tagQueueResolve.ts:190  # 本タスクの workflow guarded write
```

- 本タスクの新規 INSERT は **workflow 経由のみ**（不変条件 #13 PASS）
- 既存 `assignTagsToMember` は production からの caller がなくなったが、削除は本タスクのスコープ外として保留（別タスクで cleanup）

```bash
$ grep -rn "from.*apps/api\|from.*workflows" apps/web/src 2>/dev/null
# (none)
```

- apps/web から apps/api / workflows への直接 import はない（不変条件 #5 PASS）

## 残課題

- **race_lost (changes=0) の実機テスト**: in-memory D1 では並行 UPDATE を再現しづらいため、Playwright/staging で手動 smoke する（Phase 11）
- **assignTagsToMember 削除**: 別タスク (refactor) で cleanup する候補。本タスクではスコープ外
- **AC-9 SWR mutate**: 06c UI 側の責務、08b E2E でカバー

## 完了条件

- [x] typecheck/lint/test 全 PASS
- [x] 不変条件 #5, #13 grep gate PASS
- [x] 残課題は明記して handoff
