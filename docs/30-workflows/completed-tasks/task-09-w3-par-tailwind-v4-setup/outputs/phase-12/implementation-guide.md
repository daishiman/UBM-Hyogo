# Implementation Guide — task-09 Tailwind v4 setup

## Part 1: 中学生レベル

学校の掲示物を作るとき、クラスごとに好きな色ペンを使うと見た目がばらばらになります。先に「見出しはこの色」「注意はこの色」「紙の角はこの丸さ」と決め、みんなが同じ道具箱から道具を取れるようにすると、早くきれいに作れます。

このタスクでは、Web 画面で使う色・丸さ・影・文字の大きさを同じ道具箱に入れます。開発者は色番号を毎回書かず、`bg-accent` のような短い名前で使えるようになります。古いブラウザ向けの予備色も、決められた場所だけに置きます。

| 用語 | 日常語への言い換え |
| --- | --- |
| Tailwind | 見た目の道具を作る仕組み |
| token | 道具箱の中の名前付き道具 |
| OKLch | 色の決め方 |
| fallback | 予備 |
| bridge | 別の名前で使えるようにする橋 |

## Part 2: 技術者レベル

### 概要

`apps/web` に Tailwind v4 CSS-first pipeline を新設し、09b 正本（`docs/00-getting-started-manual/specs/09b-design-tokens.md` §9 JSON）の OKLch tokens を `--ubm-*` prefix で `apps/web/src/styles/tokens.css` に転記、`globals.css` の `@theme inline` で Tailwind namespace（`--color-* / --radius-* / --shadow-* / --font-*`）に bridge した。`apps/web/app/styles.css`（prototype 写経物・400 行）は撤去し、layout reset は `@layer base` に移植した。

### 変更ファイル

| 種別 | path |
| --- | --- |
| C | `apps/web/postcss.config.mjs` |
| C | `apps/web/tailwind.config.ts` |
| C | `apps/web/src/styles/tokens.css`（140 行 / 64 base tokens + warm/cool override + dark placeholder + sRGB fallback） |
| C | `apps/web/src/styles/globals.css`（@source 明示 / @theme inline bridge + typography bridge + @layer base） |
| C | `apps/web/src/styles/legacy-public.css`（既存 `data-component` 公開UIの互換レイヤ。色・影・間隔は `--ubm-*` 経由） |
| C | `apps/web/src/__tests__/tokens.test.ts`（9 tests） |
| C | `apps/web/src/__tests__/build-output.test.ts`（generated CSS に utility selector + token bridge が出ることを検証） |
| C | `apps/web/src/__tests__/__fixtures__/utility-probe.tsx`（Tailwind v4 on-demand utility 生成 probe） |
| M | `apps/web/app/layout.tsx`（import を `@/styles/globals.css` へ切替） |
| M | `apps/web/tsconfig.json`（`paths` に `@/*` と workspace pkgs を明示） |
| M | `apps/web/package.json`（devDeps: `tailwindcss@~4.0.0` / `@tailwindcss/postcss@~4.0.0` / `class-variance-authority@^0.7.0` / `clsx@^2.1.0` / `tailwind-merge@^3.5.0`） |
| D | `apps/web/app/styles.css` |
| M | `pnpm-lock.yaml`（auto） |
| C | `docs/30-workflows/task-09-w3-par-tailwind-v4-setup/outputs/phase-{1..11}/main.md` |

### 設定シグネチャ

```js
// apps/web/postcss.config.mjs
const config = {
  plugins: { "@tailwindcss/postcss": {} },
};
export default config;
```

```ts
// apps/web/tailwind.config.ts
import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
};
export default config;
```

### @theme bridge map

`apps/web/src/styles/globals.css` で以下を bridge:

- `--color-{surface,surface-2,panel,panel-2,text,text-2,text-3,border,border-2,accent,accent-soft,accent-ink,ok,ok-soft,warn,warn-soft,danger,danger-soft,info,info-soft,zone-a..e}` ← `var(--ubm-color-*)`
- `--radius-{sm,md,lg,xl,2xl}` ← `var(--ubm-radius-*)`
- `--shadow-{xs,sm,md,lg}` ← `var(--ubm-shadow-*)`
- `--font-sans` ← `var(--ubm-font-body)` / `--font-mono` ← `var(--ubm-font-mono)`
- `--text-{xs,sm,base,md,lg,xl,2xl,3xl}` ← `var(--ubm-text-*)`

Tailwind v4 の CSS-first content scan は `@source "../../app"`, `@source "../components"`, `@source "../lib"`, `@source "../__tests__/__fixtures__"` で明示する。

### 受入条件結果（AC-1〜AC-12）

すべて充足。詳細は `outputs/phase-10/main.md`。

| AC | 結果 |
| --- | --- |
| AC-1 pnpm install exit 0 | ✅ |
| AC-2 postcss は `@tailwindcss/postcss` 単独 | ✅ |
| AC-3 64 tokens 定義 | ✅ |
| AC-4 @theme inline bridge | ✅（generated.css に `--color-accent:var(--ubm-color-accent)` 等出力） |
| AC-5 OKLch fallback | ✅ |
| AC-6 styles.css 削除 / layout.tsx 切替 | ✅ |
| AC-7 typecheck 0 error | ✅ |
| AC-8 build:cloudflare exit 0 | ✅（`.open-next/worker.js` 3647 bytes） |
| AC-9 preview / が 200 | ✅（`GET / 200 OK (2291ms)`） |
| AC-10 tokens.test.ts pass | ✅（8/8） |
| AC-11 HEX 直書き 0 件 | ✅ |
| AC-12 apps/api 影響なし | ✅ |

### 既知の影響と後続タスクへの引き継ぎ

- `apps/web` の既存ページが `app/styles.css` の prototype `[data-component="..."]` selector に依存していた箇所は、`src/styles/legacy-public.css` で token-backed compatibility layer として維持する。primitive 化は task-10 が引き継ぐ。
- 既存の Tailwind default palette（`text-zinc-*` 等）は v4 のデフォルト namespace で残存するため、識別 UI は機能を維持する。
- `bg-accent` 等の utility は Tailwind v4 の on-demand 生成対象であるため、`utility-probe.tsx` を content scan に含めて `.open-next/assets/*.css` に class selector と `var(--ubm-*)` bridge が出ることを検証済み。

### 実行コマンド一覧

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
mise exec -- pnpm vitest run apps/web/src/__tests__/tokens.test.ts
mise exec -- pnpm vitest run apps/web/src/__tests__/build-output.test.ts
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare
mise exec -- pnpm exec opennextjs-cloudflare preview --port 8788  # その後 curl http://localhost:8788/
bash docs/30-workflows/task-09-w3-par-tailwind-v4-setup/outputs/phase-4/hex-grep-gate.sh apps/web/src
```

### スクリーンショット

`VISUAL_ON_EXECUTION` として preview 200、generated CSS grep、Playwright screenshot を採取済み。

- `outputs/phase-11/screenshots/01-top-light.png`
- `outputs/phase-11/evidence/preview-200.log`
- `outputs/phase-11/evidence/generated-css-with-bridge.log`

### 未タスク候補（再判定）

- `TASK-W3-DARK-MODE-VALUE-DETERMINATION`：dark mode の OKLch 配色確定。本タスクでは placeholder 空ブロックのみ。design 合意未済のため今回は完了不可、バックログに残す。
- `TASK-W3-VERIFY-DESIGN-TOKENS-CI-GATE`：HEX grep gate を CI 化。task-18 のスコープ。本タスクでは shell script を `outputs/phase-4/hex-grep-gate.sh` に先行実装。
