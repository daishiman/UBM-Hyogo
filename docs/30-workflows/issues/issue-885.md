# [#885] [serial-06 followup-004] adapter schema extension pipeline 整備

## メタ情報

```yaml
issue_number: 885
title: [serial-06 followup-004] adapter schema extension pipeline 整備
state: OPEN
priority: 低
scale: 小規模
category: followup
status: 未実施
created_date: 2026-05-23
updated_date: 2026-05-23
url: https://github.com/daishiman/UBM-Hyogo/issues/885
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

serial-06 adapter は現時点 `PublicMemberProfileZ` 前提。schema 拡張時の adapter 更新手順（fixture → zod → adapter spec → adapter → primitive）が暗黙知化。引き継ぎコスト高。

## 仕様書

`docs/30-workflows/unassigned-task/serial-06-followup-004-adapter-schema-extension-pipeline.md`

## 発見元

- serial-06 Phase 9 R-02「既存 API shape と UI 期待の乖離」
- Phase 12 implementation-guide §「NormalizedField の sanitize と既存 primitive の型整合」

## 完了条件

- `apps/web/src/lib/adapters/README.md` 新規作成
- 5 ステップ checklist 記述
- spec に extension template comment 追加
- 8 ケース × 5 列の責務 mapping 表整備
