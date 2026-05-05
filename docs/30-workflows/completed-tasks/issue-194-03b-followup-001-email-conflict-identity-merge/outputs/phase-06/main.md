# Phase 6: 異常系検証 — 実行記録

## ステータス

実施済み（implementation-complete）。failure case が実装の例外型と一対一で整合済み。

## failure case 検証結果

| # | 異常系 | HTTP | エラー code | 実装/テスト | 結果 |
| -- | --- | --- | --- | --- | --- |
| 1 | session 不正 | 401 | UNAUTHENTICATED | `requireAdmin` middleware 第一段 | evidence: `apps/api/src/middleware/require-admin.ts` |
| 2 | admin role なし | 403 | FORBIDDEN | `requireAdmin` role 判定 | evidence: 既存 require-admin test |
| 3 | conflictId 不正 | 400 | BAD_CONFLICT_ID | `parseConflictId` null 返却 → route 400 | evidence: `identity-conflict.test.ts > parseConflictId > 不正フォーマットは null` |
| 4 | merge body zod 失敗 | 400 | BAD_REQUEST | `MergeIdentityRequestZ.safeParse` failure | evidence: `routes/admin/identity-conflicts.ts` L54 分岐 |
| 5 | targetMemberId 不一致 | 400 | TARGET_MEMBER_MISMATCH | route 専用 guard | evidence: 同上 |
| 6 | source == target | 400 | SELF_REFERENCE | `MergeSelfReference` 例外 | evidence: `identity-merge.test.ts > source == target は MergeSelfReference` |
| 7 | source / target 不在 | 404 | MEMBER_NOT_FOUND | `MergeIdentityNotFound` 例外 | evidence: `identity-merge.test.ts > source 不在は MergeIdentityNotFound` |
| 8 | 二重 merge | 409 | ALREADY_MERGED | `MergeConflictAlreadyApplied`（事前 + UNIQUE 翻訳） | evidence: `identity-merge.test.ts > 二重 merge は MergeConflictAlreadyApplied` |
| 9 | dismiss 重複 | 200 | — | `INSERT ... ON CONFLICT DO UPDATE` upsert | evidence: `identity-conflict.test.ts > dismiss 後は候補から除外される` |
| 10 | reason に PII | 200 | — | `redactReason` で `[redacted]` 置換 | evidence: `identity-merge.test.ts > PII redaction` |
| 11 | D1 batch failure | 409 / 500 | ALREADY_MERGED / INTERNAL | `db.batch()` atomic rollback、message 翻訳 | evidence: `repository/identity-merge.ts:mergeIdentities` step 6-7 |
| 12 | DDL 未適用 | 500 | INTERNAL | `cf.sh d1 migrations list` で事前検出 | evidence: 運用 runbook |

## merge 中断時のリカバリ runbook

- D1 `db.batch()` は atomic、半端 state 構造的に発生しない
- audit_log のみ欠落するケースは `target_id + action='identity.merge'` で検出 → `appendAuditLog` 補正
- 外部副作用なし
- audit row のみ残った場合の逆操作 SQL は Phase 12 runbook に記載

## 検証コマンド実行結果

```
mise exec -- pnpm --filter @repo/api test -- identity-conflict identity-merge identity-conflict-detector  → all PASS
mise exec -- pnpm typecheck                                                                                → PASS
mise exec -- pnpm lint                                                                                     → PASS
```

## 残課題

なし。
