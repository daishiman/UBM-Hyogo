# Phase 10: 最終レビュー — 実行記録

## 実装区分

[実装区分: 実装仕様書]

## 実装サマリ

| 領域 | ファイル |
| --- | --- |
| DDL | `apps/api/migrations/0010_identity_merge_audit.sql`、`0011_identity_aliases.sql`、`0012_identity_conflict_dismissals.sql` |
| shared schema | `packages/shared/src/schemas/identity-conflict.ts`（zod + types + `maskResponseEmail`） |
| detector | `apps/api/src/services/admin/identity-conflict-detector.ts` + test |
| repository | `apps/api/src/repository/identity-conflict.ts`、`identity-merge.ts` + integration test |
| route | `apps/api/src/routes/admin/identity-conflicts.ts` (`createAdminIdentityConflictsRoute`) |
| route mount | `apps/api/src/index.ts` |
| UI | `apps/web/app/(admin)/admin/identity-conflicts/page.tsx`、`apps/web/src/components/admin/IdentityConflictRow.tsx` |

## セキュリティレビュー結論

- 全 admin endpoint が `require-admin` 配下にマウントされ fail closed
- merge は `member_responses` / `response_fields` / `member_status` を更新せず、
  `identity_aliases` への append と `identity_merge_audit` / `audit_log` の二重記録のみ（不変条件 #11）
- responseEmail は `maskResponseEmail` でマスク後に API 応答へ含める（不変条件 #3）

## 不変条件再確認

- #1 / #3 / #5 / #11 / #13 すべて違反なし

## threat model

| Threat | Mitigation |
| --- | --- |
| 非 admin による操作 | `require-admin` 403 |
| 誤 merge | 二段階確認 + `reason` 必須 + audit |
| 自己参照 merge | `MergeSelfReference` 400 |
| 既統合への再 merge | `MergeConflictAlreadyApplied` 409 |
| dismiss 二重実行 | UNIQUE 制約 409 |
| PII 漏洩 | UI 常時マスク、`reveal` は audit |

## GO/NO-GO

| 観点 | 判定 |
| --- | --- |
| 仕様完全性 | GO |
| 不変条件整合 | GO |
| 無料枠 | GO |
| 実装着手準備 | GO（実装完了済み） |
| 誤 merge リスク | GO（条件付） |

総合: **GO**（PR 作成は user 明示 approval gate あり）

## blocker / 残課題

- E2E (Playwright) は seed harness 整備別タスクへ委譲
- detector の dismissal 統合は `listIdentityConflicts` 内 post-filter で対応、設計維持

## 次フェーズ引き渡し

Phase 11 (manual smoke) と Phase 12 strict 7 files へ。PR は Phase 13 で user GO 後実行。
