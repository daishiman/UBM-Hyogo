# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 / 13 |
| 種別 | 設計 |
| 入力 | Phase 1 spec-extraction-map.md、baseline matrix |
| 出力 | adapter 設計、props 統一仕様、grep gate 設計、命名規約 |

## 目的

- 5 primitive + `useAdminMutation` の **採用パターン**を 1 つに固定し、19 routes の置換を機械的に実行可能にする
- grep CI gate（`scripts/verify-primitive-adoption.sh`）の判定ロジックを設計する
- 同名 export（`useAdminMutation` が `lib/` と `features/admin/hooks/` の 2 箇所に存在）の正本を確定する

## 設計1: FormField 採用パターン

### canonical 使用形

```tsx
import { FormField } from "@/components/ui/FormField";

<FormField
  name="title"
  label="タイトル"
  required
  error={errors.title}
  hint="50文字以内"
>
  <input
    id="title"
    name="title"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
  />
</FormField>
```

### 必須 props

| props | 型 | 必須 | 用途 |
| --- | --- | :---: | --- |
| `name` | `string` | ✅ | input の `name` / `id` 連動 |
| `label` | `ReactNode` | ✅ | `<label htmlFor={name}>` |
| `required` | `boolean` | - | aria-required + 視覚 marker |
| `error` | `string \| undefined` | - | `<p role="alert" aria-describedby>` |
| `hint` | `ReactNode` | - | 補助テキスト |
| `children` | `ReactElement` | ✅ | input 要素（id は自動付与しない、明示的に `id={name}` を書く） |

### a11y 不変条件

- `label[for]` と `input[id]` が必ず紐付く（name と id を同一文字列にすることで担保）
- error 時は `aria-invalid="true"` + `aria-describedby` を input に付与
- error message には `role="alert"` を付与

### 設計2: useAdminMutation 採用パターン

### 同名 export の正本確定

| パス | 役割 | 正本判定 |
| --- | --- | --- |
| `apps/web/src/lib/useAdminMutation.ts` | legacy（IdentityConflictRow のみ参照） | 移行元 |
| `apps/web/src/features/admin/hooks/useAdminMutation.ts` | feature 配下の canonical | **正本** |

→ mutation を持つ admin surface は `apps/web/src/features/admin/hooks/useAdminMutation.ts` を正本とする。`apps/web/src/lib/useAdminMutation.ts` は本タスクでは削除しない。既存外部参照の有無を Phase 4 で確認し、必要なら `@deprecated` JSDoc と grep gate で新規 admin panel 参照を禁止する。削除そのものは本タスクの要件ではないため、未タスク化しない。

### canonical 使用形

```tsx
import { useAdminMutation } from "../../features/admin/hooks/useAdminMutation";

const createMeetingMutation = useAdminMutation({
  endpoint: "/api/admin/meetings",
  method: "POST",
  mutationFn: (payload) => createMeeting(payload),
  onSuccess: () => refresh(),
  refreshOnSuccess: false,
});

await createMeetingMutation.trigger({ title, dateLocal, note });
```

## 設計3: Breadcrumb 採用パターン

```tsx
// apps/web/app/(admin)/admin/meetings/page.tsx
import { Breadcrumb } from "@/components/admin/Breadcrumb";

<Breadcrumb items={[
  { label: "管理", href: "/admin" },
  { label: "Meeting" },
]} />
```

- 各 admin route の `page.tsx` の先頭に配置
- 最終要素は `href` を持たず現在地として表示

## 設計4: EmptyState 採用パターン

```tsx
import { EmptyState } from "@/components/ui/EmptyState";

{items.length === 0 ? (
  <EmptyState
    title="該当する会員が見つかりません"
    description="検索条件を変更してください"
    action={<Button onClick={resetFilters}>条件をリセット</Button>}
  />
) : (
  <MembersList items={items} />
)}
```

## 設計5: Pagination 採用パターン

```tsx
import { Pagination } from "@/components/ui/Pagination";

<Pagination
  page={page}
  pageSize={pageSize}
  total={total}
  onChange={(next) => setPage(next)}
/>
```

## 設計6: grep gate 設計

### `scripts/verify-primitive-adoption.sh` 判定ロジック

| check | 判定 | exit 条件 |
| --- | --- | --- |
| C1: admin / public-density に `<input` 直書きなし | `grep -rn '<input' apps/web/src/components/admin/ apps/web/src/components/public/DensityToggle.client.tsx` が 0 件 | 非 0 件で fail |
| C2: mutation を持つ admin panel が `useAdminMutation().trigger()` を実行 | `MeetingPanel` / `TagQueuePanel` / `SchemaDiffPanel` / `RequestQueuePanel` が features hook と `.trigger(` を含み、`void _.*Mutation` を含まない | 1 件でも欠落で fail |
| C3: admin 8 route page.tsx が Breadcrumb を render | `<Breadcrumb` または `<AdminPageHeader` が存在し、`void Breadcrumb` が存在しない | 1 件でも欠落で fail |
| C4: legacy lib useAdminMutation が新規 panel から参照されない | `grep -rln "from \"@/lib/useAdminMutation\"" apps/web/src/components/admin/` が 0 件 | 非 0 件で fail |
| C5: EmptyState 採用 required surfaces | 7 surface 全てで `<EmptyState` が存在 | 1 件でも欠落で fail |
| C6: Pagination 採用 required surfaces | 3 surface 全てで `<Pagination` が存在 | 1 件でも欠落で fail |

### CI workflow 設計

- workflow file: `.github/workflows/verify-primitive-adoption.yml`
- trigger: `pull_request` / `push` to `dev` / `main`
- job 名: `verify-primitive-adoption / verify`
- step: checkout → pnpm install → `bash scripts/verify-primitive-adoption.sh`
- governance Phase 10 で `dev` / `main` の required status check 追加候補として記録（実 PUT はユーザー承認後）

## 設計7: validation matrix

| command | 期待 exit | 検証対象 |
| --- | --- | --- |
| `mise exec -- pnpm typecheck` | 0 | 全 TS エラーなし |
| `mise exec -- pnpm lint` | 0 | ESLint 違反なし |
| `mise exec -- pnpm test` | 0 | 全 spec pass |
| `bash scripts/verify-primitive-adoption.sh` | 0 | C1〜C4 全 pass |
| `bash scripts/coverage-guard.sh` | 0 | 80% 維持 |
| `mise exec -- pnpm exec next build`（apps/web） | 0 | Workers build green |

## 完了条件

- [x] 6 primitive それぞれの canonical 使用形が定義されている
- [x] `useAdminMutation` の正本パスが確定
- [x] grep gate の 4 check 判定ロジックが明文化されている
- [x] validation matrix が table 化されている

## 多角的チェック観点

- canonical 使用形が現行 props 定義（`apps/web/src/components/ui/FormField.tsx` 等）と一致するか → Phase 3 の grep で確認
- 同名 export drift（lib vs features hook）が adapter ではなく正本一本化で解消される設計か
- `DensityToggle.client.tsx` の radio input は FormField で wrap するか別 primitive 化するか → 本 spec では FormField wrap で統一（複雑化しないため）

## 次Phase

→ Phase 3（NO-GO / PASS / MAJOR ゲート設定）
