# Phase 2: 設計

> Phase: 2 / 13

---

## 目的

G3-1/2/3 を実装するための CSS セレクタ・props 拡張・data 属性・transition 設計を確定する。

---

## 2.1 G3-1: Tag pill selected fill

### markup（`MemberFilters.client.tsx`）

```tsx
<button
  type="button"
  onClick={() => onTagToggle(t)}
  data-component="tag-pill"
  data-selected="true"
  aria-pressed={true}
  className="..."
>
  #{t} ×
</button>
```

- `aria-pressed` を active tag 削除 pill の主契約とし、視覚 selector は `data-selected="true"` に寄せる。
- `aria-selected` は `option` / `tab` 等の選択可能ロール向けであり、通常 button には付与しない。
- 現 UI では active tag 削除 pill だけが描画されるため、非選択 tag pill は存在しない。

### CSS（`globals.css` `@layer components`）

```css
@layer components {
  button[data-component="tag-pill"] {
    transition: background-color var(--ubm-dur-fast) var(--ubm-ease-standard),
                color var(--ubm-dur-fast) var(--ubm-ease-standard),
                border-color var(--ubm-dur-fast) var(--ubm-ease-standard);
  }
  button[data-component="tag-pill"][aria-pressed="true"],
  button[data-component="tag-pill"][data-selected="true"] {
    background: var(--ubm-color-text-primary);
    color: var(--ubm-color-surface-panel);
    border-color: var(--ubm-color-text-primary);
  }
}
```

---

## 2.2 G3-2: Member card hover transition

### CSS（`globals.css` `@layer components`）

```css
@layer components {
  [data-component="member-card"] {
    box-shadow: var(--ubm-shadow-xs);
    transition: border-color var(--ubm-dur-fast) var(--ubm-ease-standard),
                box-shadow var(--ubm-dur-fast) var(--ubm-ease-standard);
  }
  [data-component="member-card"]:hover {
    border-color: var(--ubm-color-border-strong);
    box-shadow: var(--ubm-shadow-sm);
  }
  [data-component="member-card"]:focus-within {
    border-color: var(--ubm-color-border-strong);
    box-shadow: var(--ubm-shadow-sm);
    outline: 2px solid var(--ubm-color-text-primary);
    outline-offset: 2px;
  }
}
```

- markup 変更なし。既存 `data-component="member-card"` をそのまま利用。
- card 自体が focusable でないため、親への視覚反映は `:focus-within` を必須契約にする。

---

## 2.3 G3-3: Profile visibility marker

### Section 型（`MemberDetailSections.tsx`）

```ts
type SectionVisibility = "public" | "member" | "admin";

type Section = {
  key: string;
  title: string;
  visibility?: SectionVisibility; // optional, default "public"
  // ...既存 fields
};
```

- MVP では section に visibility を持たないため、render 時に `section.visibility ?? "public"` で fallback。
- 型は localized type alias（このファイル内 export）。API への波及なし。

### markup

```tsx
<section
  key={section.key}
  data-component="profile-section"
  data-section={section.key}
  data-visibility={section.visibility ?? "public"}
>
  ...
</section>
```

### CSS（`globals.css` `@layer components`）

```css
@layer components {
  [data-component="profile-section"][data-visibility] {
    position: relative;
    border-left: 4px solid transparent;
    padding-left: 0.75rem;
  }
  [data-component="profile-section"][data-visibility]::before {
    content: "";
    margin-right: 0.25rem;
  }
  [data-component="profile-section"][data-visibility="public"] {
    border-left-color: var(--ubm-color-ok);
  }
  [data-component="profile-section"][data-visibility="public"]::before { content: "🌍 "; }
  [data-component="profile-section"][data-visibility="member"] {
    border-left-color: var(--ubm-color-zone-b);
  }
  [data-component="profile-section"][data-visibility="member"]::before { content: "👥 "; }
  [data-component="profile-section"][data-visibility="admin"] {
    border-left-color: var(--ubm-color-danger);
  }
  [data-component="profile-section"][data-visibility="admin"]::before { content: "🔐 "; }
  [data-role="visibility"][data-visibility] {
    border-inline-start: 3px solid currentColor;
    padding-inline-start: 0.375rem;
  }
}
```

### `FormPreviewSections.tsx`

- 既存 `<span data-role="visibility" data-visibility={value}>` がある場合は label 用 selector のみを効かせる。
- 既存 markup に `data-visibility` が無い場合は label span に `data-visibility={value}` を付与（`data-role` は維持）。

---

## 2.4 副作用と所有権

- State / API / DOM 構造変更なし
- 視覚変化のみ（CSS / semantic/data 属性追加 / local type）
- props 変更は `MemberFilters.client.tsx` の active 判定 boolean を attribute へ落とすのみ
- 型変更は `MemberDetailSections.tsx` のローカル `Section` type に optional field を追加

---

## 2.5 SubAgent lane（solo dev 用関心分離）

| lane | 主作業 |
|------|--------|
| L1: CSS lane | `globals.css` への 3 ブロック追加 |
| L2: Component lane | `MemberFilters.client.tsx` / `MemberDetailSections.tsx` / `FormPreviewSections.tsx` 編集 |
| L3: Test lane | Vitest spec 追加（filters / details） |

L1/L2 は並列着手可、L3 は L1/L2 完了後に走らせる。
