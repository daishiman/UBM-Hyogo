# Phase 08 Main — DRY 化

## Classification

| Field | Value |
| --- | --- |
| task | `06c-B-admin-members` |
| phase | `08 / 13` |
| taskType | `implementation-spec / docs-only` |
| docs_only | `true` |

## Before / After 表

| 領域 | Before | After |
| --- | --- | --- |
| 検索 query 型 | route 内 inline 定義 | `packages/shared/src/admin/search.ts` の `AdminMemberSearch` 型 + parser に集約 |
| audit writer | handler 内で直接 INSERT | `apps/api/src/lib/audit.ts` の `writeAudit({ actor, target, action })` に抽出 |
| require-admin | 各 route で都度 check | middleware 1 箇所に統一（既存維持） |
| apps/web fetch | route ごとに fetch 文を生 | `apps/web/src/lib/fetch/admin.ts` の `fetchAdminMembers()` / `fetchAdminMember(id)` / `deleteAdminMember(id)` / `restoreAdminMember(id)` |
| endpoint path | `/api/admin/members/:memberId/delete` 等の混在 | `POST /api/admin/members/:memberId/delete` / `POST /api/admin/members/:memberId/restore` に統一（07-edit-delete 準拠） |
| role mutation | detail 画面に変更 UI を混在 | role は read-only 表示のみ。admin 追加/削除は本タスク scope 外（11-admin-management） |
| 命名 | `removeMember` / `disableMember` | `softDeleteMember` / `restoreMember` に統一（07-edit-delete 準拠） |

## shared 化対象（packages/shared 配置先）

| 対象 | 配置先 | 理由 |
| --- | --- | --- |
| `AdminMemberSearch` 型 | `packages/shared/src/admin/search.ts` | apps/web (form/SSR) と apps/api (query parser) で型を共有 |
| `parseAdminMemberSearch` | 同上 | trim/normalize/enum 検証を 1 箇所で（unit テスト容易） |
| `Member` / `AuditLogEntry` 型 | `packages/shared/src/admin/types.ts` | apps/api response と apps/web SSR で参照 |
| `AdminMemberAction = 'delete' \| 'restore'` | `packages/shared/src/admin/audit.ts` | audit writer と route で共有 |

## apps/api 内の lib 集約

- `apps/api/src/lib/audit.ts`: `writeAudit` + `writeAuditStmt`（batch 用 prepared statement 返却）
- `apps/api/src/lib/admin/members.ts`: `listMembers` / `getMember` / `softDeleteMember` / `restoreMember`

## 命名統一根拠（正本仕様の語彙）

- `softDelete` / `restore`: 07-edit-delete.md
- `filter=published|hidden|deleted` / `q` / `tag` / `sort` / `density`: 12-search-tags.md + 現行 admin API
- `audit_log` の actor / target / action / timestamp: 11-admin-management.md / 13 不変条件

## 多角的チェック

- #5: apps/web は fetch helper を経由（D1 binding を import しない構造的禁止）
- #13: audit 書込みが `apps/api/src/lib/audit.ts` の 1 箇所に集約
- 命名: 07-edit-delete / 12-search-tags の語彙と完全一致

## 完了条件チェック

- [x] 命名・path・endpoint が正本仕様の語彙に統一
- [x] 重複が `packages/shared` または `apps/api/src/lib/` に集約

## 次 Phase への引き渡し

Phase 9 へ、Before/After 7 件と shared 化対象 4 件を渡す。
