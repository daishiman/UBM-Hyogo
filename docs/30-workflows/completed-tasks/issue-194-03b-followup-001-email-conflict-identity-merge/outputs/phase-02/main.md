# Phase 2: 設計 — 実行記録（実装済 reflect）

## 状態
実施済み。実装ファイルから関数シグネチャ / DDL / route 契約を抽出し spec を更新済。

## 変更対象ファイル一覧（実装結果）

| パス | 種別 | 状態 |
| --- | --- | --- |
| `apps/api/migrations/0010_identity_merge_audit.sql` | 新規 | done |
| `apps/api/migrations/0011_identity_aliases.sql` | 新規 | done |
| `apps/api/migrations/0012_identity_conflict_dismissals.sql` | 新規 | done |
| `apps/api/src/services/admin/identity-conflict-detector.ts` | 新規 | done (pure fn) |
| `apps/api/src/services/admin/identity-conflict-detector.test.ts` | 新規 | done (unit 5) |
| `apps/api/src/repository/identity-conflict.ts` | 新規 | done |
| `apps/api/src/repository/__tests__/identity-conflict.test.ts` | 新規 | done (integration 5) |
| `apps/api/src/repository/identity-merge.ts` | 新規 | done |
| `apps/api/src/repository/__tests__/identity-merge.test.ts` | 新規 | done (integration 6) |
| `apps/api/src/repository/__tests__/_setup.ts` | 編集 | done (TABLES に新規 3 テーブル追加) |
| `apps/api/src/routes/admin/identity-conflicts.ts` | 新規 | done |
| `apps/api/src/index.ts` | 編集 | done (mount: line 226) |
| `packages/shared/src/schemas/identity-conflict.ts` | 新規 | done |
| `packages/shared/src/schemas/index.ts` | 編集 | done (re-export) |
| `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` | 新規 | done |
| `apps/web/src/components/admin/IdentityConflictRow.tsx` | 新規 | done |
| `apps/web/app/api/admin/[...path]/route.ts` | 既存流用 | generic proxy が `/admin/identity-conflicts` を中継 |

## DDL カラム（実装結果）

### identity_merge_audit（0010）
`audit_id` PK / `actor_admin_id` / `source_member_id` / `target_member_id` / `reason` / `merged_at` / `sync_job_id`
INDEX: `(target_member_id, merged_at)`, `(source_member_id)`

### identity_aliases（0011）
`alias_id` PK / `source_member_id` UNIQUE / `target_member_id` / `created_by` / `created_at` / `reason_redacted`
INDEX: `(target_member_id)`

### identity_conflict_dismissals（0012）
`dismissal_id` PK / `source_member_id` / `candidate_target_member_id` / UNIQUE pair / `dismissed_by` / `reason` / `dismissed_at`
INDEX: `(source_member_id)`

## merge transaction 操作順（実装結果）

1. `sourceMemberId === targetMemberId` チェック（`MergeSelfReference`）
2. source / target identity の存在確認（`MergeIdentityNotFound`）
3. 既存 alias チェック（`MergeConflictAlreadyApplied`）
4. 最新 EMAIL_CONFLICT `sync_jobs.job_id` をメタ取得
5. `db.batch([identity_aliases INSERT, identity_merge_audit INSERT])` を atomic 適用
   - UNIQUE 違反時は `MergeConflictAlreadyApplied` に再分類
   - `db.batch` 未対応環境は `MergeAtomicBatchUnavailable` として失敗
6. `audit_log` に `action='identity.merge'` / `target_type='member'` を append（PII redaction 済 reason）
7. `MergeIdentityResponse` 返却

raw `member_responses` / `response_fields` / `member_status` は更新しない。canonical 解決は
`resolveCanonicalMemberId()` を介して `identity_aliases` を参照。

## 主要関数シグネチャ（evidence: 実装ファイル）

- `apps/api/src/services/admin/identity-conflict-detector.ts`: `detectConflictCandidates(rows, identities): ConflictCandidate[]`
- `apps/api/src/repository/identity-conflict.ts`: `listIdentityConflicts(c, cursor, limit)` / `dismissIdentityConflict(c, source, target, actor, reason)` / `isConflictDismissed(c, source, target)` / `parseConflictId(id)`
- `apps/api/src/repository/identity-merge.ts`: `mergeIdentities(c, args)` / `resolveCanonicalMemberId(c, memberId)`
- `apps/api/src/routes/admin/identity-conflicts.ts`: `createAdminIdentityConflictsRoute()`
- `packages/shared/src/schemas/identity-conflict.ts`: zod schemas + `maskResponseEmail`

## ローカル検証コマンド（実行結果）

```bash
mise exec -- pnpm typecheck                 # 全パッケージ pass
mise exec -- pnpm lint                      # exit=0 (新規コードは clean)
mise exec -- pnpm exec vitest run --no-coverage \
  apps/api/src/services/admin/identity-conflict-detector.test.ts \
  apps/api/src/repository/__tests__/identity-merge.test.ts \
  apps/api/src/repository/__tests__/identity-conflict.test.ts
# → 16 passed
```

## 引き渡し
- Phase 3 へ: 設計差分（generic proxy 流用 / Row 内 stage state 統合 / sync_jobs 入力源変更）の ADR
