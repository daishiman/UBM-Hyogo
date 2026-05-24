# [#157] [task-lefthook-ops-adr-backlink] lefthook 運用ガイドから ADR-0001 への参照追加

## メタ情報

```yaml
issue_number: 157
title: [task-lefthook-ops-adr-backlink] lefthook 運用ガイドから ADR-0001 への参照追加
state: OPEN
priority: 低
scale: 小規模
category: 改善
status: 未実施
created_date: 2026-04-28
updated_date: 2026-04-28
url: https://github.com/daishiman/UBM-Hyogo/issues/157
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

`doc/00-getting-started-manual/lefthook-operations.md` から `doc/decisions/0001-git-hook-tool-selection.md` への相対リンクを追加し、ADR と運用ガイド間の双方向リンクを完成させる。

## 背景

- 派生元: task-husky-rejection-adr Phase 12 unassigned-task-detection A-2
- 30種思考法レビューの「正本リンクの双方向性」観点で、運用者が hook 方針の設計判断履歴へ辿れるようにする。
- 現状は ADR → 運用ガイドの片方向のみ。

## 受入条件

- [ ] `lefthook-operations.md` から ADR-0001 への相対リンクが少なくとも1箇所追加されている
- [ ] 追加リンクが実在パスを指し、相対パスとして解決する
- [ ] ADR-0001 の本文は変更しない
- [ ] リンク追加以外の運用方針改変を行わない

## 含まないもの

- ADR-0001 の本文修正
- ADR テンプレート標準化（別タスク #156）
- 他 ADR への類似バックリンク追加

## 仕様書

`docs/30-workflows/unassigned-task/task-lefthook-ops-adr-backlink.md`
