# Phase 8: DRY 化 — issue-194-03b-followup-001-email-conflict-identity-merge

## 実装区分

[実装区分: 実装仕様書]

本 Phase は実装済みコードと既存資産の重複検出 / 統合判断を CONST_005 形式で確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-194-03b-followup-001-email-conflict-identity-merge |
| phase | 8 / 13 |
| wave | 04c-fu |
| mode | parallel |
| 作成日 | 2026-05-02 |
| 更新日 | 2026-05-03 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |
| 状態 | implementation-complete |
| 上流 | Phase 5 / Phase 6 / Phase 7 |
| 下流 | Phase 9 品質保証 |

## 目的

新設コードと既存 admin route / middleware / repository helper の重複を点検し、再利用 / 局所化 / 早すぎる抽象化回避の判断を確定する。

## 参照資料

- apps/api/src/middleware/require-admin.ts
- apps/api/src/routes/admin/audit.ts (既存 audit route の cursor / mask 実装)
- apps/api/src/repository/_shared/db.ts (既存 `isUniqueConstraintError` helper)
- apps/api/src/repository/auditLog.ts (`appendAuditLog` 既存 helper)
- apps/api/src/jobs/sync-forms-responses.ts (`classifyError` の `EMAIL_CONFLICT` 分類)
- packages/shared/src/schemas/

## Before / After（実装と整合）

| 項目 | Before | After |
| --- | --- | --- |
| endpoint | なし | `GET /admin/identity-conflicts` / `POST /:id/merge` / `POST /:id/dismiss`（`routes/admin/identity-conflicts.ts`） |
| route mount | — | `apps/api/src/index.ts` L225 に `createAdminIdentityConflictsRoute()` を mount |
| component | なし | `apps/web/src/components/admin/IdentityConflictRow.tsx` の stage state machine 1 本（merge-confirm / merge-final / dismiss を内包） |
| schema | なし | `packages/shared/src/schemas/identity-conflict.ts` に zod 群 + `maskResponseEmail` を集約 |
| service | なし | `apps/api/src/services/admin/identity-conflict-detector.ts`（pure function） |
| repository | なし | `identity-conflict.ts` (list / dismiss / parseConflictId / isConflictDismissed) + `identity-merge.ts` (mergeIdentities / resolveCanonicalMemberId + 3 例外) |
| DDL | なし | `0010_identity_merge_audit.sql` / `0011_identity_aliases.sql` / `0012_identity_conflict_dismissals.sql` |
| middleware path | `/admin/*` 配下に既存 admin route 群 | `app.use("*", requireAdmin)` を identity-conflicts route 内で再適用（layer-level 二段防御） |

## 既存資産の再利用

| 既存資産 | 再利用方針 | 採否 |
| --- | --- | --- |
| `apps/api/src/middleware/require-admin.ts` の `requireAdmin` MiddlewareHandler | 新 route の `app.use("*", requireAdmin)` でそのまま使用 | 採用（変更なし） |
| `apps/api/src/repository/auditLog.ts:appendAuditLog` | merge 成功時に `action='identity.merge'` で 1 行追記 | 採用 |
| `apps/api/src/jobs/sync-forms-responses.ts` の `EMAIL_CONFLICT` 分類結果 | `sync_jobs.error_json` を identity-conflict repo の入力として読取 | 採用（読取のみ、ジョブ本体は不変） |
| `packages/shared/src/schemas/admin/*` の zod パターン | `ListIdentityConflictsResponseZ` 等の命名規約と pagination shape を踏襲 | 採用 |

## 重複候補と統合判断

| 候補 | 判断 | 理由 |
| --- | --- | --- |
| `maskResponseEmail` | shared に集約 | API / UI 双方で再利用見込み、pure 関数で副作用なし |
| `redactReason` (PII 文字列 redaction) | `identity-merge.ts` 内に局所化 | `routes/admin/audit.ts` の `maskJsonValue` と target が異なる（reason は string、audit は JSON tree）。早すぎる抽象化を回避 |
| `parseConflictId` | `identity-conflict.ts` 内に局所化 | 1 系統 endpoint のみで使用 |
| `detectConflictCandidates` | `services/admin/` に pure helper として独立 | repository から分離して unit test を可能にする |
| `apps/api/src/repository/_shared/db.ts:isUniqueConstraintError` の merge 失敗判定再利用 | 採用しない | `db.batch()` failure は Error.message に `UNIQUE/constraint` 文字列が混じる形式で返るため、route 層で `MergeConflictAlreadyApplied` exception 経路に統一して扱う方が単純 |
| 既存 `routes/admin/audit.ts` の cursor encode (`b64url(json)`) | 採用しない | 一覧件数規模が小さく `conflictId` baseline cursor で十分。overhead を増やさない |
| 個別 proxy route 3 本 (apps/web) | 採用しない | 既存 generic `app/api/admin/[...path]/route.ts` proxy で十分。重複作成を回避 |
| `IdentityMergeConfirmDialog.tsx` 分離 | 採用しない | `IdentityConflictRow` 内 stage state machine で UI 一貫性が高く、コンポーネント分割の純益小 |

## 検証コマンド

```bash
# 既存資産との重複検出
rg "appendAuditLog" apps/api/src
rg "requireAdmin" apps/api/src/routes/admin
rg "isUniqueConstraintError" apps/api/src

# 型・lint・test
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @repo/api test -- identity-conflict identity-merge
```

## 多角的チェック観点

- #1 / #3 / #5 / #11 / #13 を考慮した上で、抽象化が過剰でないか
- `current_response_resolver` 系既存 helper を再実装していないこと（merge は INSERT only で resolver 介在不要）
- 既存 admin route 群と命名規約（`createAdminXxxRoute`）が一致

## 完了条件 (DoD)

- Before / After 表が埋まっている
- 既存資産の再利用方針 4 件が採否付きで明記
- 重複候補 8 件の採否判断と理由が明記
- 検証 grep コマンドが提示

## サブタスク管理

- [x] 既存 admin route / middleware / repository を grep で棚卸し
- [x] 共通化 / 局所化 / 早すぎる抽象化回避の判断を表に整理
- [x] 採用しない判断にも理由を明記
- [x] outputs/phase-08/main.md を更新

## 成果物

- outputs/phase-08/main.md

## タスク100%実行確認

- [x] CONST_005 必須セクション充足
- [x] DRY 化判断と実装が一致
- [x] 03b 本体未改修

## 次 Phase への引き渡し

Phase 9 へ DRY 観点の確定結果と検証 grep コマンドを引き渡す。
