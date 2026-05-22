# Phase 5: 実装（GREEN）

## 実装ファイル
| path | 状態 |
| --- | --- |
| `apps/web/src/styles/tokens.css` | NEW (140 lines) — 09b §9 正本に基づく 64 tokens + warm/cool override + dark placeholder + sRGB fallback |
| `apps/web/src/styles/globals.css` | NEW (96 lines) — `@import "tailwindcss"` + `@import "./tokens.css"` + `@theme inline` bridge + `@layer base` |
| `apps/web/postcss.config.mjs` | NEW — `@tailwindcss/postcss` 単独 |
| `apps/web/tailwind.config.ts` | NEW — content glob のみ |
| `apps/web/app/layout.tsx` | MODIFIED — import を `@/styles/globals.css` へ切替 |
| `apps/web/app/styles.css` | DELETED |
| `apps/web/tsconfig.json` | MODIFIED — `paths: { "@/*": ["./src/*"], ...workspace pkgs }` |
| `apps/web/package.json` | MODIFIED — devDeps に tailwindcss / @tailwindcss/postcss / class-variance-authority / clsx / tailwind-merge 追加 |
| `pnpm-lock.yaml` | MODIFIED — auto |

## 検証結果
- `pnpm install` → exit 0（AC-1）
- `pnpm --filter @ubm-hyogo/web typecheck` → 0 error（AC-7）
- `pnpm --filter @ubm-hyogo/web build:cloudflare` → exit 0、`.open-next/worker.js` 生成（AC-8）
- 生成 CSS に `var(--ubm-color-accent)` / theme override / OKLch fallback 全部出力（AC-4 / AC-5）
