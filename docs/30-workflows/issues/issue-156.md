# [#156] [task-adr-template-standardization] ADR テンプレート標準化（doc/decisions/TEMPLATE.md 追加）

## メタ情報

```yaml
issue_number: 156
title: [task-adr-template-standardization] ADR テンプレート標準化（doc/decisions/TEMPLATE.md 追加）
state: OPEN
priority: 低
scale: 小規模
category: 改善
status: 未実施
created_date: 2026-04-28
updated_date: 2026-04-28
url: https://github.com/daishiman/UBM-Hyogo/issues/156
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

ADR-0001 で確立した必須セクション（Status / Context / Decision / Consequences / Alternatives Considered / References + 派生元抜粋）を `doc/decisions/TEMPLATE.md` として標準化し、`doc/decisions/README.md` から参照可能にする。

## 背景

- 派生元: task-husky-rejection-adr Phase 12 unassigned-task-detection A-1
- ADR-0001 単独ではテンプレートが残らないため、ADR-002 以降で章立て・表記揺れが再発するリスクがある。

## 受入条件

- [ ] `doc/decisions/TEMPLATE.md` が存在する
- [ ] README からテンプレートへ相対リンクで到達できる
- [ ] 必須6セクション（Status / Context / Decision / Consequences / Alternatives Considered / References）を含む
- [ ] ADR-0001 の本文は不要に書き換えない

## 含まないもの

- ADR-0001 の方針変更
- CI link checker の新設
- `lefthook-operations.md` から ADR-0001 への参照追加（別タスク）

## 仕様書

`docs/30-workflows/unassigned-task/task-adr-template-standardization.md`
