# Phase 4: 実装

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 / 13 |
| 種別 | 実装 |
| 入力 | Phase 2 設計 |
| 出力 | 編集された admin UI / route / primitive / hook / gate / test ファイル（grep gate と adoption-tracker は Phase 7 / Phase 8 で証跡化） |

## 変更対象ファイル一覧（絶対パス・変更種別）

### 4-A: `<input>` → `FormField` 置換（6 ファイル / 計 15 箇所）

| パス | 変更種別 | 箇所数 | 詳細 |
| --- | --- | :---: | --- |
| `apps/web/src/components/admin/MeetingPanel.tsx` | 編集 | 6 | `<input>` 全 6 箇所を `<FormField name=... label=...>` で wrap、各 input に `id={name}` を付与 |
| `apps/web/src/components/admin/AuditLogPanel.tsx` | 編集 | 6 | フィルタフォームの 6 input を `FormField` 化（filter form は `<form>` のまま、各フィールドだけラップ） |
| `apps/web/src/components/admin/TagQueuePanel.tsx` | 編集 | 1 | tag 入力欄を `FormField` 化 |
| `apps/web/src/components/admin/SchemaDiffPanel.tsx` | 編集 | 1 | diff target 入力欄を `FormField` 化 |
| `apps/web/src/components/public/DensityToggle.client.tsx` | 編集 | 1 | radio input を `<FormField name="density" label="表示密度">` で wrap |

### 4-B: `useAdminMutation` 採用統一（mutation surface）

| パス | 変更種別 | 詳細 |
| --- | --- | --- |
| `apps/web/src/components/admin/MeetingPanel.tsx` | 編集 | meeting / attendance mutation を `useAdminMutation({ mutationFn }).trigger()` 経由に統一。既存 `lib/admin/api` wrapper と 409 / 422 toast 分岐は保持 |
| `apps/web/src/components/admin/TagQueuePanel.tsx` | 編集 | tag resolve mutation を `trigger()` 経由に統一 |
| `apps/web/src/components/admin/SchemaDiffPanel.tsx` | 編集 | schema alias mutation を `trigger()` 経由に統一。retryable continuation と 422 / 409 分岐は保持 |
| `apps/web/src/components/admin/RequestQueuePanel.tsx` | 編集 | request approve / reject mutation を `trigger()` 経由に統一。409 close / refresh flow は保持 |
| `apps/web/src/components/admin/IdentityConflictRow.tsx` | 編集 | import を `@/lib/useAdminMutation` → features hook に移行済み |
| `apps/web/src/components/admin/AuditLogPanel.tsx` | 対象外 | read-only surface のため mutation hook C2 対象外。EmptyState / Pagination の adoption gate で検査 |

### 4-C: `Breadcrumb` 配置（admin 8 routes）

| パス | 変更種別 | 詳細 |
| --- | --- | --- |
| `apps/web/app/(admin)/admin/page.tsx` | 編集 | `<Breadcrumb items={[{label:"管理"}]}/>` |
| `apps/web/app/(admin)/admin/members/page.tsx` | 編集 | `[{label:"管理",href:"/admin"},{label:"会員"}]` |
| `apps/web/app/(admin)/admin/tags/page.tsx` | 編集 | 同上パターン |
| `apps/web/app/(admin)/admin/meetings/page.tsx` | 編集 | 同上 |
| `apps/web/app/(admin)/admin/schema/page.tsx` | 編集 | 同上 |
| `apps/web/app/(admin)/admin/requests/page.tsx` | 編集 | 同上 |
| `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` | 編集 | 同上 |
| `apps/web/app/(admin)/admin/audit/page.tsx` | 編集 | 同上 |

### 4-D: `EmptyState` 採用（zero-result UI）

| 対象 | 変更種別 | 詳細 |
| --- | --- | --- |
| `apps/web/src/features/admin/components/_members/MembersTable.tsx` | 編集 | admin members 0 件 |
| `apps/web/src/components/admin/MeetingPanel.tsx` | 編集 | meeting 0 件 |
| `apps/web/src/components/admin/TagQueuePanel.tsx` | 編集 | tag queue 0 件 |
| `apps/web/src/components/admin/SchemaDiffPanel.tsx` | 編集 | diff / alias 0 件 |
| `apps/web/src/components/admin/RequestQueuePanel.tsx` | 編集 | request queue 0 件 |
| `apps/web/src/components/admin/AuditLogPanel.tsx` | 編集 | log 0 件 |
| `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` | 編集 | conflict 0 件 |

### 4-E: `Pagination` 採用（3 箇所）

| 対象 | 変更種別 | 詳細 |
| --- | --- | --- |
| `apps/web/src/features/admin/components/_members/MembersTable.tsx` | 編集 | current page / hasNext / hasPrev |
| `apps/web/src/components/admin/RequestQueuePanel.tsx` | 編集 | cursor-based next / previous link |
| `apps/web/src/components/admin/AuditLogPanel.tsx` | 編集 | cursor-based next / disabled state |

## 関数・型シグネチャ（canonical）

```tsx
// FormField wrap pattern
<FormField name="title" label="タイトル" required error={errors.title}>
  <input id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} />
</FormField>

// useAdminMutation
const createMeetingMutation = useAdminMutation({
  endpoint: "/api/admin/meetings",
  method: "POST",
  mutationFn: (payload) => createMeeting(payload),
  onSuccess: (created) => refresh(),
  refreshOnSuccess: false,
});

// Breadcrumb
<Breadcrumb items={[{ label: "管理", href: "/admin" }, { label: "Meeting" }]} />

// EmptyState
<EmptyState title="..." description="..." action={<Button .../>} />

// Pagination
<Pagination currentPage={page} hasNext={hasNext} hasPrev={hasPrev} onNext={goNext} onPrev={goPrev} />
```

## 入出力・副作用

- a11y: `label[for]` ↔ `input[id]` が name 経由で必ず紐付く
- mutation 中は `isPending` を submit button の `disabled` / `aria-busy` に反映
- error 発生時は `error` を FormField の `error` props に渡し `role="alert"` で読み上げ
- D1 アクセスなし（既存 API endpoint のみ）

## DoD（機械検証可能）

- [ ] `grep -rn --exclude-dir=__tests__ --include='*.tsx' '<input' apps/web/src/components/admin/ apps/web/src/components/public/DensityToggle.client.tsx` が 0 件
- [ ] mutating admin panels 4 件が features hook と `.trigger(` を含み、`void _.*Mutation` を含まない
- [ ] `grep -rln "from \"@/lib/useAdminMutation\"" apps/web/src/components/admin/` が 0 件
- [ ] admin route 8 件が `<Breadcrumb` または `<AdminPageHeader` を render し、`void Breadcrumb` を含まない
- [ ] EmptyState required surfaces 7 件が `<EmptyState` を render
- [ ] Pagination required surfaces 3 件が `<Pagination` を render

## 多角的チェック観点

- `<input>` 削除と同時に既存 `value` / `onChange` / `name` の挙動が保持されているか
- Server Component と Client Component の境界を越えていないか（Breadcrumb が Server Component で動くか確認）
- HEX 直書き混入なし（`bg-[#xxx]` / `text-[#xxx]` を Phase 4 中も発生させない）

## ローカル実行コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
pnpm exec vitest run --config vitest.config.ts <focused admin primitive specs>
```

## 完了条件

- [ ] 全変更ファイルが Phase 4 表通り編集されている
- [ ] DoD の grep 全件が満たされる
- [ ] typecheck / lint がローカルで pass

## 次Phase

→ Phase 5（テスト追加）
