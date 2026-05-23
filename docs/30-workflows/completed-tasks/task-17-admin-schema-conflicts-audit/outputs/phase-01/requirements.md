# Phase 1: 要件定義 — 凍結結果

> 実行日: 2026-05-10
> 仕様正本: `../../phase-01.md`

## 受入条件 (G-01..G-09) 凍結

| ID | 条件 | 検証 |
|----|------|------|
| G-01 | `/admin/schema` SSR 200 + 2 カラム比較 + diff list + stableKey 割当 + apply Button | vitest (SchemaDiffPanel.test.tsx) |
| G-02 | `/admin/identity-conflicts` SSR 200 + side-by-side compare + merge/dismiss | vitest (IdentityConflictRow + page existing tests) |
| G-03 | `/admin/audit` SSR 200 + FilterBar + Timeline + cursor pagination | vitest (AuditLogPanel + audit/page.test.ts) |
| G-04 | 既存 `apps/api` endpoint を adapter 経由で接続 (新 endpoint 0) | `git diff apps/api/` = 0 |
| G-05 | OKLch tokens 専用、HEX 直書き 0 件 | `pnpm verify-design-tokens` + grep gate |
| G-06 | jest-axe critical violations 0 | a11y test |
| G-07 | apply / merge / dismiss は確認 modal + reason 必須 | vitest |
| G-08 | audit timeline は JST 換算で日付グルーピング | vitest |
| G-09 | `pnpm typecheck` / `pnpm lint` green | CI |

## 非ゴール (確認)

- `apps/api` endpoint 追加・変更
- audit CSV export (disabled + tooltip "Coming soon")
- identity-conflicts 3 件以上同時 merge
- schema apply dry-run preview
- diff syntax highlight 外部 lib

## 既存 web canonical inventory (2026-05-10 baseline 確認済)

| 種別 | path | 状態 |
| --- | --- | --- |
| route | `apps/web/app/(admin)/admin/schema/page.tsx` | 存在 |
| route | `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` | 存在 |
| route | `apps/web/app/(admin)/admin/audit/page.tsx` | 存在 |
| component | `apps/web/src/components/admin/SchemaDiffPanel.tsx` | 存在 |
| component | `apps/web/src/components/admin/IdentityConflictRow.tsx` | 存在 |
| component | `apps/web/src/components/admin/AuditLogPanel.tsx` | 存在 |
| helper | `apps/web/src/lib/admin/api.ts` | 存在 (postSchemaAlias, isSchemaAliasRetryableContinuation, etc.) |
| helper | `apps/web/src/lib/admin/server-fetch.ts` | 存在 |

## API endpoint inventory (read-only confirm)

すべての endpoint は `apps/api/src/routes/admin/{schema,sync-schema,identity-conflicts,audit}.ts` に存在。新規追加 0。

## DoD

- [x] G-01〜G-09 凍結
- [x] 命名規則・既存 endpoint inventory 記録
- [x] task-15 layout merge 状況確認 (済 — `apps/web/app/(admin)/layout.tsx` 存在 / R 扱い)
