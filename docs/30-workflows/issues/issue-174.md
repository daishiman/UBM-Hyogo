# [#174] [skill-ledger A-3-6] skill-creator テンプレへの 200 行未満ルール built-in 化

## メタ情報

```yaml
issue_number: 174
title: [skill-ledger A-3-6] skill-creator テンプレへの 200 行未満ルール built-in 化
state: OPEN
priority: 中
scale: 中規模
category: 改善
status: 未実施
created_date: 2026-04-28
updated_date: 2026-04-28
url: https://github.com/daishiman/UBM-Hyogo/issues/174
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | 中規模 |
| ステータス | 未実施 |

---

## 概要

skill-creator が生成する SKILL.md 雛形に「200 行未満」「references/ 受け皿」を初期構造として built-in 化する。新規 skill 作成時の再発を構造的に防ぐ。

## 仕様書

`docs/30-workflows/unassigned-task/task-skill-creator-progressive-disclosure-template-001.md`

## 検出元

skill-ledger A-3 Phase 12 (U-6) — 親 `skill-ledger-a3-progressive-disclosure`（再発防止）

## 主要 AC

- skill-creator 出力テンプレが SKILL.md に entry 10 要素のみを含む
- `references/` 雛形ディレクトリが空で初期作成される
- バリデーション時に 200 行超なら警告
- U-5 Anchor へのリンクを雛形に組込み

## 苦戦箇所対応

#4 ドッグフーディング矛盾の構造的再発防止。U-2（skill-creator SKILL.md 自体の分割）とは独立。
