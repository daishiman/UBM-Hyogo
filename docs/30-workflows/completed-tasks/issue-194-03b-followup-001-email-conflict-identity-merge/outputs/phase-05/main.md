# Phase 5: 実装ランブック — 実行記録

## ステータス

実施済み（implementation-complete）。Phase 5 仕様書と実装が完全整合。

## 実装順序（実施済）

1. migration 3 本（audit / aliases / dismissals）
   - evidence: `apps/api/migrations/0010_identity_merge_audit.sql`
   - evidence: `apps/api/migrations/0011_identity_aliases.sql`
   - evidence: `apps/api/migrations/0012_identity_conflict_dismissals.sql`
2. shared schema (zod + maskResponseEmail helper)
   - evidence: `packages/shared/src/schemas/identity-conflict.ts`
3. detector pure function
   - evidence: `apps/api/src/services/admin/identity-conflict-detector.ts`
   - evidence: `apps/api/src/services/admin/identity-conflict-detector.test.ts`
4. repository 2 本
   - evidence: `apps/api/src/repository/identity-conflict.ts`（list / dismiss / parseConflictId / isConflictDismissed）
   - evidence: `apps/api/src/repository/identity-merge.ts`（mergeIdentities / resolveCanonicalMemberId / 3 例外）
   - evidence: `apps/api/src/repository/__tests__/identity-conflict.test.ts`
   - evidence: `apps/api/src/repository/__tests__/identity-merge.test.ts`
   - evidence: `apps/api/src/repository/__tests__/_setup.ts`（新テーブル DDL を seed に追加）
5. route handler + index.ts mount
   - evidence: `apps/api/src/routes/admin/identity-conflicts.ts`
   - evidence: `apps/api/src/index.ts` L26 import / L225 mount
6. apps/web page + component
   - evidence: `apps/web/app/(admin)/admin/identity-conflicts/page.tsx`
   - evidence: `apps/web/src/components/admin/IdentityConflictRow.tsx`
7. typecheck / lint / test 実行 → all green

## sanity check（実施済）

- 不変条件 #11 違反なし: `member_responses` / `response_fields` / `member_status` への UPDATE 発行は実装内に存在しない（merge は INSERT only）
- D1 batch atomic apply: integration test の二重 merge ケースで UNIQUE が trip し `MergeConflictAlreadyApplied` として伝播
- audit_log: `target_type='member' / target_id=targetMemberId / action='identity.merge'` で 1 行追加
- responseEmail: 全 API 応答が `maskResponseEmail` 経由で部分マスク

## 残課題

なし。
