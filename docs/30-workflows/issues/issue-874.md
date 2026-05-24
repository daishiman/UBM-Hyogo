# [#874] [FU-LOGIN-003] /login staging visual smoke 実行 (local visual evidence 完了済み)

## メタ情報

```yaml
issue_number: 874
title: [FU-LOGIN-003] /login staging visual smoke 実行 (local visual evidence 完了済み)
state: OPEN
priority: 中
scale: 小規模
category: followup
status: 未実施
created_date: 2026-05-23
updated_date: 2026-05-23
url: https://github.com/daishiman/UBM-Hyogo/issues/874
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

`/login` を staging 環境にデプロイ後、Playwright visual smoke を再走させて runtime evidence を取得する。

## 背景

login-page-prototype-alignment workflow (2026-05-23) では local visual evidence (8 screenshot) まで完了済み。staging 固有の差分 (CDN / OpenNext Workers bundle / OAuth callback URL / cookie domain) が visual 表現に与える影響は未検証のため、staging deploy gate 後に user-approval を経て実施する。

## 仕様書

`docs/30-workflows/unassigned-task/login-page-prototype-alignment-followup-003-staging-visual-smoke.md`

## 親 workflow

`docs/30-workflows/login-page-prototype-alignment/`（遷移先: `implementation_completed`）

## 優先度

中（staging deploy gate 後の正式完了条件）
