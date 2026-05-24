# [#880] [serial-06 followup-001] (public) segment error/loading boundary 明示配置

## メタ情報

```yaml
issue_number: 880
title: [serial-06 followup-001] (public) segment error/loading boundary 明示配置
state: OPEN
priority: 中
scale: 小規模
category: followup
status: 未実施
created_date: 2026-05-23
updated_date: 2026-05-23
url: https://github.com/daishiman/UBM-Hyogo/issues/880
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

serial-06 Phase 5 §0 precondition は `apps/web/app/(public)/error.tsx` / `loading.tsx` の存在を前提としていたが未配置。親階層継承で実害は無いが、`(public)` segment 固有 UI が出せない。

## 仕様書

`docs/30-workflows/unassigned-task/serial-06-followup-001-public-segment-error-loading-boundary.md`

## 発見元

- serial-06-form-response-binding Phase 12 implementation-guide §「仕様との差分・判断記録」
- Phase 5 §0 precondition との drift

## 完了条件

- `apps/web/app/(public)/error.tsx` / `loading.tsx` 配置
- Playwright smoke 1 ケース pass
- design tokens grep gate pass
- serial-06 Phase 12 compliance check への backfill
