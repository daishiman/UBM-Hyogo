# [#223] [04a-followup-004] Cloudflare cache rules による Cache-Control override 検証

## メタ情報

```yaml
issue_number: 223
title: [04a-followup-004] Cloudflare cache rules による Cache-Control override 検証
state: OPEN
priority: 低
scale: 小規模
category: 改善
status: 未実施
created_date: 2026-04-29
updated_date: 2026-04-29
url: https://github.com/daishiman/UBM-Hyogo/issues/223
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

production / staging deploy 後に `/public/*` 4 endpoint の Cache-Control / cf-cache-status を実機検証し、Cloudflare cache rules / page rules による override が起きていないことを記録する。

## 受入条件

- `/public/stats` と `/public/form-preview` で `Cache-Control: public, max-age=60` が edge から返る
- `/public/members` と `/public/members/:id` で `Cache-Control: no-store` が edge から返る
- 4 endpoint の `cf-cache-status` 観測値が記録されている
- 想定との差分があれば原因と対策が記録されている

## 仕様書

`docs/30-workflows/unassigned-task/04a-followup-004-cache-rules-cache-control-verification.md`

## 発見元

04a Phase 12 unassigned-task-detection.md (U-4)
