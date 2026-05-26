# [#90] [UT-38] Vitest テストインフラ整備（apps/api エラーハンドラー coverage）

## メタ情報

```yaml
issue_number: 90
title: [UT-38] Vitest テストインフラ整備（apps/api エラーハンドラー coverage）
state: OPEN
priority: 中
scale: -
category: 要件
status: -
created_date: 2026-04-27
updated_date: 2026-04-27
url: https://github.com/daishiman/UBM-Hyogo/issues/90
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | - |
| ステータス | - |

---

## 概要
UT-10で実装した `apps/api/src/middleware/error-handler.ts` および `packages/shared/src/errors/` のユニットテストをvitestで実装し、line/branchカバレッジを計測する。

## 由来
UT-10 (エラーハンドリング標準化) Phase 11 既知制限 L-9

## 詳細仕様
`docs/30-workflows/unassigned-task/UT-38-vitest-test-infrastructure.md`

## 主な完了条件
- `pnpm --filter apps/api test` が CI / ローカル両方で PASS する
- `error-handler.ts` の line カバレッジが 80% 以上
- `/__debug/throw` が `development` 環境でのみ有効化される
- `backend-ci.yml` の test ステップが vitest カバレッジを出力する

## 依存タスク
- 上流: UT-10 (エラーハンドリング標準化) ✅ 完了
- 上流: UT-05 (CI/CD パイプライン実装) ✅ 完了
