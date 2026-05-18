# Phase 5: テスト作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 / 13 |
| 種別 | テスト |
| 入力 | Phase 4 実装 |
| 出力 | 新規 spec ファイル群（`*.spec.{ts,tsx}` のみ） |

## 制約

- **`*.test.{ts,tsx}` 禁止**（lefthook `block-test-suffix` で reject される）
- `*.spec.{ts,tsx}` のみで spec 追加

## 新規 spec ファイル

| パス | 種別 | テストケース名（最低限） |
| --- | --- | --- |
| `apps/web/src/components/admin/__tests__/MeetingPanel.formfield.spec.tsx` | 新規 | `renders title input wrapped by FormField with label-for/id binding`; `applies aria-invalid when error is present`; `submit calls useAdminMutation.mutate once` |
| `apps/web/src/components/admin/__tests__/AuditLogPanel.formfield.spec.tsx` | 新規 | `6 filter fields render with proper label binding`; `submit triggers GET via useAdminMutation` |
| `apps/web/src/components/admin/__tests__/TagQueuePanel.useAdminMutation.spec.tsx` | 新規 | `resolves tag through useAdminMutation`; `disables submit while isPending` |
| `apps/web/src/components/admin/__tests__/SchemaDiffPanel.useAdminMutation.spec.tsx` | 新規 | `applies schema diff through useAdminMutation` |
| `apps/web/src/components/admin/__tests__/RequestQueuePanel.useAdminMutation.spec.tsx` | 新規 | `approve / reject paths both call useAdminMutation` |
| `apps/web/src/components/public/__tests__/DensityToggle.formfield.spec.tsx` | 新規 | `radio inputs share name and bind to FormField label` |
| `apps/web/app/(admin)/admin/__tests__/breadcrumb-adoption.spec.tsx` | 新規 | `8 admin routes render Breadcrumb with proper trail` |
| `apps/web/app/(admin)/admin/__tests__/emptystate-adoption.spec.tsx` | 新規 | `members/tags/meetings/requests/identity-conflicts/audit/schema render EmptyState on zero result` |
| `apps/web/app/(admin)/admin/__tests__/pagination-adoption.spec.tsx` | 新規 | `members / meetings / audit render Pagination with proper page/total wiring` |

## 既存 spec への追補

- `apps/web/src/lib/__tests__/useAdminMutation.spec.tsx` — `@deprecated` JSDoc が付いていることを検証する case を追加（任意）
- `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts` — IdentityConflictRow からの参照ケースを追加

## テスト方針

- React Testing Library + Vitest（既存 stack）
- Server Component 部分は render snapshot を取らず、accessibility / DOM 構造のみを検証
- `useAdminMutation` の fetch は `vi.fn()` / MSW で stub し、real D1 にアクセスしない

## ローカル実行コマンド

```bash
mise exec -- pnpm test -- apps/web/src/components/admin
mise exec -- pnpm test -- apps/web/src/components/public
mise exec -- pnpm test -- apps/web/app/\(admin\)
```

## 完了条件

- [ ] 上表 9 spec が新規作成されている
- [ ] `*.test.{ts,tsx}` ファイル新規作成は 0
- [ ] `pnpm test` exit 0
- [ ] a11y AC（AC-9）に該当する label-for / aria-invalid 検証 case が存在

## 次Phase

→ Phase 6（ローカル検証）
