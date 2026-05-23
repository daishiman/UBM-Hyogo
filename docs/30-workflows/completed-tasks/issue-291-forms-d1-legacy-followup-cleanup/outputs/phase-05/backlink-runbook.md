# Backlink Runbook

## 物理 root ありの 3 タスク（index.md 末尾に append）

| タスク | 追記先 | 形式 |
|--------|--------|------|
| 03a | `docs/30-workflows/completed-tasks/03a-.../index.md` | `#### 関連タスク（legacy umbrella 逆リンク）` セクション |
| 03b | `docs/30-workflows/completed-tasks/03b-.../index.md` | 同上 |
| 02c | `docs/30-workflows/completed-tasks/02c-.../index.md` | 同上 |

### 追記テンプレート

```markdown
#### 関連タスク（legacy umbrella 逆リンク）

| 関連タスク | リンク | 理由 |
|-----------|--------|------|
| task-sync-forms-d1-legacy-umbrella-001 | [umbrella close-out](../task-sync-forms-d1-legacy-umbrella-001/) | 旧 UT-09（単一 /admin/sync + sync_audit + Sheets API）の close-out。本タスクが <該当 current 経路> を担保する。Refs: Issue #291 / issue-291-forms-d1-legacy-followup-cleanup |
```

## ledger fallback（physical root 不在の 04c / 09b）

| タスク | 追記先 | 形式 |
|--------|--------|------|
| 04c | `task-workflow-active.md` 04c row 末尾 | 1 文 append |
| 09b | `task-workflow-active.md` 09b row 末尾 | 1 文 append |

### 追記 1 文

```
legacy umbrella: `task-sync-forms-d1-legacy-umbrella-001` / cleanup: `issue-291-forms-d1-legacy-followup-cleanup`（physical root 不在のため ledger fallback 経由で逆リンク）。
```

## 編集理由の記録

完了済みタスクへの追記は本文編集にあたるため、changelog または Decision Log がある場合は 1 行記録する。今回は `outputs/phase-12/documentation-changelog.md` に集約済み。
