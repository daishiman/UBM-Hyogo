# Phase 1: 要件定義

[実装区分: 実装仕様書]

## 目的

task-17 の実装スコープ・前提・受入条件・既存コード命名規則・テスト対象列挙を固定する。

## タスク分類 (FB-Feedback 1)

- **taskType**: `implementation`
- **visualEvidence**: `VISUAL_ON_EXECUTION` (実装実行時に screenshot 必須)
- **workflow_state**: `spec_created`
- **implementation_mode**: `existing-admin-contract-hardening` — 該当 route/component/API helper は現行実装あり。新規 route 作成ではなく、受入条件との差分を補強する

## 受入条件 (Goals)

| ID | 条件 | 検証方法 |
|----|------|---------|
| G-01 | `/admin/schema` SSR 200, 2 カラム比較 + diff list + stableKey 割当 + apply Button 動作 | Playwright + vitest |
| G-02 | `/admin/identity-conflicts` SSR 200, side-by-side compare + merge/dismiss 動作 | Playwright + vitest |
| G-03 | `/admin/audit` SSR 200, FilterBar + Timeline + cursor pagination 動作 | Playwright + vitest |
| G-04 | 既存 `apps/api` endpoint を adapter 経由で接続 (新 endpoint 0) | client mock test + grep `app.get/post` 差分 |
| G-05 | OKLch tokens のみ使用、HEX 直書き 0 件 | `pnpm verify-design-tokens` |
| G-06 | jest-axe critical violations 0 件 | a11y test |
| G-07 | apply / merge / dismiss は確認 modal 経由 + reason 必須 | vitest |
| G-08 | audit timeline は JST 換算で日付グルーピング | vitest |
| G-09 | `pnpm typecheck` / `pnpm lint` green | CI |

## 非ゴール (Non-Goals)

- `apps/api` への endpoint 追加・変更 (D1 schema 変更含む)
- audit log の CSV エクスポート (disabled + tooltip "Coming soon")
- identity-conflicts の 3 件以上同時 merge
- schema apply の dry-run preview
- diff の syntax highlight (外部 lib 不採用)

## 既存コード命名規則 (FB-01: 仕様書 vs 実装名ズレ防止)

| 対象 | 既存パターン | 本 task で採用する命名 |
|------|------------|---------------------|
| ルート route segment | `apps/web/app/(admin)/admin/<segment>/page.tsx` | 既存 `schema/`, `identity-conflicts/`, `audit/` を patch |
| feature component | `apps/web/src/components/admin/PascalCase.tsx` | 既存 `SchemaDiffPanel`, `IdentityConflictRow`, `AuditLogPanel` を patch |
| api helper file | `apps/web/src/lib/admin/api.ts` / `server-fetch.ts` | 既存 helper に不足 mutation/query を追加。`apps/web/src/lib/api/admin-*.ts` は作らない |
| zod/shared schema | `@ubm-hyogo/shared` + route-local zod | 現行 schema を再利用し、不足時のみ shared schema に寄せる |
| route dir under `apps/api` | 既存: `routes/admin/<kebab>.ts` | (read-only) |

## API endpoint inventory (read-only surface)

| method | path | source line |
|--------|------|------|
| GET | `/admin/schema/diff` | `apps/api/src/routes/admin/schema.ts:165` |
| POST | `/admin/schema/aliases` | `apps/api/src/routes/admin/schema.ts:178` |
| GET | `/admin/schema/aliases/:diffId/backfill` | `apps/api/src/routes/admin/schema.ts:338` |
| POST | `/admin/sync/schema` | `apps/api/src/routes/admin/sync-schema.ts:97` |
| GET | `/admin/identity-conflicts` | `apps/api/src/routes/admin/identity-conflicts.ts:38` |
| POST | `/admin/identity-conflicts/:id/merge` | `apps/api/src/routes/admin/identity-conflicts.ts:54` |
| POST | `/admin/identity-conflicts/:id/dismiss` | `apps/api/src/routes/admin/identity-conflicts.ts:91` |
| GET | `/admin/audit` | `apps/api/src/routes/admin/audit.ts:144` |

> Phase 5 着手前に `grep "app\.\(get\|post\)" apps/api/src/routes/admin/{schema,sync-schema,identity-conflicts,audit}.ts` で実 endpoint と上表の差分が 0 件であることを確認する。

### 実装済み web inventory (2026-05-10 baseline)

| 種別 | canonical path | 扱い |
| --- | --- | --- |
| route | `apps/web/app/(admin)/admin/schema/page.tsx` | patch only |
| route | `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` | patch only |
| route | `apps/web/app/(admin)/admin/audit/page.tsx` | patch only |
| component | `apps/web/src/components/admin/SchemaDiffPanel.tsx` | patch only |
| component | `apps/web/src/components/admin/IdentityConflictRow.tsx` | patch only |
| component | `apps/web/src/components/admin/AuditLogPanel.tsx` | patch only |
| helper | `apps/web/src/lib/admin/api.ts` / `server-fetch.ts` | canonical adapter |

## 前提条件 (Pre-conditions)

1. **task-09 / task-10 / task-15 完了** (`(admin)/layout.tsx` merge 済)。
2. `apps/web/src/components/ui/` に既存 primitive 存在。新 primitive 追加は禁止。
3. `apps/web/src/lib/admin/server-fetch.ts` / `apps/web/src/lib/admin/api.ts` が canonical helper。
4. `apps/web/src/lib/format/datetime.ts` に `formatJstDate` / `formatJstTime` 存在 (なければ Phase 5 で追加)。
5. `apps/web/src/lib/env.ts` で `getPublicEnv()` / `API_BASE_URL` 取得可能 (CLAUDE.md 不変条件)。

## targeted test files (Phase 4-6 で扱う対象)

- `apps/web/src/components/admin/__tests__/SchemaDiffPanel.test.tsx`
- `apps/web/src/components/admin/__tests__/AuditLogPanel.test.tsx`
- `apps/web/src/lib/admin/__tests__/api.test.ts`
- `apps/web/app/(admin)/admin/audit/page.test.ts`
- 追加が必要な場合のみ `IdentityConflictRow.test.tsx` / route-level test を配置する

> **[FB-UI-02-2]** 全件 `pnpm test` の SIGKILL を避けるため、上記 11 ファイルへ targeted run する。

## 成果物

- `outputs/phase-01/requirements.md` — 本 phase の凍結結果 (上記受入条件 + 命名規則 + endpoint inventory のスナップショット)。
- `outputs/phase-01/inventory.md` — 既存ファイル grep 結果 (`(admin)/`, `_schema/`, `_conflicts/`, `_audit/` 配下の現状を確認)。

## 完了条件 (DoD)

- [ ] G-01〜G-09 が phase-01 でレビュー可能な形で固定された
- [ ] 命名規則・既存 endpoint inventory が記録された
- [ ] task-15 layout merge 状況が確認された (未完なら本 phase で blocker 化)
