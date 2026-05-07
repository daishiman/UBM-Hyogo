# task-09-tailwind-v4-setup

> Phase: 04-design-system / Task #09
> 改訂日: 2026-05-07
> 出典: phase-1.md §3 / phase-2.md DAG / phase-3.md §4.9 / styles.css L1-L80（OKLch palette）

---

## 0. 自己完結コンテキスト

このタスクは下流の task-10 / task-11..17 が再度上流仕様を読まずに着手できるよう、**self-contained** な前提・契約・シグネチャを本セクションに集約する。必読は `outputs/phase-1..3`、`CLAUDE.md`、直接の上流である `03-spec-source/task-08-design-tokens-doc.md`。

### 0.1 上位ゴール

UBM 兵庫支部会メンバーサイトの UI を、`claude-design-prototype` の OKLch ベース design tokens に整合させた **Tailwind v4 build pipeline** を `apps/web` に確立する。task-08 の正本値（`--ubm-*` prefix、60+ tokens、3 テーマ）を `tokens.css` + `globals.css @theme inline` で Tailwind utility に bridge し、`bg-accent` / `text-info` / `border-warn` / `bg-zone-a..e` 等が **無設定で使える** 状態を実現する。Cloudflare Workers (`@opennextjs/cloudflare`) ビルド互換性を DoD で保証する。

### 0.2 DAG 座標

- **依存元（上流）**: `task-08-design-tokens-doc`（OKLch tokens 仕様正本 = `specs/09b-design-tokens.md`）
- **依存先（下流）**: `task-10-ui-primitives`（直列・必須）、`task-11..17`（screens 全 7 タスク）、`task-18-verify-design-tokens`（CI gate）
- **直列性**: task-10 は本タスク完了後にのみ着手可。`globals.css @theme inline` ブロックの確定が前提。
- **並列不可理由**: `apps/web/app/styles.css` 撤去 → primitive 経由スタイルへの移行が **同一 PR 内で連続して走る**ため。

### 0.3 触れるファイル群

- C: `apps/web/postcss.config.mjs`、`apps/web/tailwind.config.ts`、`apps/web/src/styles/tokens.css`、`apps/web/src/styles/globals.css`
- M: `apps/web/package.json`、`apps/web/app/layout.tsx`、`apps/web/tsconfig.json`
- D: `apps/web/app/styles.css`（400 行・prototype 写経物を撤去）
- R（不変）: `apps/web/wrangler.toml`、`apps/api/**`

### 0.4 既存 API（不変）

- `apps/api`（Hono on Cloudflare Workers）には一切影響を与えない。Tailwind は `apps/web` 内で完結。
- D1 binding 経路（`apps/api` のみが D1 に触れる）は不変。
- Auth.js / Google OAuth / Magic Link の認証 API は不変。

### 0.5 不変条件

1. token 値は task-08（`specs/09b-design-tokens.md`）を **唯一の正本**とする。本タスクは値を「決めない」「変えない」、**写すだけ**。
2. `--ubm-*` prefix を厳守。Tailwind 既定変数名（`--color-*`）への直接定義は禁止し、必ず `var(--ubm-*)` 経由で bridge する。
3. HEX 直書き（`#xxxxxx`、`bg-[#...]`、`text-[#...]`）を `apps/web/src/` 配下に **0 件** 維持（task-18 CI gate）。
4. Cloudflare Workers ビルド (`opennextjs-cloudflare build`) で PostCSS pipeline が exit 0 になること。
5. dark mode は placeholder のみ（値未定で OK）。MVP は light（stone）のみ提供。
6. `apps/web/app/styles.css` の prototype class（`.btn-primary` / `.chip` 等）への global 依存を **本タスクで断絶**し、後続 task-10 の primitive 化に引き渡す。
7. `tailwind.config.ts` は `content` glob のみ。theme は `@theme` に集約（v4 CSS-first 原則）。

### 0.6 上流から受け取るシグネチャ（task-08 → task-09）

task-08 が確定する CSS 変数群（`--ubm-*` prefix、計 60+ 個）。本タスクは `tokens.css` で **そのまま定義**し、`globals.css` の `@theme inline` で Tailwind utility に bridge する。

```css
/* color: surface (4) */
--ubm-color-surface-bg, --ubm-color-surface-bg-2, --ubm-color-surface-panel, --ubm-color-surface-panel-2
/* color: text (3) */
--ubm-color-text-primary, --ubm-color-text-secondary, --ubm-color-text-muted
/* color: border (2) */
--ubm-color-border-default, --ubm-color-border-strong
/* color: accent (3) */
--ubm-color-accent, --ubm-color-accent-soft, --ubm-color-accent-ink
/* color: status (8 = ok/warn/danger/info × base/-soft) */
--ubm-color-ok, --ubm-color-ok-soft, --ubm-color-warn, --ubm-color-warn-soft,
--ubm-color-danger, --ubm-color-danger-soft, --ubm-color-info, --ubm-color-info-soft
/* color: zone (5) */
--ubm-color-zone-a, --ubm-color-zone-b, --ubm-color-zone-c, --ubm-color-zone-d, --ubm-color-zone-e
/* radius (5) */
--ubm-radius-sm, --ubm-radius-md, --ubm-radius-lg, --ubm-radius-xl, --ubm-radius-2xl
/* shadow (4) */
--ubm-shadow-xs, --ubm-shadow-sm, --ubm-shadow-md, --ubm-shadow-lg
/* font-family (5) */
--ubm-font-jp, --ubm-font-en, --ubm-font-serif, --ubm-font-body, --ubm-font-mono
/* font-size (8) */
--ubm-text-xs, --ubm-text-sm, --ubm-text-base, --ubm-text-md, --ubm-text-lg, --ubm-text-xl, --ubm-text-2xl, --ubm-text-3xl
/* spacing (10) */
--ubm-space-0..1..2..3..4..6..8..12..16..24
/* duration (3) */
--ubm-dur-fast, --ubm-dur-base, --ubm-dur-slow
/* easing (4) */
--ubm-ease-standard, --ubm-ease-emphasized, --ubm-ease-decelerate, --ubm-ease-accelerate
```

bridge 規則: `@theme inline { --color-accent: var(--ubm-color-accent); ... }` の形で `--color-*` / `--radius-*` / `--shadow-*` / `--font-*` 名前空間に流し込み、Tailwind が `bg-accent` / `rounded-md` / `shadow-md` / `font-sans` 等の utility を自動生成する。

### 0.7 下流へ渡すシグネチャ（task-09 → task-10, 11..17）

下流 task は本タスクが確定した以下の **3 つの契約**にのみ依存する。

#### 0.7.1 `apps/web/tailwind.config.ts` export 形式

```ts
import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
};
export default config;
```

`theme` / `plugins` / `safelist` は空。すべて `@theme` に寄せる v4 CSS-first 構成。

#### 0.7.2 `apps/web/src/styles/globals.css` の `@theme` ブロック構造

```
@import "tailwindcss";
@import "./tokens.css";
@theme inline { /* --color-* / --radius-* / --shadow-* / --font-* を var(--ubm-*) に bridge */ }
@layer base { /* reset + native element 最低限 */ }
```

下流が利用可能な Tailwind utility 名（OKLch token 直結）:
- 色: `bg-bg` / `bg-panel` / `text-ink` / `text-muted` / `border-line` / `bg-accent` / `text-accent-ink` / `bg-accent-soft` / `text-success` / `bg-success-soft` / `text-warning` / `bg-warning-soft` / `text-danger` / `bg-danger-soft` / `text-info` / `bg-info-soft` / `bg-zone-a..e` / `text-zone-a..e`
- 半径: `rounded-sm` / `rounded-md` / `rounded-lg` / `rounded-xl` / `rounded-pill`
- 影: `shadow-sm` / `shadow-md` / `shadow-lg`
- フォント: `font-sans` / `font-mono`
- 任意値: `duration-(--ubm-motion-base)` / `[transition-duration:var(--ubm-dur-base)]`

#### 0.7.3 Cloudflare Workers ビルド互換確認方法

```bash
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare    # exit 0 / .open-next/worker.js 生成
mise exec -- pnpm --filter @ubm-hyogo/web preview:cloudflare  # / が 200 を返す
```

両者が PR gate 必須。失敗時は v4 stable 最新パッチに pin して再試行する（§9 リスク表）。

### 0.8 用語

| 用語 | 意味 |
|------|------|
| OKLch | 知覚均等な色空間。`oklch(L C H)` で表現。本プロジェクトの正本色空間 |
| `@theme inline` | Tailwind v4 で「tokens を `var()` 参照のまま utility に展開する」モード。`[data-theme]` 切替に追随する |
| design token | UI の最小決定単位（色 / 余白 / 半径 / 影 / typography / motion）。`--ubm-*` prefix で命名 |
| token bridge | `--ubm-*` を `--color-*` / `--radius-*` 等の Tailwind 既定変数名にマッピングする `@theme` 内宣言 |
| sRGB fallback | OKLch 非対応ブラウザ向けの `@supports not (color: oklch(...))` ブロック内の近似 HEX 値 |
| primitive | task-10 で実装する 11 種の最小 UI コンポーネント（Button / Card / Badge 等） |
| stone / warm / cool | task-08 §3.4 で確定した 3 テーマ。MVP は stone のみ。warm / cool は `[data-theme="warm"\|"cool"]` で切替可能な構造を持つ |

---

## 1. ヘッダー

| 項目 | 値 |
|------|-----|
| 実装区分 | Frontend / Build pipeline |
| 想定工数 | 0.75 day（6 hours） |
| 依存タスク | task-08-design-tokens-doc（OKLch tokens 正本） |
| 並列可否 | task-10 は本タスク完了後に着手（globals.css の `@theme` 完成が前提） |
| 担当領域 | `apps/web` のみ（`apps/api` には影響しない） |
| 影響度 | Cloudflare Workers ビルド (`@opennextjs/cloudflare`) と互換である必要あり（高） |
| ロールバック容易度 | 中（package.json + globals.css + postcss.config.mjs を git revert すれば可） |

---

## 2. ゴール / 非ゴール

### 2.1 ゴール

1. `apps/web` に **Tailwind CSS v4.0.x** + `@tailwindcss/postcss` を最小構成で導入する。
2. `apps/web/src/styles/tokens.css` を新設し、task-08 で定義された OKLch tokens を CSS custom properties として一箇所にまとめる。
3. `apps/web/src/styles/globals.css` で `@import "tailwindcss"` と `@theme` ブロックを宣言し、Tailwind の `bg-accent` `text-ok` `border-warn` 等のユーティリティから token を直接参照可能にする。
4. 既存の `apps/web/app/styles.css`（400 行・prototype 写経物）を **撤去**し、必要な scope-specific スタイルだけ `globals.css` または `@layer components` に再分配する。
5. Cloudflare Workers (`opennextjs-cloudflare build`) で PostCSS パイプラインが成功することを確認する。

### 2.2 非ゴール

- Tailwind v3 互換 plugin（`@tailwindcss/forms` / `typography`）の導入（v4 では `@plugin` directive 経由で必要時にのみ追加。MVP では入れない）。
- ダークモードのデザイン確定（token は dark variant の placeholder のみ用意。配色決定は task-08 / 本タスクのスコープ外）。
- prototype の `primitives.jsx` の TS 化（task-10 のスコープ）。
- `apps/api` 側への Tailwind 導入。

---

## 3. 変更対象ファイル表

| path | 種別 | 概要 |
|------|------|------|
| `apps/web/package.json` | M | `tailwindcss@^4.0.0` / `@tailwindcss/postcss@^4.0.0` を `devDependencies` に追加。CVA 系（`class-variance-authority` `tailwind-merge` `clsx`）はここで先行追加可（task-10 で使用）。 |
| `apps/web/postcss.config.mjs` | C | `@tailwindcss/postcss` を plugin として登録（v4 では autoprefixer 不要）。 |
| `apps/web/src/styles/tokens.css` | C | OKLch palette / spacing / radius / shadow / motion tokens を CSS custom properties で定義。`:root` と `[data-theme="dark"]` を分離。 |
| `apps/web/src/styles/globals.css` | C/M | `@import "tailwindcss"` → `@import "./tokens.css"` → `@theme inline { ... }` → `@layer base { ... }` の順で構成。 |
| `apps/web/app/layout.tsx` | M | 旧 `import "./styles.css"` を `import "@/styles/globals.css"` に差し替え（src 配下移行を伴う）。 |
| `apps/web/app/styles.css` | D | 撤去。既存 400 行のうち、prototype 由来の class-based スタイルは廃棄、layout reset 系のみ `globals.css @layer base` に移植。 |
| `apps/web/tailwind.config.ts` | C | v4 では minimal。`content` glob のみ宣言（`./app/**/*.{ts,tsx}` `./src/**/*.{ts,tsx}`）。それ以外の theme 定義はすべて `@theme` に寄せる。 |
| `apps/web/tsconfig.json` | M | `paths` に `"@/*": ["./src/*"]` の alias を追加（既に存在する場合は noop）。 |
| `apps/web/wrangler.toml` | R | 変更なし（PostCSS は build 段階で完結する）。 |

---

## 4. 関数 / 型シグネチャ / 設定実例

### 4.1 `apps/web/postcss.config.mjs`

```js
// apps/web/postcss.config.mjs
// Tailwind v4 では @tailwindcss/postcss 1 つで autoprefixer を内包する
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

### 4.2 `apps/web/tailwind.config.ts`

Tailwind v4 では theme は `@theme` で書くのが第一級。`tailwind.config.ts` は `content` glob 指示のみに絞る。

```ts
// apps/web/tailwind.config.ts
import type { Config } from "tailwindcss";

/**
 * Tailwind v4 minimal config.
 * theme tokens は src/styles/globals.css の @theme block に集約する。
 * v4 では JS-config の theme 拡張は CSS-first に置き換わったため、
 * この config は content scan の起点指示に役割を限定する。
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  // theme / plugins / safelist は @theme と @plugin に寄せるため空のまま
};

export default config;
```

### 4.3 `apps/web/src/styles/tokens.css`

OKLch palette を **唯一の正本** として定義する。task-08 の値を写し取り、`globals.css` の `@theme` から参照する。

```css
/* apps/web/src/styles/tokens.css
 * UBM 兵庫 design tokens (OKLch palette).
 * source: docs/00-getting-started-manual/claude-design-prototype/styles.css L1-L80
 * 仕様: task-08-design-tokens-doc.md
 */
:root {
  /* ---- Brand / Surface ---- */
  --ubm-color-bg: oklch(0.99 0.005 90);
  --ubm-color-panel: oklch(1 0 0);
  --ubm-color-ink: oklch(0.22 0.02 60);
  --ubm-color-muted: oklch(0.55 0.02 60);
  --ubm-color-line: oklch(0.92 0.01 80);

  /* ---- Accent (warm) ---- */
  --ubm-color-accent: oklch(0.58 0.10 55);
  --ubm-color-accent-soft: oklch(0.95 0.03 65);
  --ubm-color-accent-ink: oklch(0.38 0.10 55);

  /* ---- Status ---- */
  --ubm-color-success: oklch(0.55 0.10 155);
  --ubm-color-success-soft: oklch(0.95 0.04 155);
  --ubm-color-warning: oklch(0.62 0.12 75);
  --ubm-color-warning-soft: oklch(0.96 0.05 80);
  --ubm-color-danger: oklch(0.55 0.15 25);
  --ubm-color-danger-soft: oklch(0.95 0.04 30);
  --ubm-color-info: oklch(0.55 0.09 230);
  --ubm-color-info-soft: oklch(0.96 0.025 230);

  /* ---- Zone palette (a..e) ---- */
  --ubm-color-zone-a: oklch(0.62 0.13 25);
  --ubm-color-zone-b: oklch(0.62 0.13 55);
  --ubm-color-zone-c: oklch(0.62 0.13 155);
  --ubm-color-zone-d: oklch(0.62 0.13 230);
  --ubm-color-zone-e: oklch(0.62 0.13 305);

  /* ---- Radius ---- */
  --ubm-radius-sm: 0.25rem;
  --ubm-radius-md: 0.5rem;
  --ubm-radius-lg: 0.75rem;
  --ubm-radius-xl: 1rem;
  --ubm-radius-pill: 9999px;

  /* ---- Spacing scale (rem) ---- */
  --ubm-space-1: 0.25rem;
  --ubm-space-2: 0.5rem;
  --ubm-space-3: 0.75rem;
  --ubm-space-4: 1rem;
  --ubm-space-6: 1.5rem;
  --ubm-space-8: 2rem;
  --ubm-space-12: 3rem;

  /* ---- Shadow ---- */
  --ubm-shadow-sm: 0 1px 2px 0 oklch(0 0 0 / 0.04);
  --ubm-shadow-md: 0 4px 12px -2px oklch(0 0 0 / 0.08);
  --ubm-shadow-lg: 0 16px 48px -8px oklch(0 0 0 / 0.16);

  /* ---- Motion ---- */
  --ubm-motion-fast: 120ms;
  --ubm-motion-base: 200ms;
  --ubm-motion-slow: 320ms;
  --ubm-motion-ease: cubic-bezier(0.2, 0.8, 0.2, 1);

  /* ---- Typography ---- */
  --ubm-font-sans: "Inter", "Hiragino Sans", "Noto Sans JP", system-ui, sans-serif;
  --ubm-font-mono: "JetBrains Mono", ui-monospace, "Menlo", monospace;
  --ubm-text-xs: 0.75rem;
  --ubm-text-sm: 0.875rem;
  --ubm-text-base: 1rem;
  --ubm-text-lg: 1.125rem;
  --ubm-text-xl: 1.25rem;
  --ubm-text-2xl: 1.5rem;
  --ubm-text-3xl: 2rem;
}

/* Dark mode placeholder（実際の値決定は task-08 後続で対応） */
[data-theme="dark"] {
  --ubm-color-bg: oklch(0.16 0.01 250);
  --ubm-color-panel: oklch(0.20 0.01 250);
  --ubm-color-ink: oklch(0.96 0.005 90);
  --ubm-color-muted: oklch(0.70 0.02 80);
  --ubm-color-line: oklch(0.30 0.01 250);
}

/* OKLch fallback (sRGB approximations) for legacy browsers */
@supports not (color: oklch(0 0 0)) {
  :root {
    --ubm-color-accent: #b8693c;
    --ubm-color-accent-soft: #f4ece4;
    --ubm-color-success: #3f8a4a;
    --ubm-color-warning: #c98a1f;
    --ubm-color-danger: #c0432d;
    --ubm-color-info: #3170b8;
  }
}
```

### 4.4 `apps/web/src/styles/globals.css`

```css
/* apps/web/src/styles/globals.css
 * Tailwind v4 entrypoint。
 * 1. Tailwind 本体を import
 * 2. tokens.css で OKLch palette を読み込み
 * 3. @theme inline で Tailwind utility に token を流し込む
 * 4. @layer base で reset / native element の最低限のスタイルを定義
 */
@import "tailwindcss";
@import "./tokens.css";

@theme inline {
  /* ---- Tailwind カラー名と OKLch tokens の bridge ---- */
  --color-bg: var(--ubm-color-bg);
  --color-panel: var(--ubm-color-panel);
  --color-ink: var(--ubm-color-ink);
  --color-muted: var(--ubm-color-muted);
  --color-line: var(--ubm-color-line);

  --color-accent: var(--ubm-color-accent);
  --color-accent-soft: var(--ubm-color-accent-soft);
  --color-accent-ink: var(--ubm-color-accent-ink);

  --color-success: var(--ubm-color-success);
  --color-success-soft: var(--ubm-color-success-soft);
  --color-warning: var(--ubm-color-warning);
  --color-warning-soft: var(--ubm-color-warning-soft);
  --color-danger: var(--ubm-color-danger);
  --color-danger-soft: var(--ubm-color-danger-soft);
  --color-info: var(--ubm-color-info);
  --color-info-soft: var(--ubm-color-info-soft);

  --color-zone-a: var(--ubm-color-zone-a);
  --color-zone-b: var(--ubm-color-zone-b);
  --color-zone-c: var(--ubm-color-zone-c);
  --color-zone-d: var(--ubm-color-zone-d);
  --color-zone-e: var(--ubm-color-zone-e);

  /* ---- Radius ---- */
  --radius-sm: var(--ubm-radius-sm);
  --radius-md: var(--ubm-radius-md);
  --radius-lg: var(--ubm-radius-lg);
  --radius-xl: var(--ubm-radius-xl);
  --radius-pill: var(--ubm-radius-pill);

  /* ---- Shadow ---- */
  --shadow-sm: var(--ubm-shadow-sm);
  --shadow-md: var(--ubm-shadow-md);
  --shadow-lg: var(--ubm-shadow-lg);

  /* ---- Font ---- */
  --font-sans: var(--ubm-font-sans);
  --font-mono: var(--ubm-font-mono);
}

@layer base {
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html,
  body {
    margin: 0;
    padding: 0;
    background: var(--ubm-color-bg);
    color: var(--ubm-color-ink);
    font-family: var(--ubm-font-sans);
    font-size: var(--ubm-text-base);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  a {
    color: var(--ubm-color-accent);
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  :focus-visible {
    outline: 2px solid var(--ubm-color-accent);
    outline-offset: 2px;
  }

  button {
    font: inherit;
    cursor: pointer;
  }

  input,
  textarea,
  select {
    font: inherit;
    color: inherit;
  }
}
```

> **注意**: `@theme inline` は v4.0 仕様で「tokens を `var()` 参照のままユーティリティに展開する」ためのキーワード。これにより `bg-accent` の生成 CSS は `background-color: var(--color-accent)` となり、ランタイムで `--ubm-color-accent` の上書きに追従できる（dark mode 切替が `[data-theme]` 単独で完結）。

### 4.5 `apps/web/app/layout.tsx`（差分）

```tsx
// before
import "./styles.css";

// after
import "@/styles/globals.css";
```

### 4.6 `apps/web/package.json`（差分）

```jsonc
{
  "devDependencies": {
    // 追加
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    // task-10 用に先行（互換性検証は本タスクで併せて実施）
    "class-variance-authority": "^0.7.0",
    "tailwind-merge": "^2.5.0",
    "clsx": "^2.1.0"
  }
}
```

### 4.7 `apps/web/tsconfig.json`（差分）

```jsonc
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 5. 入力・出力・副作用

### 5.1 入力

- `docs/00-getting-started-manual/claude-design-prototype/styles.css`（OKLch palette の出典）
- task-08 の `specs/design-tokens.md`（正本）
- 既存 `apps/web/app/styles.css`（廃棄対象）

### 5.2 出力

- `apps/web/src/styles/tokens.css`（CSS custom properties）
- `apps/web/src/styles/globals.css`（Tailwind v4 entrypoint）
- `apps/web/postcss.config.mjs` / `apps/web/tailwind.config.ts`
- `apps/web/package.json` / `pnpm-lock.yaml` 更新

### 5.3 副作用

- `apps/web/app/styles.css` の **削除**。既存ページが prototype class（例: `.btn-primary` `.chip` 等）を直接参照している場合は **task-10 の primitive 化と同時に解消**する想定（本タスクの DoD には含めない／task-10 の Pre-condition）。
- `tsconfig.json` の `paths` 追加によって、既存 import 解決に影響がないことを `pnpm typecheck` で確認。
- `pnpm-lock.yaml` の更新（依存追加によるもの）。

---

## 6. テスト方針

### 6.1 ビルド検証（必須）

| 種別 | コマンド | 期待 |
|------|---------|------|
| 型 | `pnpm --filter @ubm-hyogo/web typecheck` | 0 errors |
| Next dev build | `pnpm --filter @ubm-hyogo/web dev` を 5 sec 起動 → 1xx route fetch 200 | 200 |
| Cloudflare Workers build | `pnpm --filter @ubm-hyogo/web build:cloudflare` | exit 0 / `.open-next/worker.js` 生成 |
| Workers preview | `pnpm --filter @ubm-hyogo/web preview:cloudflare` を 5 sec 起動 → `/` 200 | 200 |

### 6.2 token 参照テスト（vitest + jsdom）

`apps/web/src/__tests__/tokens.test.ts` を新設し、`globals.css` を `vite-plugin-css-injected-by-js` 互換の生 string で読み込んで token 名の存在を assert する。

```ts
// apps/web/src/__tests__/tokens.test.ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("design tokens", () => {
  const css = readFileSync(
    resolve(__dirname, "../styles/tokens.css"),
    "utf-8",
  );

  it("OKLch palette が全て定義されている", () => {
    const required = [
      "--ubm-color-accent",
      "--ubm-color-success",
      "--ubm-color-warning",
      "--ubm-color-danger",
      "--ubm-color-info",
      "--ubm-color-zone-a",
      "--ubm-color-zone-e",
    ];
    for (const t of required) {
      expect(css).toContain(t);
    }
  });

  it("OKLch fallback (@supports) が宣言されている", () => {
    expect(css).toMatch(/@supports not \(color:\s*oklch/);
  });
});
```

### 6.3 verify-design-tokens script の予兆チェック（task-18 と整合）

```bash
# HEX 直書きが apps/web/src 配下に存在しないことを simple grep で確認（task-18 で正式 script 化）
! grep -REn "#[0-9a-fA-F]{3,8}\b" apps/web/src --include='*.ts' --include='*.tsx' --include='*.css' \
  --exclude-dir=node_modules --exclude-dir=.next || (echo "HEX 直書き検出"; exit 1)
```

---

## 7. ローカル実行コマンド

```bash
# 依存追加
mise exec -- pnpm install

# 型チェック
mise exec -- pnpm --filter @ubm-hyogo/web typecheck

# Next dev（http://localhost:3000）
mise exec -- pnpm --filter @ubm-hyogo/web dev

# unit test
mise exec -- pnpm --filter @ubm-hyogo/web test

# Cloudflare Workers ビルド検証（必須）
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare
mise exec -- pnpm --filter @ubm-hyogo/web preview:cloudflare
```

---

## 8. DoD（Definition of Done）

- [ ] `apps/web/package.json` に `tailwindcss@^4` / `@tailwindcss/postcss@^4` / `class-variance-authority` / `tailwind-merge` / `clsx` が追加され `pnpm install` が成功する
- [ ] `apps/web/postcss.config.mjs` が新設され、`@tailwindcss/postcss` 1 plugin のみで構成されている
- [ ] `apps/web/src/styles/tokens.css` に **§4.3 で列挙した OKLch tokens がすべて定義** されている（grep で全 token 名がヒット）
- [ ] `apps/web/src/styles/globals.css` の `@theme inline` ブロックから OKLch token が参照可能で、`bg-accent` `text-info` `border-success` 等の Tailwind utility が生成される
- [ ] OKLch fallback（`@supports not (color: oklch(...))`）が宣言されている
- [ ] `apps/web/app/styles.css` が削除され、`apps/web/app/layout.tsx` が `@/styles/globals.css` を import している
- [ ] `pnpm --filter @ubm-hyogo/web typecheck` が 0 error
- [ ] `pnpm --filter @ubm-hyogo/web build:cloudflare` が exit 0 で完了し、`.open-next/worker.js` が生成される
- [ ] `pnpm --filter @ubm-hyogo/web preview:cloudflare` で起動した Workers が `/` 200 を返す
- [ ] §6.2 の token 参照テストが pass する
- [ ] `apps/web/src/` 配下に HEX 直書き（`#xxxxxx` / `bg-[#...]`）が **0 件**

---

## 9. リスク / ロールバック

| リスク | 影響 | 緩和策 |
|--------|------|--------|
| Tailwind v4 と `@opennextjs/cloudflare` の PostCSS pipeline 非互換 | build:cloudflare 失敗 | 本タスクで preview まで通すことを DoD 必須化。失敗時は v4 stable 最新パッチへピン |
| OKLch を解釈できない古い Safari 系 | 一部色が透明化 | §4.3 の `@supports not` fallback を維持 |
| `app/styles.css` 撤去で既存ページの prototype class が壊れる | UI 崩れ | task-10 と直列実行（task-10 の primitive 化前にスタイル移行が走ると一時的に崩れる前提）、phase-2 DAG で 09 → 10 を直列依存 |
| Tailwind v4 の `@theme` 仕様変更 | 後追い修正 | v4.0.x で固定、minor 更新は別 PR で扱う |

ロールバック手順:

```bash
git revert <commit-of-task-09>
mise exec -- pnpm install --force
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare
```

---

## 10. 後続タスクへのハンドオフ

- task-10 (`ui-primitives`) は本タスクで作成された `globals.css` の `@theme` 経由で OKLch tokens を Tailwind utility として参照する前提。
- task-11..17（screens 系）は `bg-accent` `text-info` `border-warn` 等の utility を直接書ける。HEX 直書きは task-18 の verify-design-tokens で fail させる（PR gate）。
- token 名の追加・改廃は **必ず task-08 の `specs/design-tokens.md` を更新**してから tokens.css に反映する（一方向同期）。
