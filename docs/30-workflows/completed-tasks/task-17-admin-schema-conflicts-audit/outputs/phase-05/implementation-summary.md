# Phase 5: 実装サマリ

## 状態

`existing-admin-contract-hardening-with-e2e-fixture-fix` モード。canonical UI files は全て既存実装済みだが、Phase 11 visual evidence を成立させるため E2E-local fixture / Playwright 設定を同一 cycle で補強した。

## canonical files

| path | 役割 | git log 直近 |
|------|------|-------------|
| `apps/web/app/(admin)/admin/schema/page.tsx` | server route | `e4a3d068 docs(issue-362): admin schema alias retry-label UI hardening` |
| `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` | server route | `1a8c527e feat(issue-194): identity merge and email conflict detection` |
| `apps/web/app/(admin)/admin/audit/page.tsx` | server route | `64badc11 feat: add audit log browsing UI` |
| `apps/web/src/components/admin/SchemaDiffPanel.tsx` | client/server mix | `e4a3d068` |
| `apps/web/src/components/admin/IdentityConflictRow.tsx` | client | `1a8c527e` |
| `apps/web/src/components/admin/AuditLogPanel.tsx` | client/server mix | `64badc11` |
| `apps/web/src/lib/admin/api.ts` | client mutation | `e4a3d068` (postSchemaAlias + isSchemaAliasRetryableContinuation 含む) |
| `apps/web/src/lib/admin/server-fetch.ts` | server route fetch | `1a8c527e` (identity-conflicts fixture 対応含む) |
| `apps/web/playwright.config.ts` | evidence routing | task-17 evidence dir + fixture env、identity-conflicts AUTH_SECRET drift 修正 |
| `apps/web/playwright/tests/admin-schema-conflicts-audit.spec.ts` | visual evidence | task-17 3 route / 10 screenshot capture |

## helper signature 確認 (canonical)

- `postSchemaAlias({ questionId, stableKey, diffId? }) → Promise<AdminMutationResult<SchemaAliasApplyBody>>`
- `isSchemaAliasRetryableContinuation(r): r is AdminMutationOk<SchemaAliasApplySuccessBody>`
- IdentityConflictRow 内 inline `callJson()` で `/api/admin/identity-conflicts/:id/{merge,dismiss}` を呼ぶ contract:
  - merge body: `{ targetMemberId, reason }`
  - dismiss body: `{ reason }`

## 不在 endpoint フォールバック

`postSchemaAlias` 404 時は `AdminMutationErr` (status: 404) として正規化され、UI は disabled + tooltip で表示。

## OKLch 規律 (確認)

```bash
$ grep -RnE "#[0-9a-fA-F]{3,8}\b" apps/web/src/components/admin apps/web/app/\(admin\)/admin/{schema,identity-conflicts,audit}
(0 件)
```

## DoD 達成

- [x] canonical UI files の不足補強完了 (すべて既存)
- [x] E2E-local fixture / evidence plumbing 補強完了
- [x] Phase 4 focused tests 全 Green
- [x] `apps/api` 配下の差分 0 行
- [x] HEX 直書き 0 件
- [x] `pnpm typecheck` / `pnpm lint` / `pnpm verify-design-tokens` green

## 補足

ラベル `[実装区分: 実装仕様書]` は contract hardening 仕様。目的達成にコード変更が必要か再評価した結果、production UI/API 変更は不要だった一方、visual evidence を実行可能にする E2E-local fixture / Playwright 設定の修正は必要だったため同一 cycle で実施した。
