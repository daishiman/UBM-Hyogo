# Lessons learned: Issue #379 schemaDiffQueue current GREEN verification (2026-05)

| ID | 教訓 | 適用 | 根拠 |
| --- | --- | --- | --- |
| L-I379-001 | code fix 前提の unassigned task でも、Phase 1 current baseline が GREEN なら実装を進めず stale-current verification に再分類する | task-specification-creator `verified_current_no_code_change` | 推測で fakeD1 parser / SQL / seed を触ると、動いている repository contract に不要な回帰リスクを入れる |
| L-I379-002 | baseline / after / coverage evidence は同じ worktree root で取り直し、cross-worktree evidence を current worktree proof と呼ばない | Phase 1 / 7 / 11 evidence | mixed-root log は矛盾なし条件を壊すため、証跡 path と実行 cwd を一致させる |
| L-I379-003 | `.gitignore` で落ちる `*.log` は declared phase outputs にしない。追跡が必要な証跡は `.txt` / `.md` に保存する | Phase 11 NON_VISUAL evidence | PR に evidence file が入らないと Phase 12 PASS が再現不能になる |
| L-I379-004 | 元 unassigned task と親 workflow follow-up は consumed / historical trace に更新し、stale fix instructions を実行可能パスとして残さない | aiworkflow-requirements task-workflow-active / unassigned-task | 同じ未タスクが再選択されると、解決済み stale failure を再度実装しようとする |
| L-I379-005 | `verify_commands` には実行済み command だけを置き、broader gate を実行しない場合は Phase 9 Not Executed に理由を置く | artifacts.json / Phase 9 | metadata が実証より強いと、レビュー時に整合性 FAIL になる |

## 苦戦箇所（unassigned-task 由来）

- 対象: `docs/30-workflows/unassigned-task/task-schema-diff-queue-faked1-compat-001.md`
- 症状: 旧 `schemaDiffQueue.test.ts` list 系 2 fail を前提に fakeD1 / repository 修正タスクが残っていた
- current fact: `docs/30-workflows/issue-379-schema-diff-queue-faked1-compat/` の focused Vitest は baseline / after ともに 7/7 PASS
- 判断: fakeD1 parser 拡張、seed parity edit、repository SQL rewrite は撤回
- 再発防止: L-I379-001〜005

## 関連 skill feedback

- `task-specification-creator`: `verified_current_no_code_change` close-out 分岐を追加
- `aiworkflow-requirements`: Issue #109 follow-up / quick-reference / resource-map / task-workflow-active / lessons を same-wave sync
- `automation-30`: 物理パス存在、mixed-root evidence、ignored evidence file を四条件 gate に含める
