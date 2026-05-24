# [#879] [admin-ui-prototype-alignment-followup-001] safeServerFetch / SafeResult helper を member / public 層へ横展開

## メタ情報

```yaml
issue_number: 879
title: [admin-ui-prototype-alignment-followup-001] safeServerFetch / SafeResult helper を member / public 層へ横展開
state: OPEN
priority: 中
scale: 小規模
category: 改善
status: 未実施
created_date: 2026-05-23
updated_date: 2026-05-23
url: https://github.com/daishiman/UBM-Hyogo/issues/879
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

`admin-ui-prototype-alignment` Phase 10 final-review で deferred 宣言された follow-up タスク。

admin 層では `apps/web/src/lib/admin/safe-server-fetch.ts` と `apps/web/src/lib/result.ts` の `SafeResult<T>` 型を導入し、page.tsx 全体 throw を回避して per-section degrade を実現した。member / public 層は依然 server component 内の fetch 呼び出しが page 全体を throw させる構造のため、1 endpoint 失敗で画面全停止のリスクが残る。

## 仕様書

`docs/30-workflows/unassigned-task/admin-ui-prototype-alignment-followup-001-safe-server-fetch-horizontal-expansion.md`

## 親 workflow

`docs/30-workflows/admin-ui-prototype-alignment/`

## deferred 根拠

`docs/30-workflows/admin-ui-prototype-alignment/outputs/phase-10/final-review.md` §reviewer 視点「admin 以外 (member / public) への横展開を後続 task で検討可」

## スコープ

- `apps/web/app/(member)/profile/page.tsx`
- `apps/web/app/(public)/members/page.tsx`
- `apps/web/app/(public)/members/[id]/page.tsx`
- `apps/web/src/lib/{public,member}/safe-server-fetch.ts` または共通 lib 昇格
- 対応 spec ファイル群

## 不変条件遵守

- CLAUDE.md #5 D1 直接アクセス禁止
- CLAUDE.md #8 test ファイルは `*.spec.{ts,tsx}` のみ
- 既存 API endpoint surface を変更しない
- OKLch トークン正本化
