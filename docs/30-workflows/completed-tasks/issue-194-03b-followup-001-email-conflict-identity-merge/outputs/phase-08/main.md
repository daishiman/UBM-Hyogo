# Phase 8: DRY 化 — 実行記録

## ステータス

実施済み（implementation-complete）。重複候補の採否判断が実装と整合済み。

## 共通化 / 局所化の判断結果

| 候補 | 判断 | 評価 |
| --- | --- | --- |
| `maskResponseEmail` | shared に集約 | API/UI 双方で再利用見込み、pure 関数で副作用なし。evidence: `packages/shared/src/schemas/identity-conflict.ts` |
| `redactReason` | identity-merge 内に局所化 | `routes/admin/audit.ts` の `maskJsonValue` と target が異なる（reason は string、audit は JSON tree）。早すぎる抽象化を回避 |
| `parseConflictId` | identity-conflict repo 内に局所化 | 1 系統 endpoint でしか使わない |
| `detectConflictCandidates` | services/admin/ 配下 pure helper として独立 | repository から分離して unit test を可能にする |
| `IdentityMergeConfirmDialog` 分離 | 採用しない | `IdentityConflictRow` 内 stage state machine で UI 一貫性が高い |
| 個別 proxy route 3 本 | 採用しない | 既存 generic `app/api/admin/[...path]/route.ts` proxy で十分 |

## 既存資産の再利用結果

| 既存資産 | 再利用 | evidence |
| --- | --- | --- |
| `apps/api/src/middleware/require-admin.ts:requireAdmin` | route 全体に `app.use("*", requireAdmin)` | `routes/admin/identity-conflicts.ts` L14 import / L36 mount |
| `apps/api/src/repository/auditLog.ts:appendAuditLog` | merge 成功時 `action='identity.merge'` で 1 行追記 | `repository/identity-merge.ts` |
| `apps/api/src/jobs/sync-forms-responses.ts` の `sync_jobs.error_json` | identity-conflict repo の入力として読取（書込は 03b 本体に閉じる） | `repository/identity-conflict.ts:listIdentityConflicts` |

## 重複コード抑止チェック

- 既存 `routes/admin/audit.ts` の cursor encode (`b64url(json)`) は採用せず、`conflictId` baseline cursor に統一（一覧件数が小さく overhead 不要）
- `repository/_shared/db.ts:isUniqueConstraintError` の merge 失敗判定再利用は採用せず、route 層で `MergeConflictAlreadyApplied` 例外経路に統一

## 検証コマンド実行結果

```
rg "appendAuditLog" apps/api/src                                  → identity-merge.ts でのみ新規利用、既存実装と整合
rg "requireAdmin" apps/api/src/routes/admin                       → identity-conflicts.ts が同パターンで mount
rg "isUniqueConstraintError" apps/api/src                         → identity-merge.ts では未使用（意図通り）
mise exec -- pnpm --filter @repo/api test -- identity-conflict identity-merge  → all PASS
```

## 残課題

なし。重複候補は採否含めて全件評価済み。
