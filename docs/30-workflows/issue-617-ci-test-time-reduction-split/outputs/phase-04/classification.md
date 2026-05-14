# Phase 4 classification ledger

## Status

`runtime_classified` — glob ベースで 94 件を D1 group、44 件を unit group に分類 (apps/api 138 件)。

`vitest list --config=vitest.{,d1.}config.ts` で disjoint と全件カバーを確認済 (intersection=0、union=138)。

### 補足: grep ベース判定との差分

初版の三段 grep (`D1Database|env\.DB|setupD1|...`) は 61 件しか捕捉できなかったが、
glob 単位 (`apps/api/src/repository/**/*.repository.spec.ts` 等) ではさらに 33 件の
`*.repository.spec.ts` が含まれることを `vitest list` 実行で確認した。これらは
セットアップを helper 経由で間接的に行うため grep に出ないだけで実態は D1 依存。
保守的に D1 group へ寄せる方針 (port exhaustion 再発防止) で問題なし。

## 実行コマンド (2026-05-11)

```bash
# Rule 1: filename
find apps/api -type f \( -name "*.d1.test.ts" -o -name "*.d1.spec.ts" -o -name "*.d1.test.tsx" -o -name "*.d1.spec.tsx" \)
# → 0 件

# Rule 2: D1 token
grep -rl -E "D1Database|env\.DB|c\.env\.DB" apps/api --include="*.test.ts" --include="*.spec.ts"
# → 33 件

# Rule 3: setup token
grep -rl -E "setupD1|getMiniflareBindings|miniflare.*D1" apps/api --include="*.test.ts" --include="*.spec.ts"
# → 46 件
```

Initial grep UNION = 61 件 (direct D1 candidates)。実 config 正本は glob + `vitest list` により D1 group 94 件 / unit group 44 件。

## 分類結果サマリ (正本)

| group | 件数 | 主要パターン |
| --- | --- | --- |
| `api-d1` | 94 | `*.contract.spec.ts` / `*.repository.spec.ts` / `use-cases/auth/__tests__/*` / `sync/schema/*` / `workflows/*.contract.spec.ts` |
| `api-unit` | 44 | 残り (pure logic / parser / brand-type / authz-matrix / audit-correlation 一部 / etc) |

## D1 group 判定の変遷

初期 grep では direct token hit と setup token hit の union が 61 件だったが、
glob 実装後の `vitest list` では indirect helper 経由の repository / route / sync 系も
含まれるため `api-d1=94` / `api-unit=44` が正本。以下の一覧は初期 grep の
direct candidate ledger であり、現在の D1 group 全件リストではない。

## 初期 grep direct candidate 一覧 (61)

```
apps/api/migrations/seed/__tests__/issue-399-seed-syntax.test.ts
apps/api/src/__tests__/invariants.spec.ts
apps/api/src/audit-correlation/__tests__/persist.spec.ts
apps/api/src/audit-correlation/__tests__/run-correlation.spec.ts
apps/api/src/env.spec.ts
apps/api/src/health-db.contract.spec.ts
apps/api/src/jobs/cap-alert.contract.spec.ts
apps/api/src/jobs/retention-purge.contract.spec.ts
apps/api/src/jobs/sync-forms-responses.contract.spec.ts
apps/api/src/jobs/sync-sheets-to-d1.contract.spec.ts
apps/api/src/middleware/__tests__/rate-limit-magic-link.authz.spec.ts
apps/api/src/middleware/me-session-resolver.authz.spec.ts
apps/api/src/middleware/repository-providers.spec.ts
apps/api/src/repository/__tests__/_setup.repository.spec.ts
apps/api/src/repository/__tests__/adminNotes.repository.spec.ts
apps/api/src/repository/__tests__/adminUsers.repository.spec.ts
apps/api/src/repository/__tests__/attendance-analytics.repository.spec.ts
apps/api/src/repository/__tests__/auditLog.repository.spec.ts
apps/api/src/repository/__tests__/identity-conflict.repository.spec.ts
apps/api/src/repository/__tests__/identity-merge.repository.spec.ts
apps/api/src/repository/__tests__/magicTokens.repository.spec.ts
apps/api/src/repository/__tests__/notificationOutbox.repository.spec.ts
apps/api/src/repository/__tests__/syncJobs.repository.spec.ts
apps/api/src/repository/publicMembers.repository.spec.ts
apps/api/src/repository/schemaAliases.repository.spec.ts
apps/api/src/routes/admin/attendance.contract.spec.ts
apps/api/src/routes/admin/audit.contract.spec.ts
apps/api/src/routes/admin/dashboard.contract.spec.ts
apps/api/src/routes/admin/identity-conflicts.contract.spec.ts
apps/api/src/routes/admin/meetings.contract.spec.ts
apps/api/src/routes/admin/member-delete.contract.spec.ts
apps/api/src/routes/admin/member-notes.contract.spec.ts
apps/api/src/routes/admin/member-status.contract.spec.ts
apps/api/src/routes/admin/members.contract.spec.ts
apps/api/src/routes/admin/requests.contract.spec.ts
apps/api/src/routes/admin/responses-sync.contract.spec.ts
apps/api/src/routes/admin/schema.contract.spec.ts
apps/api/src/routes/admin/sync-schema.contract.spec.ts
apps/api/src/routes/admin/sync.contract.spec.ts
apps/api/src/routes/admin/tags-queue.contract.spec.ts
apps/api/src/routes/auth/__tests__/auth-routes.contract.spec.ts
apps/api/src/routes/auth/session-resolve.contract.spec.ts
apps/api/src/routes/me/index.contract.spec.ts
apps/api/src/sync/audit-route.contract.spec.ts
apps/api/src/sync/audit.contract.spec.ts
apps/api/src/sync/backfill.contract.spec.ts
apps/api/src/sync/manual.contract.spec.ts
apps/api/src/sync/scheduled.contract.spec.ts
apps/api/src/sync/schema/diff-queue-writer.spec.ts
apps/api/src/sync/schema/forms-schema-sync.spec.ts
apps/api/src/sync/schema/resolve-stable-key.spec.ts
apps/api/src/use-cases/auth/__tests__/issue-magic-link.spec.ts
apps/api/src/use-cases/auth/__tests__/resolve-gate-state.spec.ts
apps/api/src/use-cases/auth/__tests__/resolve-session.spec.ts
apps/api/src/use-cases/auth/__tests__/verify-magic-link.spec.ts
apps/api/src/workflows/schemaAliasAssign.contract.spec.ts
apps/api/src/workflows/schemaAliasBackfillBatch.contract.spec.ts
apps/api/src/workflows/schemaAliasEnqueue.contract.spec.ts
apps/api/src/workflows/tagCandidateEnqueue.contract.spec.ts
apps/api/src/workflows/tagQueueResolve.contract.spec.ts
apps/api/src/workflows/tagQueueRetryTick.contract.spec.ts
```

## include / exclude glob 設計

`vitest.d1.config.ts` は明示パスリストではなく glob で disjoint を確保する:

```
apps/api/migrations/seed/__tests__/issue-399-seed-syntax.test.ts
apps/api/src/__tests__/invariants.spec.ts
apps/api/src/env.spec.ts
apps/api/src/health-db.contract.spec.ts
apps/api/src/middleware/me-session-resolver.authz.spec.ts
apps/api/src/middleware/repository-providers.spec.ts
apps/api/src/middleware/__tests__/rate-limit-magic-link.authz.spec.ts
apps/api/src/audit-correlation/__tests__/persist.spec.ts
apps/api/src/audit-correlation/__tests__/run-correlation.spec.ts
apps/api/src/jobs/**/*.contract.spec.ts
apps/api/src/repository/**/*.repository.spec.ts
apps/api/src/routes/**/*.contract.spec.ts
apps/api/src/sync/**/*.contract.spec.ts
apps/api/src/sync/schema/**/*.spec.ts
apps/api/src/use-cases/auth/__tests__/*.spec.ts
apps/api/src/workflows/*.contract.spec.ts
```

これら glob は `vitest list` 実測の D1 group 94 ファイルを覆う。unit config の
`exclude` と同じ glob 集合を使い、disjoint check は intersection=0 / union=138。

## 境界ケース

- `apps/api/src/__tests__/authz-matrix.authz.spec.ts` は `.authz.spec.ts` だが D1 を使わない pure logic → unit
- `apps/api/src/audit-correlation/__tests__/contract.contract.spec.ts` は contract pattern だが D1 を使わない → unit (含まないようにする) ← *NOTE: ファイル名規約上は contract だが grep でヒットしない*。一旦 `unit` 寄せ。CI 再分類で確認

## 完了条件

- [x] 全 test ファイル分類済 (138 件)
- [x] 境界ケース 2 件を unit へ手動寄せ
- [x] glob 設計が Phase 5 config 設定で利用可能
