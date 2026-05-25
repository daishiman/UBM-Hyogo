# [#219] [04b-followup-003] packages/shared zod/viewmodel exports field 整備

## メタ情報

```yaml
issue_number: 219
title: [04b-followup-003] packages/shared zod/viewmodel exports field 整備
state: OPEN
priority: 低
scale: 小規模
category: 改善
status: 未実施
created_date: 2026-04-29
updated_date: 2026-04-29
url: https://github.com/daishiman/UBM-Hyogo/issues/219
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

`packages/shared/package.json` の `exports` field に `./zod/viewmodel` 等の subpath を正式定義し、`MemberProfileZ` / `SessionUserZ` を `@repo/shared/zod/viewmodel` の公式パスで import できる状態に揃える。

## 背景

04b 実装時に `exports` field が subpath を公開しておらず、import path workaround が必要だった。後続タスク（06b / 07a / 07c）で同じ zod を消費するため、workaround の伝播を防ぐ。

## 完了条件

- `@repo/shared/zod/viewmodel` で MemberProfileZ / SessionUserZ を import できる
- 04b workaround import が解消されている
- typecheck / lint / test 緑

## 詳細仕様

`docs/30-workflows/unassigned-task/04b-followup-003-shared-zod-viewmodel-exports.md`

## 参照

- 04b Phase 12 skill-feedback-report.md
- `packages/shared/package.json`
