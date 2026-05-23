# Documentation Changelog

## 追加

| パス | 内容 |
| --- | --- |
| `docs/30-workflows/task-issue-577-followup-002-miniflare-undici-upstream-tracking/` | 本 workflow ディレクトリ全体（index.md / phase-01-13.md / outputs/） |
| `outputs/phase-11/evidence/.gitkeep` | evidence ディレクトリ予約 |

## 変更（常時）

| パス | 内容 |
| --- | --- |
| `docs/30-workflows/unassigned-task/task-issue-577-followup-002-miniflare-undici-upstream-tracking.md` | CONSUMED ヘッダー追記（本文保持） |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow 登録 |
| `.claude/skills/aiworkflow-requirements/references/workflow-issue-616-miniflare-undici-upstream-tracking-artifact-inventory.md` | artifact inventory 追加 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` / `resource-map.md` | lookup 導線追加 |
| `.claude/skills/aiworkflow-requirements/changelog/20260511-issue616-miniflare-undici-upstream-tracking.md` | 同期履歴追加 |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | Issue #616 recurring upstream tracking pointer と改善なし結論を追加 |
| `.claude/skills/task-specification-creator/schemas/artifact-definition.json` | `implementationCategory: conditional` を正式化 |

## 変更（A/B 採用時のみ）

| パス | 内容 |
| --- | --- |
| `apps/api/package.json` | `scripts.test:coverage` の `--maxWorkers` を採用 N に更新 |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | 軸B 記述更新 |

## 削除

なし。

## reopen / close

- GitHub Issue #616: 状態変化なし（CLOSED 維持、reopen 禁止）
- 新規 Issue 作成: なし

## CI 影響

- A/B 採用時: `test:coverage` 並列度変更 → CI 時間短縮見込み（採用 N に依存）
- 改善なし時: CI 影響なし
