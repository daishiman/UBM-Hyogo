# Phase 12 output: skill feedback report

[実装区分: 実装仕様書]

## task-specification-creator 改善候補

### 1. CONST_007 例外宣言セクションの標準化

本タスクのように複数 followup を含む issue を「rollback / undo 単体」に縮退する場合、index.md 冒頭に CONST_007 例外宣言を必須セクションとして配置すると、後続の scope 肥大化リスクを構造的に抑制できる。テンプレート提案:

```
### CONST_007 例外宣言
未タスク化した followup: ...
本タスクの前提条件ではない理由: ...
各 unassigned-task への分離先パス: ...
```

### 2. 「CLOSED Issue を最新コードに最適化して再起動」パターン

#772 / #778 で同パターンを採用済。skill リファレンスに以下を追加候補:
- `references/closed-issue-canonical-workflow-recovery.md` を「現コードベース実態 vs 期待」表の必須化版に強化
- 現状調査結果テーブル（期待 / 実態 / 根拠 grep）を Phase 01 必須セクションに昇格

## aiworkflow-requirements 改善候補

### 1. D1 soft delete + 楽観ロックパターン

`schema_aliases.deleted_at + version` の組み合わせは admin mutation 一般に展開可能。`references/` に「admin mutation soft delete & optimistic lock pattern」MD を追加候補:

- column 命名規約（`deleted_at` / `deleted_by` / `version`）
- unique index 再作成（`WHERE deleted_at IS NULL` 必須）
- `If-Match: version=N` ヘッダ規約
- `db.batch([softDelete, sideEffectRestore, auditInsert])` 3 文 transaction pattern

### 2. `audit_log.after_json.relatedAuditId` 規約化

rollback / undo 系の audit log で「元 action の audit id を参照する」関係は他のテーブル（identity_merge_audit など）でも発生しうる。`after_json.relatedAuditId` JSON field の semantics を audit log spec の正本に追記候補。

## task-specification-creator + aiworkflow-requirements 横断

- skill-fixture-runner と integration: rollback / undo の component spec / endpoint spec の fixture テンプレートを fixture-runner に追加すると、follow-up タスクで再利用しやすい
