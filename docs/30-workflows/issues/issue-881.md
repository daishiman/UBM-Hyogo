# [#881] [admin-ui-prototype-alignment-followup-002] AdminSectionError に retry CTA を追加（client boundary 経由）

## メタ情報

```yaml
issue_number: 881
title: [admin-ui-prototype-alignment-followup-002] AdminSectionError に retry CTA を追加（client boundary 経由）
state: OPEN
priority: 低
scale: 小規模
category: 改善
status: 未実施
created_date: 2026-05-23
updated_date: 2026-05-23
url: https://github.com/daishiman/UBM-Hyogo/issues/881
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

`admin-ui-prototype-alignment` Phase 10 final-review で YAGNI 判定された follow-up タスク。

admin-ui-prototype-alignment v1 では `AdminSectionError` は静的テキストのみで retry button を持たない。staging / production runtime で「再読込してください」テキスト誘導の UX 問題が報告された場合、または Phase 11 manual test (`pending_user_gate`) で reviewer が要請した場合に着手する。

## 仕様書

`docs/30-workflows/completed-tasks/unassigned-task/admin-ui-prototype-alignment-followup-002-admin-section-error-retry-cta.md`

## 親 workflow

`docs/30-workflows/admin-ui-prototype-alignment/`

## deferred 根拠

`docs/30-workflows/admin-ui-prototype-alignment/outputs/phase-10/final-review.md` §reviewer 視点「AdminSectionError は v1 では retry button を持たない（YAGNI）。実 traffic で『再読込してください』テキストでの UX 問題が確認されたら retry CTA を追加する」

## 設計方針

- AdminSectionError 本体は server component compatible (props only) を維持
- `onRetry?: () => void` を optional 追加（既存 props 非破壊）
- client boundary は `AdminSectionErrorClient` wrapper で `useRouter().refresh()` + `useTransition()`
- Phase 10 §4.1「`onRetry` を server component 側で渡さない」制約を維持

## 発火条件

- staging / production で UX 問題が報告された場合
- Phase 11 manual test で reviewer が retry CTA を要請した場合

## 不変条件遵守

- CLAUDE.md #5 D1 直接アクセス禁止
- CLAUDE.md #8 test ファイルは `*.spec.{ts,tsx}` のみ
- 既存 AdminSectionError props 非破壊
- OKLch トークン正本化（button color は token 経由）
- 不変条件3「プロトタイプ正本順位」: 新規 primitive を生やさない
