# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 |
| 名称 | 設計 |
| タスクID | TASK-W3-TAILWIND-V4-SETUP-001 |
| 状態 | implemented-local |
| 実装区分 | 実装仕様書 |

## 目的

Phase 5（実装）が判断不要で実行できるレベルまで、**変更対象ファイル / 関数・型シグネチャ / @theme bridge map / 削除対象の取り扱い** を確定する。

## 変更対象ファイル一覧（CONST_005 必須項目）

| path | 種別 | 概要 | 行数目安 |
| --- | --- | --- | --- |
| `apps/web/package.json` | M | `tailwindcss@~4.0.0` / `@tailwindcss/postcss@~4.0.0` / `class-variance-authority@^0.7.0` / `tailwind-merge@^3.5.0` / `clsx@^2.1.0` を `devDependencies` に追加 | +5 |
| `apps/web/postcss.config.mjs` | C | `@tailwindcss/postcss` 単一 plugin 構成 | 8 |
| `apps/web/src/styles/tokens.css` | C | 09b 正本の 60+ tokens を `:root` / `[data-theme="warm"]` / `[data-theme="cool"]` / `@supports not` で定義 | 130-180 |
| `apps/web/src/styles/globals.css` | C | `@import "tailwindcss"` → `@import "./tokens.css"` → `@theme inline { ... }` → `@layer base { ... }` | 80-110 |
| `apps/web/tailwind.config.ts` | C | v4 minimal config（`content` glob のみ） | 12 |
| `apps/web/app/layout.tsx` | M | `import "./styles.css"` → `import "@/styles/globals.css"` | ±2 |
| `apps/web/app/styles.css` | D | 全削除（layout reset 系のみ globals.css `@layer base` に移植） | -400 |
| `apps/web/tsconfig.json` | M | `paths: { "@/*": ["./src/*"] }` を追加（既存なら noop） | +3 |
| `apps/web/src/__tests__/tokens.test.ts` | C | token 名 assert + fallback assert（Phase 4 で記述） | 30-50 |
| `apps/web/wrangler.toml` | R | 変更なし（不変条件確認のみ） | 0 |
| `apps/api/**` | R | 変更なし（不変条件確認のみ） | 0 |
| `pnpm-lock.yaml` | M | 依存追加に伴う自動更新 | 自動 |

## 関数・型・モジュールシグネチャ（CONST_005 必須項目）

### S2-1. `apps/web/postcss.config.mjs`

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

- export shape: `{ plugins: Record<string, object> }`
- v4 では `autoprefixer` 不要（`@tailwindcss/postcss` が内包）

### S2-2. `apps/web/tailwind.config.ts`

```ts
import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
};
export default config;
```

- export type: `Config`（`tailwindcss` 既定）
- `theme` / `plugins` / `safelist` は **空** のまま（CSS-first）

### S2-3. `apps/web/src/styles/tokens.css`

セクション構造（`:root` 内の論理ブロック）:

1. Surface / Text / Border（9 tokens）
2. Accent（3 tokens）
3. Status（8 tokens: ok/warn/danger/info × base/-soft）
4. Zone（5 tokens: a..e）
5. Radius（5 tokens: sm/md/lg/xl/2xl）
6. Shadow（4 tokens: xs/sm/md/lg）
7. Typography（font-family 5 + font-size 8）
8. Spacing（10 tokens）
9. Motion（duration 3 + easing 4）

セレクタ階層:
- `:root { ... }` — stone（MVP 既定）
- `[data-theme="warm"] { ... }` — warm theme override（surface / text / border / accent）
- `[data-theme="cool"] { ... }` — cool theme override（surface / text / border / accent）
- `@supports not (color: oklch(0 0 0)) { :root { ... } }` — sRGB 近似 HEX fallback

### S2-4. `apps/web/src/styles/globals.css`

ファイル先頭から順序固定:

```css
@import "tailwindcss";
@import "./tokens.css";

@theme inline {
  /* color bridge */
  --color-surface: var(--ubm-color-surface-bg);
  --color-surface-2: var(--ubm-color-surface-bg-2);
  --color-panel: var(--ubm-color-surface-panel);
  --color-panel-2: var(--ubm-color-surface-panel-2);
  --color-text: var(--ubm-color-text-primary);
  --color-text-2: var(--ubm-color-text-secondary);
  --color-text-3: var(--ubm-color-text-muted);
  --color-border: var(--ubm-color-border-default);
  --color-border-2: var(--ubm-color-border-strong);
  --color-accent: var(--ubm-color-accent);
  --color-accent-soft: var(--ubm-color-accent-soft);
  --color-accent-ink: var(--ubm-color-accent-ink);
  --color-ok: var(--ubm-color-ok);
  --color-ok-soft: var(--ubm-color-ok-soft);
  --color-warn: var(--ubm-color-warn);
  --color-warn-soft: var(--ubm-color-warn-soft);
  --color-danger: var(--ubm-color-danger);
  --color-danger-soft: var(--ubm-color-danger-soft);
  --color-info: var(--ubm-color-info);
  --color-info-soft: var(--ubm-color-info-soft);
  --color-zone-a: var(--ubm-color-zone-a);
  --color-zone-b: var(--ubm-color-zone-b);
  --color-zone-c: var(--ubm-color-zone-c);
  --color-zone-d: var(--ubm-color-zone-d);
  --color-zone-e: var(--ubm-color-zone-e);

  /* radius bridge */
  --radius-sm: var(--ubm-radius-sm);
  --radius-md: var(--ubm-radius-md);
  --radius-lg: var(--ubm-radius-lg);
  --radius-xl: var(--ubm-radius-xl);
  --radius-2xl: var(--ubm-radius-2xl);

  /* shadow bridge */
  --shadow-sm: var(--ubm-shadow-sm);
  --shadow-md: var(--ubm-shadow-md);
  --shadow-lg: var(--ubm-shadow-lg);

  /* font bridge */
  --font-sans: var(--ubm-font-body);
  --font-mono: var(--ubm-font-mono);
}

@layer base {
  *, *::before, *::after { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    background: var(--ubm-color-surface-bg);
    color: var(--ubm-color-text-primary);
    font-family: var(--ubm-font-body);
    font-size: var(--ubm-text-base);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  a { color: var(--ubm-color-accent); text-decoration: none; }
  a:hover { text-decoration: underline; }
  :focus-visible { outline: 2px solid var(--ubm-color-accent); outline-offset: 2px; }
  button { font: inherit; cursor: pointer; }
  input, textarea, select { font: inherit; color: inherit; }
}
```

### S2-5. `apps/web/app/layout.tsx` 差分

```diff
- import "./styles.css";
+ import "@/styles/globals.css";
```

### S2-6. `apps/web/tsconfig.json` 差分

```diff
  "compilerOptions": {
+   "baseUrl": ".",
+   "paths": { "@/*": ["./src/*"] },
    ...
  }
```

既に `paths` が存在する場合は `"@/*"` 行のみ追加。

## @theme bridge map（入力 → 出力 utility）

| 入力 token (`--ubm-*`) | bridge → Tailwind 名 | 生成 utility 例 |
| --- | --- | --- |
| `--ubm-color-surface-bg` | `--color-surface` | `bg-surface` |
| `--ubm-color-surface-panel` | `--color-panel` | `bg-panel` |
| `--ubm-color-text-primary` | `--color-text` | `text-text` |
| `--ubm-color-text-secondary` | `--color-text-2` | `text-text-2` |
| `--ubm-color-border-default` | `--color-border` | `border-border` |
| `--ubm-color-accent` | `--color-accent` | `bg-accent` / `text-accent` / `border-accent` |
| `--ubm-color-accent-soft` | `--color-accent-soft` | `bg-accent-soft` |
| `--ubm-color-accent-ink` | `--color-accent-ink` | `text-accent-ink` |
| `--ubm-color-ok` 等 status 8 | `--color-ok` 等 | `text-ok` / `bg-ok-soft` |
| `--ubm-color-zone-a..e` | `--color-zone-a..e` | `bg-zone-a` / `text-zone-e` |
| `--ubm-radius-sm..2xl` | `--radius-sm..2xl` | `rounded-sm` / `rounded-2xl` |
| `--ubm-shadow-sm/md/lg` | `--shadow-sm/md/lg` | `shadow-sm` / `shadow-md` |
| `--ubm-font-sans/mono` | `--font-sans/mono` | `font-sans` / `font-mono` |

> duration / easing / spacing / font-size は v4 では `@theme` 既定の名前空間に揃えるか、`var(--ubm-*)` で arbitrary value 経由参照とする（`duration-(--ubm-dur-base)` 等）。

## 入力・出力・副作用（CONST_005 必須項目）

### 入力
- `apps/web/app/styles.css`（撤去対象、layout reset のみ移植）
- task-08 が定義した OKLch palette 値
- 既存 `apps/web/package.json` / `tsconfig.json` / `app/layout.tsx`

### 出力
- 新設: `tokens.css` / `globals.css` / `postcss.config.mjs` / `tailwind.config.ts` / `__tests__/tokens.test.ts`
- 修正: `package.json` / `app/layout.tsx` / `tsconfig.json` / `pnpm-lock.yaml`
- 削除: `app/styles.css`

### 副作用
- `pnpm-lock.yaml` の更新（依存追加）
- 既存ページが `app/styles.css` の prototype class（`.btn-primary` 等）に依存している場合、本 PR 単独では UI が一時的に崩れる可能性 → task-10 と直列実行で解消
- `tsconfig.json` の `paths` 追加で既存 import 解決に影響しないことを `pnpm typecheck` で確認

## 削除対象（`app/styles.css`）の取り扱い設計

1. ファイル全体を `git diff` で内容確認し、3 種に分類:
   - (a) layout reset / native element の最小スタイル → `globals.css @layer base` へ移植
   - (b) prototype 由来 class スタイル（`.btn-primary` 等） → **削除**（task-10 で primitive 化）
   - (c) ページ固有のレガシースタイル → 個別ページから参照されているか grep で確認、未使用なら削除、使用中なら task-10 で primitive 化を予約
2. 削除前に `grep -REn "from\s+['\"]\.\/styles\.css['\"]\|import\s+['\"]\.\/styles\.css['\"]" apps/web` で参照箇所を全列挙し、`app/layout.tsx` 以外で参照されていないことを確認
3. 削除後、`pnpm --filter @ubm-hyogo/web typecheck` で 0 error を確認

## 完了条件

- [ ] §「変更対象ファイル一覧」が確定し `outputs/phase-2/changed-files.md` に保存
- [ ] §「関数・型・モジュールシグネチャ」が `outputs/phase-2/signatures.md` に保存
- [ ] @theme bridge map が `outputs/phase-2/theme-bridge-map.md` に保存
- [ ] 削除対象取り扱い設計が `outputs/phase-2/styles-css-removal-plan.md` に保存
- [ ] 入出力・副作用が本 phase に明記されている

## 成果物

- `outputs/phase-2/main.md`
- `outputs/phase-2/changed-files.md`
- `outputs/phase-2/signatures.md`
- `outputs/phase-2/theme-bridge-map.md`
- `outputs/phase-2/styles-css-removal-plan.md`
