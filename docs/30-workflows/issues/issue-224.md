# [#224] [04a-followup-005] 公開 members list の tags 一括取得 N+1 防止

## メタ情報

```yaml
issue_number: 224
title: [04a-followup-005] 公開 members list の tags 一括取得 N+1 防止
state: OPEN
priority: 低
scale: 小規模
category: パフォーマンス
status: 未実施
created_date: 2026-04-29
updated_date: 2026-04-29
url: https://github.com/daishiman/UBM-Hyogo/issues/224
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

`/public/members` で tag 展開要望が来た時に、member_id IN (...) の 1 query で全 member 分の tags を取得する仕組みを用意する。

## 着手条件

members list で tag を展開する要望が出た時点。

## 受入条件

- `/public/members?expand=tags` で全 member の tags が返る
- D1 query 回数が `members 取得 + tags 一括取得` の 2 回以内
- `expand=tags` を指定しない場合は tags が response に含まれない（既存挙動維持）
- leak 防御 / visibility filter は維持
- contract test で N+1 リグレッションを検知できる

## 仕様書

`docs/30-workflows/unassigned-task/04a-followup-005-public-tags-batch-fetch-n1-prevention.md`

## 発見元

04a Phase 12 unassigned-task-detection.md (U-5)
