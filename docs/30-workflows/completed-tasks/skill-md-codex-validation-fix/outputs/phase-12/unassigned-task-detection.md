# Unassigned Task Detection

## 候補ソース別検出

### 1. 元タスクスコープ外項目

| 候補 | 内容 | 優先度 |
|------|------|--------|
| TASK-SKILL-TASKSPEC-CREATOR-LINE-LIMIT-001 | `task-specification-creator/SKILL.md` が 517 行で 500 行制限超過 | 中 |
| TASK-SKILL-VALID-FIXTURE-EXAMPLE-LINK-001 | `valid-skill` fixture の `references/example.md` がリンクされていない（quick_validate.test.js TC-N-004/014/WC-* 失敗の原因） | 中 |
| TASK-DOC-SPEC-UPDATE-WORKFLOW-WARN3-001 | `spec-update-workflow.md` に Warning 3 段階分類セクション追記（quick_validate.test.js TC-RG-006/007 失敗の原因） | 低 |

### 2. Phase 3 / Phase 10 レビュー指摘 (MINOR)

該当なし（4 条件全 PASS）。

### 3. Phase 11 発見事項

| 候補 | 内容 |
|------|------|
| TC-MAN-01 / TC-MAN-02 のユーザ手動確認 | Codex CLI / Claude Code セッション起動時 warning ゼロをユーザが手動で確認する手順をドキュメント化 |

### 4. コードコメント TODO/FIXME/HACK/XXX

```bash
$ grep -rn "TODO\|FIXME\|HACK\|XXX" .claude/skills/skill-creator/scripts/utils/ 2>&1
```

該当なし。

### 5. describe.skip ブロック

`codex_validation.test.js` 内に skip なし。`quick_validate.test.js` の 2 件 skip は本タスク対象外（既存）。

## 後続タスク化が必要な項目

| ID | 種類 | 詳細 |
|----|------|------|
| TASK-SKILL-TASKSPEC-CREATOR-LINE-LIMIT-001 | 作成済み | `docs/30-workflows/unassigned-task/TASK-SKILL-TASKSPEC-CREATOR-LINE-LIMIT-001.md` |
| TASK-SKILL-VALID-FIXTURE-EXAMPLE-LINK-001 | 作成済み | `docs/30-workflows/unassigned-task/TASK-SKILL-VALID-FIXTURE-EXAMPLE-LINK-001.md` |
| TASK-DOC-SPEC-UPDATE-WORKFLOW-WARN3-001 | 作成済み | `docs/30-workflows/unassigned-task/TASK-DOC-SPEC-UPDATE-WORKFLOW-WARN3-001.md` |

## 検出結果サマリ

- スコープ外で検出: **3 件**（既存 quick_validate.test.js 失敗の根本原因 3 件と一致、未タスク指示書作成済み）
- ユーザ手動確認待ち: **1 件**（TC-MAN-01/02）
- TODO コメント: 0 件
- skip テスト: 0 件（本タスク追加分）
