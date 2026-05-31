# Phase 11: リンク・参照整合チェックリスト（NON_VISUAL）

| 参照対象 | パス | 状態 |
| --- | --- | --- |
| dismiss repository | `apps/api/src/repository/identity-conflict.ts:179-202` | 確認済（単一 INSERT・audit_log 未記録） |
| merge repository（対称参照元） | `apps/api/src/repository/identity-merge.ts:119-167` | 確認済（D1 batch で audit_log 記録） |
| dismiss endpoint | `apps/api/src/routes/admin/identity-conflicts.ts:91-110` | 確認済（actorAdminEmail 未配線） |
| audit endpoint | `apps/api/src/routes/admin/audit.ts:182-245` | 確認済（action/actorEmail/targetId フィルタ） |
| audit UI | `apps/web/app/(admin)/admin/audit/page.tsx`, `apps/web/src/components/admin/AuditLogPanel.tsx` | 確認済（既存活用・変更なし） |
| audit_log schema | `apps/api/migrations/0003_auth_support.sql` | 確認済（新規 migration 不要） |
| AuditAction brand | `apps/api/src/repository/_shared/brand.ts:27` | 確認済 |
| 既存テスト追従対象 | `apps/api/src/repository/__tests__/identity-conflict.repository.spec.ts:79,89` | 確認済（旧 5 引数 → 6 引数へ更新要） |

## 内部リンク

- [`phase-11.md`](./phase-11.md) — 正本
- [`main.md`](./main.md) — 概要
- [`manual-smoke-log.md`](./manual-smoke-log.md) — 手動確認ログ

全参照先は実コードで存在確認済み。参照切れ 0 件。
