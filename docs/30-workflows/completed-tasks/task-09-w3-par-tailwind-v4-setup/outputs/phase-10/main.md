# Phase 10: 最終レビュー（AC acceptance check）

| AC | 概要 | 結果 | 証跡 |
| --- | --- | --- | --- |
| AC-1 | tailwindcss / @tailwindcss/postcss / cva / clsx / tw-merge を package.json に追加し `pnpm install` exit 0 | ✅ | phase-9/main.md |
| AC-2 | postcss.config.mjs が `@tailwindcss/postcss` 単独 | ✅ | apps/web/postcss.config.mjs / tokens.test.ts TC-RED-07 |
| AC-3 | tokens.css に 64 tokens 定義 | ✅ | tokens.test.ts TC-RED-01 / phase-7/main.md |
| AC-4 | globals.css `@theme inline` で utility が var(--ubm-*) 経由に bridge | ✅ | phase-11/generated.css L1（`--color-accent:var(--ubm-color-accent)` 等） |
| AC-5 | OKLch fallback `@supports not` 宣言 | ✅ | tokens.css L130-145 / generated.css 末尾 |
| AC-6 | app/styles.css 削除、layout.tsx が `@/styles/globals.css` import | ✅ | git status: `D apps/web/app/styles.css` / layout.tsx diff |
| AC-7 | typecheck 0 error | ✅ | phase-9/main.md |
| AC-8 | build:cloudflare exit 0 / `.open-next/worker.js` 生成 | ✅ | phase-9/main.md |
| AC-9 | preview:cloudflare で `/` 200 | ✅ | phase-11/main.md §2（GET / 200 OK） |
| AC-10 | tokens.test.ts pass | ✅ | 8 passed |
| AC-11 | apps/web/src の HEX 直書き 0 件 | ✅ | hex-grep-gate.sh 出力 "HEX 直書き 0 件（OK）" |
| AC-12 | apps/api 影響なし | ✅ | `git status apps/api` 出力なし |

**結論: AC-1〜AC-12 全て充足。Phase 12 へ進む。**
