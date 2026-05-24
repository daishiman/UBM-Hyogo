# [#872] [FU-LOGIN-001] Google brand 4-tone 正規アイコン導入 + design tokens brand-color exempt path

## メタ情報

```yaml
issue_number: 872
title: [FU-LOGIN-001] Google brand 4-tone 正規アイコン導入 + design tokens brand-color exempt path
state: OPEN
priority: 低
scale: 小規模
category: 改善
status: 未実施
created_date: 2026-05-23
updated_date: 2026-05-23
url: https://github.com/daishiman/UBM-Hyogo/issues/872
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

`/login` の Google OAuth ボタンに使用する Google brand icon を、現状の 1-tone `currentColor` 実装から **公式 4-tone (青/赤/黄/緑) 正規アイコン** に差し替える。併せて `verify-design-tokens` CI gate に brand-color exempt path を追加する。

## 背景

login-page-prototype-alignment workflow (2026-05-23) では、Google brand guideline 上の 4-tone 原則と、本リポジトリの design tokens 単色 OKLch 原則 (CLAUDE.md UI prototype alignment 不変条件2) が衝突するため、MVP は **1-tone `currentColor`** を採用して完了した。

post-MVP では brand guideline 適合の 4-tone 化と、`verify-design-tokens` における brand-color asset の exempt rule 設計を行う必要がある。

## 仕様書

`docs/30-workflows/unassigned-task/login-page-prototype-alignment-followup-001-google-brand-4tone-icon.md`

## 親 workflow

`docs/30-workflows/login-page-prototype-alignment/`（親タスク状態: `implemented_local_visual_evidence_captured`）

## 優先度

低（MVP 動作には影響しない brand 適合の改善）
