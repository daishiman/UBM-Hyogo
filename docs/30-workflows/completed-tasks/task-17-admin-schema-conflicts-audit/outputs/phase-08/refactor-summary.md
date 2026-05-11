# Phase 8: リファクタリング

## 状態

`existing-admin-contract-hardening` モード。今回の実行サイクルでコード変更が無いため、本 phase で実施する追加リファクタは **なし**。既存 commit (`e4a3d068`, `1a8c527e`, `64badc11` etc.) で以下の整理は既に完了している。

## 既存リファクタ証跡 (Before / After / 理由)

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| `actionTone()` (audit chip) | inline conditional | `apps/web/src/lib/tones.ts` の named function (100% covered) | 単独テスト可・再利用 |
| `groupByDate()` (audit timeline) | inline | AuditLogPanel 内 named function | テスト容易性 |
| `jstLocalToUtcIso()` | page.tsx inline | `audit/audit-query.ts` 分離 (100% covered) | unit test 対応 |
| schema apply mode label | inline string | retryable continuation narrowing helper `isSchemaAliasRetryableContinuation()` を api.ts に export | UI 分岐 statelessization |
| `IdentityConflictRow` member summary | inline | named state machine (`stage: idle/merge-confirm/merge-final/dismiss`) | テスト操作対象明示 (VSCPKR-03) |
| zod schema | route-local | `@ubm-hyogo/shared` (`MergeIdentityRequestZ`, `DismissIdentityConflictRequestZ`) | drift gate (G1) |

## チェック項目

- [x] HEX 直書き 0 件
- [x] 新規 barrel export 追加なし
- [x] 不要 `"use client"` なし (server route page は server component、client component は最小化済)
- [x] `console.log` / TODO / FIXME 残存 0 件 (canonical path 内)

## 検証

```bash
$ mise exec -- pnpm -F @ubm-hyogo/web typecheck   # 0 errors
$ mise exec -- pnpm -F @ubm-hyogo/web lint        # 0 errors
$ mise exec -- pnpm -F @ubm-hyogo/web test --run \
    src/components/admin/__tests__/SchemaDiffPanel.test.tsx \
    src/components/admin/__tests__/AuditLogPanel.test.tsx \
    src/lib/admin/__tests__/api.test.ts \
    app/\\(admin\\)/admin/audit/page.test.ts                # all green
```
