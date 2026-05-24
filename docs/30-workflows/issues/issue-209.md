# [#209] [TASK-DOC-VS-DOCS-PATH-LINT-001] doc/ vs docs/ 表記揺れ allow-list lint 導入

## メタ情報

```yaml
issue_number: 209
title: [TASK-DOC-VS-DOCS-PATH-LINT-001] doc/ vs docs/ 表記揺れ allow-list lint 導入
state: OPEN
priority: 中
scale: 中規模
category: 改善
status: 未実施
created_date: 2026-04-28
updated_date: 2026-04-28
url: https://github.com/daishiman/UBM-Hyogo/issues/209
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | 中規模 |
| ステータス | 未実施 |

---

## 概要

リポジトリ全体に残置している `doc/` (s なし) 始まりリンクを allow-list 付きで lint し、新規 commit での再導入を防ぐ gate を整備する。UT-GOV-003 (Issue #146) の Phase 12 unassigned-task-detection.md C-4 として検出。

## 仕様書

`docs/30-workflows/unassigned-task/task-doc-vs-docs-path-lint-001.md`

## スコープ

- `rg -n "(^|[^a-zA-Z])doc/"` 相当の lint script
- 既存残置の (a) 履歴引用 (b) 修正対象 (c) 例外 への分類
- (b) リンク修正同 wave 適用
- `scripts/lint/doc-vs-docs-allowlist.txt`
- lefthook pre-commit + CI gate

## 受入条件

- AC-1: 新規 commit で `doc/` リンク導入時 lint 失敗
- AC-2: allow-list 列挙パスは通過
- AC-3: (b) 修正は本 wave 内で完了
- AC-4: lefthook と CI で同判定
- AC-5: エラー msg に `docs/` (s 付き) 統一明示

## 関連

- 親: UT-GOV-003 (#146)
- 連携: UT-GOV-005 (docs-only nonvisual template skill sync)
