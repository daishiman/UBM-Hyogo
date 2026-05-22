# Phase 5: 実装 (TDD Green)

[実装区分: 実装仕様書]

## 目的

Phase 4 の Red テストを Green 化する最小実装を W2-W5 で順に行う。現行 repo には対象 route/component/helper が存在するため、**新規 tree 作成ではなく既存実装の contract hardening** として扱う。

## 既存 canonical ファイル / 変更方針

### route page (server component)

| path | 役割 |
|------|------|
| `apps/web/app/(admin)/admin/schema/page.tsx` | 既存 `fetchAdmin("/admin/schema/diff")` + `<SchemaDiffPanel>` を維持し、不足 acceptance のみ patch |
| `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` | 既存 `fetchAdmin("/admin/identity-conflicts")` + `<IdentityConflictRow>` を維持し、merge/dismiss UX 不足のみ patch |
| `apps/web/app/(admin)/admin/audit/page.tsx` | 既存 searchParams -> `/admin/audit?...` + `<AuditLogPanel>` を維持し、filter/cursor/JST 不足のみ patch |

### feature components (client / server mix)

| path | 役割 |
|------|------|
| `apps/web/src/components/admin/SchemaDiffPanel.tsx` | existing canonical。stableKey assign / retryable continuation / apply UI を補強 |
| `apps/web/src/components/admin/IdentityConflictRow.tsx` | existing canonical。`targetMemberId` + reason body の merge/dismiss contract を補強 |
| `apps/web/src/components/admin/AuditLogPanel.tsx` | existing canonical。`actorEmail/targetType/targetId/limit` query、JST display、masked JSON disclosure を補強 |

### admin helper (client/server fns)

| path | 関数シグネチャ |
|------|-------------|
| `apps/web/src/lib/admin/server-fetch.ts` | server route fetch 正本。`/admin/schema/diff`, `/admin/identity-conflicts`, `/admin/audit` を呼ぶ |
| `apps/web/src/lib/admin/api.ts` | client mutation 正本。`postSchemaAlias({ questionId, stableKey, diffId? })` を維持し、必要なら `mergeIdentityConflict(id,{ targetMemberId, reason })` / `dismissIdentityConflict(id,{ reason })` を additive 追加 |

### zod 型定義 (各 adapter ファイル内に export)

```ts
// apps/web/src/lib/admin/api.ts schema alias section
export const AdminSchemaSnapshotZ = z.object({...});
export const AdminSchemaDiffEntryZ = z.object({
  entryId: z.string(),
  type: z.enum(["added","removed","changed","unresolved"]),
  label: z.string(),
  fieldType: z.string(),
  sectionIndex: z.number().int().nonnegative(),
  currentStableKey: z.string().nullable(),
  proposedStableKey: z.string().nullable(),
});
export const AdminSchemaViewZ = z.object({ current, latest, diff });

// identity-conflicts shared/API contract
// merge body は { targetMemberId, reason }。keepMemberId ではない。
// list query は { cursor?, limit? }。status filter は現行 API に無い。

// apps/web/app/(admin)/admin/audit/page.tsx query contract
export const AuditEventZ = z.object({ auditId, actorEmail: z.string().nullable(), action, targetType, targetId: z.string().nullable(), createdAt });
export const AuditListZ = z.object({ items, nextCursor: z.string().nullable().optional() });
```

### 編集禁止 (R)

- `apps/web/app/(admin)/layout.tsx` (task-15 確定済み)
- `apps/api/src/routes/admin/*.ts` (D1 access / endpoint surface)

## 実装順序 (Wave に従う)

1. **W2 helper**: `apps/web/src/lib/admin/api.ts` / `server-fetch.ts` の不足 helper + focused test green
2. **W3 schema 画面**: `SchemaDiffPanel` → `page.tsx` → component test green
3. **W4 conflicts 画面**: `IdentityConflictRow` → `page.tsx` → merge/dismiss contract green
4. **W5 audit 画面**: `AuditLogPanel` → `page.tsx` → filter/cursor/JST test green
5. **W5 連結**: task-15 dashboard "Recent Actions" → `/admin/audit?actor=...` の searchParams 初期反映確認

## 不在 endpoint フォールバック (§0.4 / Phase 1 R-09)

`POST /admin/schema/aliases` が 404 を返した場合:
- helper は `{ ok: false, status: 404, error: "ASSIGN_NOT_AVAILABLE" }` 相当へ正規化
- `SchemaDiffPanel` は `useEffect` で probe せず、submit 時の error を捕捉して input + Button を `disabled` 化 + tooltip "API 未提供"

## OKLch 規律

- HEX 直書き 0 件
- `bg-success-soft` / `bg-danger-soft` / `bg-warning-soft` の token は `apps/web/src/styles/tokens.css` で `color-mix(in oklch, ...)` 形式
- token に該当が無い場合は本 task で追加せず Phase 11 で MINOR 報告 → 未タスク化

## 想定 commit ブロック

| commit | 範囲 |
|--------|------|
| `feat(web/admin): harden schema diff/apply contract` | `SchemaDiffPanel` + `apps/web/src/lib/admin/api.ts` |
| `feat(web/admin): harden identity-conflicts contract` | `IdentityConflictRow` + route test |
| `feat(web/admin): harden audit browsing contract` | `AuditLogPanel` + `audit/page.test.ts` |

## ローカル検証コマンド

```bash
mise exec -- pnpm -F @ubm-hyogo/web typecheck
mise exec -- pnpm -F @ubm-hyogo/web lint
mise exec -- pnpm -F @ubm-hyogo/web test --run \
  src/components/admin/__tests__/SchemaDiffPanel.test.tsx \
  src/components/admin/__tests__/AuditLogPanel.test.tsx \
  src/lib/admin/__tests__/api.test.ts \
  app/\\(admin\\)/admin/audit/page.test.ts
mise exec -- pnpm verify-design-tokens
```

## DoD

- [ ] 既存 canonical files の不足補強が完了し、不要な parallel tree (`src/features/admin`, `src/lib/api/admin-*`) を作っていない
- [ ] Phase 4 の focused tests がすべて Green
- [ ] `apps/api` 配下の差分が 0 行 (`git diff apps/api/`)
- [ ] HEX 直書き 0 件 (`grep -RnE "#[0-9a-fA-F]{3,8}" apps/web/src/components/admin apps/web/app/\(admin\)/admin/{schema,identity-conflicts,audit}`)
- [ ] `pnpm typecheck` / `pnpm lint` / `pnpm verify-design-tokens` green
