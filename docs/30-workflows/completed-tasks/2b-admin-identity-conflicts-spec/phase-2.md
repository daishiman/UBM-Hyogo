# Phase 2 — 既存資産インベントリ

## 1. 既存ファイル inventory

### 1.1 API 層

| path | 役割 | 行 |
|------|------|---|
| `apps/api/src/routes/admin/identity-conflicts.ts` | GET list / POST merge / POST dismiss | 38, 54, 91 |
| `apps/api/src/repository/identity-merge.ts` | merge repository（`targetMemberId` 返却） | 149, 171 |
| `apps/api/src/routes/admin/members.ts` | merge 後 member detail re-fetch | 既存 |

### 1.2 共有 schema

| path | export | 用途 |
|------|--------|------|
| `packages/shared/src/schemas/identity-conflict.ts` | `IdentityConflictRowZ` / `ListIdentityConflictsResponseZ` / `MergeIdentityRequestZ` / `MergeIdentityResponseZ` / `DismissIdentityConflictRequestZ` | server fixture parse / mock handler `parse()` |

### 1.3 UI 層

| path | 役割 |
|------|------|
| `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` | 一覧 / merge dialog / dismiss button |

### 1.4 fixture 層

| path | export | 行 |
|------|--------|---|
| `apps/web/playwright/fixtures/auth.ts` | `adminPage` / `memberPage` / `anonymousPage` | 39-67 |

## 2. 変更対象ファイル一覧（CONST_005）

| # | path | 状態 | 行数 | 備考 |
|---|------|------|------|------|
| 1 | `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | 新規 | 200-240 | primary spec |
| 2 | `apps/web/src/lib/admin/server-fetch.ts` | 追記 | — | Server Component initial list fixture |
| 3 | `apps/web/playwright.config.ts` | 追記 | — | evidence dir / webServer env gate |
| 4 | `packages/shared/src/schemas/identity-conflict.ts` | 補強 | — | strict object contract |
| 5 | `packages/shared/src/schemas/identity-conflict.test.ts` | 新規 | — | focused schema tests |
| 6 | `apps/web/playwright/fixtures/auth.ts` | 参照のみ | — | import 元 |

> 新規 Playwright fixture 追加は禁止。Server Component list は non-production env gate 付き inline fixture で供給する。

## 3. 依存ブロッカー

| 項目 | 状態 |
|------|------|
| API 実装 | ✅ 実装済（GET/MERGE/DISMISS） |
| repository | ✅ `targetMemberId` 返却確認済 |
| 共有 schema | ✅ 公開済 |
| fixture | ✅ Stage 1 で `signSession()` 活性化済 |
| UI 層 | ✅ 実在前提（Phase 1 inventory 確認済） |

ブロッカー **なし**。即着手可能。

## 4. 関連 sub-task との関係

| 項目 | 関係 |
|------|------|
| 2a (admin-requests) | 別 route。fixture 共有のみ |
| 2c (admin-member-delete) | cascade preview skip は 2c 責務（本 spec ではスコープ外） |
| 2d (contract-stage-2) | 本 spec の §5 fixture 形を再利用する。fixture shape の安定性を維持すること |
