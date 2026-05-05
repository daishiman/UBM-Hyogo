# Phase 7: AC マトリクス — 実行記録

## ステータス

実施済み（implementation-complete）。全 12 AC が実装ファイル / テスト / 手動検証手順に紐づき。

## AC × 実装 × テスト マトリクス

| # | AC | 実装 | 検証 |
| -- | --- | --- | --- |
| 1 | 完全一致判定基準 spec 化 | `apps/api/src/services/admin/identity-conflict-detector.ts` | unit test 5 件（`identity-conflict-detector.test.ts`） |
| 2 | GET 候補一覧 + pagination | `routes/admin/identity-conflicts.ts` L38 + `repository/identity-conflict.ts:listIdentityConflicts` | `identity-conflict.test.ts > listIdentityConflicts` |
| 3 | POST merge atomic | `repository/identity-merge.ts:mergeIdentities` (`db.batch`) | `identity-merge.test.ts > identity_aliases / identity_merge_audit / audit_log を atomic に書き込む` |
| 4 | POST dismiss 再検出抑止 | `repository/identity-conflict.ts:dismissIdentityConflict` | `identity-conflict.test.ts > dismiss 後は候補から除外される` |
| 5 | identity_aliases 永続化 + 本文 immutable | migration 0011 + `mergeIdentities` (INSERT only) | `identity-merge.test.ts` 全ケースで raw response への UPDATE 発行ゼロ |
| 6 | canonical 解決 | `repository/identity-merge.ts:resolveCanonicalMemberId` | `identity-merge.test.ts > resolveCanonicalMemberId で merge 後 target が引ける` |
| 7 | identity_merge_audit 永続化 | migration 0010 + `mergeIdentities` step 6 | `identity-merge.test.ts` atomic row 検証 |
| 8 | admin UI 二段階確認 + 別人マーク | `IdentityConflictRow.tsx` stage state machine | manual smoke（Phase 11） |
| 9 | require-admin 二段防御 | `routes/admin/identity-conflicts.ts` L36 `app.use("*", requireAdmin)` + apps/web layout admin gate | 既存 require-admin middleware test |
| 10 | apps/web は proxy 経由 | `app/(admin)/admin/identity-conflicts/page.tsx` → `fetchAdmin` → generic `[...path]` proxy | コードレビュー / grep |
| 11 | responseEmail 部分マスク | `packages/shared/src/schemas/identity-conflict.ts:maskResponseEmail` | API 応答に raw email を含めない（test assert） |
| 12 | reason PII redaction | `identity-merge.ts:redactReason` | `identity-merge.test.ts > PII redaction` |

## 検証コマンド実行結果

```
mise exec -- pnpm --filter @repo/api test  → all PASS
mise exec -- pnpm typecheck                → PASS
mise exec -- pnpm lint                     → PASS
```

## 残課題

なし。AC 12 件すべてが実装と双方向トレース可能。
