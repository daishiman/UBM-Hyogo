# Phase 8: ドキュメント更新

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | parallel-09-ux-cross-cutting (G9-1〜G9-9) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | ドキュメント更新 |
| 状態 | completed |

## 目的

Phase 1〜7 で固定した UX primitive 契約を、後続実装者が迷わず参照できる形で文書化する。実コード更新は後続 wave の責務であり、本 Phase では更新対象と更新条件を固定する。

## 更新対象

| 対象 | 判定 | 更新内容 |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/09c-primitives.md` | 必須 | FormField / EmptyState / Pagination / Icon / Breadcrumb / useAdminMutation の契約を追記 |
| `docs/00-getting-started-manual/specs/09b-design-tokens.md` | 条件付き | 既存 token の参照表のみ。新規 token は追加しない |
| `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/index.md` | 条件付き | parallel-09 の Gate-A 完了と後続実装 user gate を追記 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 必須 | workflow root を登録 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 必須 | 即時参照行を登録 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 必須 | active workflow として登録 |

## 完了条件

- [x] 更新対象と条件が `outputs/phase-08/docs-updates.md` に記録されている
- [x] 正本索引の同一 wave 更新対象が Phase 12 に接続されている
- [x] 実コード実装を本 Phase の完了条件に混ぜていない

