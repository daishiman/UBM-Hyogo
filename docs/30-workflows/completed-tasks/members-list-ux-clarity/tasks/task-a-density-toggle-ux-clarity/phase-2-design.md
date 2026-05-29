<!-- workflow: members-list-ux-clarity / task: A / phase: 2 -->

# Phase 2 — 設計 (task-a-density-toggle-ux-clarity)

[実装区分: 実装仕様書]

> 親 Phase 2: `../../phase-2-design.md` § 2 (DensityToggle UX 強化)

## 1. 設計方針

| 原則 | 適用 |
| ---- | ---- |
| 既存 primitive 維持 | `Segmented` を再利用。option 型に optional prop を加法追加 |
| 加法的拡張 | 既存呼び出し (`{ value, label }` のみ) は無変更で動作する後方互換 |
| URL query SSOT 維持 | `useRouter().replace` + `URLSearchParams` ロジックは無変更 |
| OKLch tokens のみ | sublabel / HelpHint 装飾は `--ubm-color-*` のみ使用 |
| 新 primitive 禁止 | HelpHint は feature レベル client component (`apps/web/src/components/public/`) で実装 |

## 2. データ構造

### 2.1 OPTIONS 拡張 (DensityToggle.client.tsx)

```ts
type Density = "comfy" | "dense" | "list";

interface DensityOption {
  value: Density;
  label: string;          // プロトタイプ主ラベル (不変)
  sublabel: string;       // ボタン内下段表示
  description: string;    // visually-hidden description + HelpHint dd 本文
  iconHint?: string;      // 任意・現状は未使用 (将来拡張余地)
}

const OPTIONS: ReadonlyArray<DensityOption> = [
  {
    value: "comfy",
    label: "ゆったり",
    sublabel: "カード詳細",
    description: "顔写真・自己紹介・タグまでカードに表示。じっくり見たい人向け。",
  },
  {
    value: "dense",
    label: "密",
    sublabel: "カード簡易",
    description: "カードを小さくして 1 画面に多く並べる。ざっと見渡したい人向け。",
  },
  {
    value: "list",
    label: "リスト",
    sublabel: "1行リスト",
    description: "名前・職業・拠点を 1 行で並べる。名前で素早く探したい人向け。",
  },
];
```

### 2.2 Segmented 拡張 (Segmented.tsx)

```ts
export interface SegmentedOption {
  value: string;
  label: string;
  sublabel?: string;         // 追加 (optional)
  ariaDescribedBy?: string;  // 追加 (optional) — 対応する visually-hidden span の id
}
```

`<button>` 内構造:

```jsx
<button ... aria-describedby={opt.ariaDescribedBy}>
  <span data-role="label">{opt.label}</span>
  {opt.sublabel ? <span data-role="sublabel">{opt.sublabel}</span> : null}
</button>
```

### 2.3 HelpHint 設計 (DensityToggle.client.tsx — 新規)

```ts
export interface HelpHintItem {
  label: string;
  description: string;
}

export interface HelpHintProps {
  triggerLabel: string;                // visually-hidden text (例: "表示密度の説明を見る")
  items: ReadonlyArray<HelpHintItem>;  // dl > dt/dd 列挙
  "data-component"?: string;           // 上書き可 (デフォルト "help-hint")
}
```

構造:

```jsx
<details data-component="help-hint">
  <summary aria-label={triggerLabel}>
    <span aria-hidden="true">?</span>
  </summary>
  <div role="region" aria-label={triggerLabel}>
    <dl>
      {items.map(({ label, description }) => (
        <Fragment key={label}>
          <dt>{label}</dt>
          <dd>{description}</dd>
        </Fragment>
      ))}
    </dl>
  </div>
</details>
```

a11y / 設計判断:

- focus trap・ESC ハンドリングは native `<details>` 挙動に委譲 (実装しない)
- `<summary>` の `aria-label` は visually-hidden の代替として `aria-label` 属性で提供
- popover は `<details>` の native open 状態で開閉 (`useState` 不要)
- click outside 自動 close は提供しない (MVP スコープ外)

## 3. DensityToggle 全体構造 (After)

```jsx
<div data-component="density-toggle-wrapper">
  <Segmented
    ariaLabel="表示密度"
    data-component="density-toggle"
    value={value}
    options={OPTIONS.map(o => ({
      value: o.value,
      label: o.label,
      sublabel: o.sublabel,
      ariaDescribedBy: `density-${o.value}-desc`,
    }))}
    onChange={onChange}
  />
  {/* visually-hidden description spans (SR 用) */}
  {OPTIONS.map(o => (
    <span
      key={o.value}
      id={`density-${o.value}-desc`}
      data-role="density-description"
      className="sr-only"
    >
      {o.description}
    </span>
  ))}
  <HelpHint
    triggerLabel="表示密度の説明を見る"
    items={OPTIONS.map(o => ({ label: o.label, description: o.description }))}
  />
</div>
```

> `data-component="density-toggle-wrapper"` を root とし、Segmented と HelpHint を兄弟配置する。
> 既存呼び出し元 (`MemberFilters` / `page.tsx`) は `<DensityToggle value={...} />` の shape を維持。

## 4. data-* 属性一覧

| selector | 用途 |
| -------- | ---- |
| `[data-component="density-toggle-wrapper"]` | 新規 root (CSS scope) |
| `[data-component="density-toggle"]` | Segmented (既存) |
| `[data-component="density-toggle"] [data-role="sublabel"]` | sublabel 小文字テキスト |
| `[data-role="density-description"]` | visually-hidden description span |
| `[data-component="help-hint"]` | popover root |
| `[data-component="help-hint"] summary` | `?` トリガ |

## 5. CSS (legacy-public.css 抜粋方針)

OKLch tokens のみ使用。代表セレクタの方針:

```css
[data-component="density-toggle"] [data-role="sublabel"] {
  display: block;
  font-size: var(--ubm-font-size-xs);
  color: var(--ubm-color-fg-muted);
  margin-top: var(--ubm-space-1);
}

[data-component="density-toggle-wrapper"] {
  display: flex;
  align-items: center;
  gap: var(--ubm-space-2);
}

[data-component="help-hint"] > summary {
  list-style: none;             /* native marker 抑止 */
  cursor: pointer;
  width: var(--ubm-space-6);
  height: var(--ubm-space-6);
  border-radius: var(--ubm-radius-full);
  background: var(--ubm-color-bg-subtle);
  color: var(--ubm-color-fg-default);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

[data-component="help-hint"][open] > div {
  position: absolute;
  background: var(--ubm-color-bg-surface);
  border: 1px solid var(--ubm-color-border-default);
  border-radius: var(--ubm-radius-md);
  padding: var(--ubm-space-3);
  box-shadow: var(--ubm-shadow-md);
  z-index: 10;
}

@media (max-width: 480px) {
  [data-component="density-toggle"] [data-role="sublabel"] {
    position: absolute;
    width: 1px; height: 1px;
    padding: 0; margin: -1px;
    overflow: hidden; clip: rect(0,0,0,0);
    white-space: nowrap; border: 0;
  }
}
```

> 上記はトークン名イメージ。実トークン名は `apps/web/src/styles/tokens.css` を Phase 5 で確認して
> 既存命名 (`--ubm-color-*` / `--ubm-space-*`) のみを使用する。新トークン定義は禁止。

## 6. URL query 不変条件

| key | 変更 |
| --- | ---- |
| `density` | なし (`comfy` 省略 / `dense` / `list`) |

`onChange` ロジック・`router.replace` 呼び出しは Before/After 完全同一。

## 7. 副作用

- レンダリング以外の副作用なし
- URL state 変更は既存通り `router.replace({ scroll: false })`
- ローカル state 追加なし (HelpHint open/close は native `<details>`)

## 8. visual diff 予想

| viewport | Before | After |
| -------- | ------ | ----- |
| desktop (1024+) | Segmented 3 ボタン (高さ ~32px) | Segmented 3 ボタン (高さ ~52px, 下段 sublabel) + 右隣に `?` icon |
| mobile (375) | Segmented 3 ボタン | Segmented 3 ボタン (高さ Before と同等, sublabel visually-hidden) + `?` icon |

→ Task C で `members-prototype-alignment.spec.ts` の baseline 再撮影が必要 (RA-1)。

## 9. open questions (Phase 3 で解消)

- visually-hidden description span を OPTIONS map で 3 個並列描画するか、`<dl>` 形式 1 つにまとめるか
- HelpHint の `<summary>` 内 `?` を SVG icon にするか文字グリフのままにするか
- HelpHint popover の表示位置 (absolute / fixed) を desktop と mobile で分けるか

## DoD

- [x] OPTIONS shape の拡張内容が明示されている
- [x] Segmented 型拡張が後方互換 (optional prop のみ) で示されている
- [x] HelpHint の props / 構造 / a11y 戦略が示されている
- [x] data-* / CSS selector が一覧化されている
- [x] URL query 不変条件が明示されている
- [x] mobile breakpoint 設計が示されている
- [x] open questions が phase-3 への引継ぎ事項として列挙されている
