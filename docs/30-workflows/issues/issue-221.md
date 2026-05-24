# [#221] [04a-followup-002] /public/members/:id の KV キャッシュ導入（traffic >3k/day 着手）

## メタ情報

```yaml
issue_number: 221
title: [04a-followup-002] /public/members/:id の KV キャッシュ導入（traffic >3k/day 着手）
state: OPEN
priority: 低
scale: 小規模
category: パフォーマンス
status: 未実施
created_date: 2026-04-29
updated_date: 2026-04-29
url: https://github.com/daishiman/UBM-Hyogo/issues/221
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

公開プロフィール endpoint `/public/members/:memberId` に Cloudflare KV キャッシュを導入し、D1 read を削減する。

## 着手条件

公開ディレクトリの traffic が **3,000 req/day** を超えた時点。それ以前は過剰最適化のため着手しない。

## 受入条件

- 同一 memberId の連続 fetch で 2 回目以降 D1 read が発生しない
- cache hit 経路でも `responseEmail` / `rulesConsent` / `adminNotes` が leak しない
- TTL 経過後（推奨 5 分）は再度 D1 を叩く
- 404 が negative cache で 30 秒間保持される
- KV 障害時は D1 fallback で 200 を返す

## 仕様書

`docs/30-workflows/unassigned-task/04a-followup-002-public-member-profile-kv-cache.md`

## 発見元

04a Phase 12 unassigned-task-detection.md (U-2)
