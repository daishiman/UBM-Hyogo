# Phase 12: Open Runtime Boundary / 概念説明

[実装区分: 実装仕様書]

## 1. unassigned-task consumed 化

### 対象 file
- `docs/30-workflows/completed-tasks/serial-05-step-03-followup-001-runtime-evidence-completion.md`

### 追記内容（ファイル末尾に YAML frontmatter として追加。本文は削除しない）

```markdown
---
status: consumed
consumed_at: <YYYY-MM-DD>
canonical_workflow: docs/30-workflows/completed-tasks/issue-775-serial-05-step-03-runtime-evidence-completion/
recovery_note: |
  Issue #775 was closed before a canonical workflow root existed.
  This unassigned-task file is preserved for backward link integrity.
  All Phase 1-13 work has been migrated to the canonical workflow root above.
  Issue #775 reference mode: refs_only (no Closes #775).
---
```

### 親 workflow unassigned-task-detection 更新

`docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-12/unassigned-task-detection.md` の本 followup 行を:
- `status`: `detected` → `consumed`
- `canonical_workflow`: `docs/30-workflows/completed-tasks/issue-775-serial-05-step-03-runtime-evidence-completion/`
- `consumed_at`: `<YYYY-MM-DD>`

## 2. 概念説明（中学生レベル）

### 2.1 「runtime_pending」って何？

ソフトウェアを動かして実際に画面を写真に撮る作業を「runtime evidence」と呼びます。
本タスクの親 workflow では、ソースコードの修正は終わっていますが、admin として `/admin/schema` 画面を開いた視覚証跡が不足していました。今回の完了境界は、既存 Playwright admin fixture と schema diff fixture を使った **再現可能な local visual evidence** です。

この「画面写真撮影が終わっていない」状態を `runtime_pending` と呼びます。今回はその撮影を実行し、結果を `completed` に進めるのが目的です。

### 2.2 「canonical workflow root recovery」って何？

GitHub の Issue #775 はすでに「閉じられた (CLOSED)」状態でした。本来 Issue が closed されるときは、対応する Phase 1-13 のドキュメントセット（canonical workflow root）が出来上がっているはずですが、#775 の場合は「やることリスト (unassigned-task)」だけが残っていて、ちゃんとした Phase 1-13 文書が無いまま閉じられていました。

そこで「Issue を再 open せず、後付けで Phase 1-13 文書を作る」という回復作業を行います。これが `closed-issue canonical workflow root recovery` パターンです。Issue 番号は `Refs #775`（参照のみ）として記録します。

### 2.3 「実装は不変」って何？

`SchemaDiffPanel.tsx` などの本物のアプリケーションコードはすでに完成・テスト済みです。本タスクで新しい不具合を埋め込みたくないので、**production code には一切手を入れず**、撮影用の補助ファイル（Playwright spec / 仮データ用 SQL）だけ追加します。

## 3. 後続候補（unassigned-task 候補）

本タスク完遂時に発生し得る後続:

| 候補 | trigger | 配置先 |
|------|---------|--------|
| serial-05-step-04 / step-05 runtime evidence | 同パターン適用 | `unassigned-task/` |
| visual regression CI 化 | task-22 で吸収 | 既存 task-22 workflow |
| real D1 / staging smoke | Cloudflare mutation と staging deploy approval が前提 | user-gated operation |

## 4. 概念マップ

```
Issue #775 (CLOSED)
  └─ unassigned-task/serial-05-step-03-followup-001-*.md
        └─[recovery]─→ docs/30-workflows/issue-775-.../  ← 本 workflow root
                          ├─ Phase 1-13 文書
                          └─ outputs/phase-11/README.md (pointer)
                                                 │
                                                 ▼
                          docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/
                          outputs/phase-11/  ← 実 evidence path (manifest / screenshots / logs)
```
