# Unassigned Task Detection

## 候補

| 候補 | 条件 | 状態 |
| --- | --- | --- |
| 実 Claude Code 起動による deny bypass 検証 | docs に明示記述がなく、危険フラグ維持を検討する場合 | 未タスク候補 |
| pre-commit hook で alias 整合 check | apply-001 実施後 | 未タスク候補 |
| MCP server permission 挙動検証 | U4 として別スコープ | 未タスク候補 |

0 件ではない。実検証候補はユーザー承認が必要なため、簡易未タスクとして formalize 済み。

## formalized

| タスクID | パス | 理由 |
| --- | --- | --- |
| task-claude-code-permissions-deny-bypass-execution-001 | `docs/30-workflows/completed-tasks/task-claude-code-permissions-deny-bypass-execution-001.md` | 本タスクは spec_created / docs-only であり、実 Claude Code 起動検証を同時実行すると安全境界と承認境界が崩れるため |

## defer

| 候補 | defer 理由 |
| --- | --- |
| pre-commit hook で alias 整合 check | apply-001 の実適用後でないと実チェック対象が確定しない |
| MCP server permission 挙動検証 | `permissions.deny` × bypass の基本判定後に扱うべき別スコープ |
