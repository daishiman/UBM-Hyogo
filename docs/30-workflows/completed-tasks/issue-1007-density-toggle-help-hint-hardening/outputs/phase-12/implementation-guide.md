# Implementation Guide

## Part 1: Concept

なぜ必要か: 同じ密度切替をページに複数置いたとき、説明文の `id` が同じだと支援技術が別の説明を読む可能性がある。ヘルプも開いたまま残ると、キーボード利用者やマウス利用者が表示を戻しにくい。

たとえば教室で同じ番号の名札を複数人が付けていると、先生は誰を呼べばよいか分からない。`useId()` は名札にクラス固有の番号を足す仕組みで、`Escape` と外側クリックは開いた説明カードを片付ける操作である。

何が変わるか: `DensityToggle` は説明 `id` を instance ごとに一意化し、HelpHint を `Escape` / outside pointerdown で閉じ、平文 `?` を既存 Icon system の `help` glyph に置き換える。

### 今回作ったもの

| 対象 | 内容 |
| --- | --- |
| `DensityToggle.client.tsx` | `useId()` description ids、非制御 `<details>` の close hardening、`Icon name="help"` |
| `Icon.tsx` / `icons.ts` | `help` glyph と `IconName` union 追加 |
| `DensityToggle.client.spec.tsx` | 複数配置、Escape、outside click、icon、listener cleanup の focused tests |
| Phase 11 screenshots | closed / open / segmented の visual evidence |

## Part 2: Implementation

`DensityToggle.client.tsx` は `descId(value)` を `useId()` prefix から作り、`SegmentedOption.describedBy` と hidden description span を同じ source から派生させる。`<details>` は非制御のまま `detailsRef` を保持し、close 操作だけを命令的に行う。

```ts
type Density = "comfy" | "dense" | "list";

interface DensityOption {
  value: Density;
  label: string;
  sublabel: string;
  description: string;
}

interface DensityToggleProps {
  value: Density;
}
```

### APIシグネチャ

```tsx
<DensityToggle value="comfy" />
<Icon name="help" size="sm" />
```

### 使用例

```tsx
<header className="page-head">
  <h1>メンバー一覧</h1>
  <DensityToggle value={search.density} />
</header>
```

### エラーハンドリング

`browserDocument()` が `undefined` の SSR/非ブラウザ環境では listener を登録しない。`pointerdown` の target は `target instanceof Node` で guard してから `contains()` を呼び、想定外 target で落ちないようにする。unmount 時は `keydown` / `pointerdown` listener を必ず remove する。

### エッジケース

複数 instance を同時に描画しても description id は衝突しない。`Escape` は HelpHint が open のときだけ閉じ、focus を summary に戻す。HelpHint 内部の pointerdown では閉じず、Tab では閉じない。summary click の native toggle は維持する。

### 設定項目と定数一覧

| 項目 | 値 |
| --- | --- |
| density values | `comfy`, `dense`, `list` |
| default route fallback | `/members` |
| HelpHint label | `表示密度の説明を見る` |
| icon name | `help` |
| screenshot files | `density-toggle-help-closed.png`, `density-toggle-help-open.png`, `density-toggle-segmented.png` |

### テスト構成

Focused test `DensityToggle.client.spec.tsx` は 15 tests を固定する。主要観点は 2〜3 配置の id unique、instance-local describedBy、Escape close + focus restore、outside pointer close、inside pointer non-close、Tab non-close、native summary reopen、Icon rendering、unmount cleanup。

`IconName` union に `"help"` を追加し、`Icon.tsx` の switch に `case "help"` を追加するため、web typecheck が網羅性 gate になる。`help` glyph は `stroke="currentColor"` の自前 SVG なので design token gate に新しい HEX 例外を増やさない。

Phase 11 visual evidence is saved at:

- `outputs/phase-11/screenshots/density-toggle-help-closed.png`
- `outputs/phase-11/screenshots/density-toggle-help-open.png`
- `outputs/phase-11/screenshots/density-toggle-segmented.png`
- `outputs/phase-11/phase11-capture-metadata.json`

## Part 3: Known Limits

Runtime `/members` route capture was attempted locally, but the Next dev server did not return routes before timeout in this environment. The saved Phase 11 screenshots use a Playwright DOM/CSS fixture for the implemented `DensityToggle` contract; staging browser verification remains user-gated.

This task intentionally does not introduce a generic Popover/Tooltip primitive because the issue scope is the existing density HelpHint only. No API, D1 schema, authentication, or URL query contract changes are included.
