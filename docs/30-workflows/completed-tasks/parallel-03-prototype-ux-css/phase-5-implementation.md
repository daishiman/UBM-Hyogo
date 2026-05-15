# Phase 5: 実装

> Phase: 5 / 13

---

## 目的

Phase 4 Red を Green にする最小差分を 5 ファイルに加える。CSS、semantic/data 属性、local type に限定し、API / D1 / public response contract は変更しない。

---

## 5.1 変更ファイル一覧

| パス | 種別 | 概要 |
|------|------|------|
| `apps/web/src/styles/globals.css` | 編集 | `@layer components` に G3-1/2/3 ブロック追加 |
| `apps/web/src/components/public/MemberFilters.client.tsx` | 編集 | active tag button に `aria-pressed` / `data-selected` / `data-component="tag-pill"` 付与 |
| `apps/web/src/components/public/MemberCard.tsx` | 編集 | markup 変更なし。`className` の transition 重複だけ確認 |
| `apps/web/src/components/public/MemberDetailSections.tsx` | 編集 | `Section` 型に `visibility?` を追加し `<section>` に `data-visibility` 付与 |
| `apps/web/src/components/public/FormPreviewSections.tsx` | 編集 | 既存 `data-role="visibility"` span に `data-visibility={value}` を追加（無ければ） |

---

## 5.2 実装手順

### Step 1: token 存在確認

```bash
grep -E -- '--ubm-(color-(text-primary|surface-panel|border-strong|ok|zone-b|danger)|shadow-sm|dur-fast|ease-standard)' apps/web/src/styles/tokens.css
```

すべての token が hit すれば Step 2 へ。欠落があれば tokens.css 側は変更せず Phase 3 review に差し戻す。

### Step 2: `globals.css` 編集

`@layer components` の末尾に Phase 2 設計の CSS 3 ブロック（G3-1 / G3-2 / G3-3）を貼り付ける。既存 `@layer components` 宣言が複数ある場合はいずれか 1 つに集約する。

### Step 3: `MemberFilters.client.tsx`

active tag を render する button JSX を以下に差し替える:

```tsx
<button
  type="button"
  onClick={() => onTagToggle(t)}
  data-component="tag-pill"
  data-selected="true"
  aria-pressed={true}
>
  #{t} ×
</button>
```

> 現 UI は active tag 削除 pill だけを描画する。通常 button に `aria-selected` は付与せず、toggle 状態は `aria-pressed`、CSS hook は `data-selected` を正本にする。

### Step 4: `MemberDetailSections.tsx`

```ts
type SectionVisibility = "public" | "member" | "admin";

type Section = {
  key: string;
  title: string;
  visibility?: SectionVisibility;
  // ...既存 fields
};
```

render 部:

```tsx
<section
  key={section.key}
  data-component="profile-section"
  data-section={section.key}
  data-visibility={section.visibility ?? "public"}
>
  {/* 既存中身 */}
</section>
```

### Step 5: `FormPreviewSections.tsx`

既存 `<span data-role="visibility">…</span>` に `data-visibility={value}`（value は当該 visibility 値）を追加。値が未定なら `"public"` を fallback とする。

### Step 6: `MemberCard.tsx`

markup 変更なし。className に既に存在する `transition-*` Tailwind utility が CSS layer と競合しないことを目視で確認するのみ。必要なら Tailwind の transition utility を取り除き、CSS layer 側に統一する。

---

## 5.3 ローカル検証

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare  # OpenNext build 通過確認
if mise exec -- pnpm verify:tokens; then
  echo "verify:tokens PASS"
else
  rg -n 'bg-\[#|text-\[#|border-\[#|#[0-9A-Fa-f]{3,8}' apps/web/src && echo "NG" && exit 1 || echo "fallback token grep PASS"
fi
```

すべて `completed (local exit 0)` で Phase 5 完了。

---

## 5.4 DoD（Phase 5 単独）

- [ ] Phase 4 で書いた Vitest spec が Green
- [ ] `pnpm typecheck` / `pnpm lint` `completed (exit 0)`
- [ ] HEX 直書き grep が 0 件
- [ ] `globals.css` の追加規則がすべて `@layer components` 内
