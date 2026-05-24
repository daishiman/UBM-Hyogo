# [#875] [FU-LOGIN-004] /login i18n (英語ロケール対応) future-scope

## メタ情報

```yaml
issue_number: 875
title: [FU-LOGIN-004] /login i18n (英語ロケール対応) future-scope
state: OPEN
priority: 低
scale: 中規模
category: feature
status: 未実施
created_date: 2026-05-23
updated_date: 2026-05-23
url: https://github.com/daishiman/UBM-Hyogo/issues/875
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | 中規模 |
| ステータス | 未実施 |

---

## 概要

`/login` の UI 文言（subtitle / button label / error message / status banner）を i18n framework 経由で en/jp 両対応にする。

## 背景

login-page-prototype-alignment workflow (2026-05-23) では LoginCard の brand-title のみ "兵庫支部会 / Hyogo Branch" の 2 段併記で i18n 素地を残しつつ、MVP は jp 単言語で完了。en locale 全体対応は future-scope。

## 仕様書

`docs/30-workflows/unassigned-task/login-page-prototype-alignment-followup-004-i18n-en-locale.md`

## 親 workflow

`docs/30-workflows/login-page-prototype-alignment/`

## 優先度

低（future-scope。先行実施すると残 route との整合が崩れるため、全 route i18n workflow と合流が前提）
