# Phase 11: 手動テスト / Visual evidence

## 1. ビルド成功
- `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` → exit 0
- `apps/web/.open-next/worker.js` 生成済み（3647 bytes）

## 2. Preview server 200 確認（AC-9）
```
$ mise exec -- pnpm exec opennextjs-cloudflare preview --port 8788 &
$ curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8788/
200
```
log:
```
[wrangler:info] Ready on http://localhost:8788
[wrangler:info] GET / 200 OK (2291ms)
```

## 3. 生成 CSS 確認（AC-4）
`apps/web/.open-next/assets/_next/static/chunks/0bi0yl~hqwl.t.css`（コピー: `outputs/phase-11/generated.css`）

確認項目:
- `--color-accent: var(--ubm-color-accent)` が `@layer theme` 内に存在 ✅
- `--color-surface: var(--ubm-color-surface-bg)` 存在 ✅
- `--color-ok / --color-info / --color-zone-a` が `var(--ubm-*)` で bridge ✅
- `--radius-md: var(--ubm-radius-md)` 存在 ✅
- `--shadow-md: var(--ubm-shadow-md)` 存在 ✅
- `--font-sans: var(--ubm-font-body)` 存在 ✅
- `:root { --ubm-color-* / --ubm-radius-* / --ubm-shadow-* / --ubm-font-* / --ubm-space-* / --ubm-dur-* / --ubm-ease-* }` 定義済み ✅
- `[data-theme=warm]` / `[data-theme=cool]` override 出力 ✅
- `@supports not (color: oklch(0% 0 0))` fallback ブロック出力 ✅
- `@layer base` で html/body の `var(--ubm-color-surface-bg)` 等が出力 ✅

> 注: Tailwind v4 は utility を on-demand 生成するため、`apps/web/src/__tests__/__fixtures__/utility-probe.tsx` で `bg-accent` / `text-info` / `bg-zone-a` を content scan に乗せ、生成 CSS に selector と `var(--ubm-*)` bridge が同時に出ることを検証する。

## 4. HEX 直書き 0 件（AC-11）
```
$ bash docs/30-workflows/task-09-w3-par-tailwind-v4-setup/outputs/phase-4/hex-grep-gate.sh apps/web/src
HEX 直書き 0 件（OK）
```

## 5. typecheck（AC-7）
```
$ mise exec -- pnpm --filter @ubm-hyogo/web typecheck
> tsc -p tsconfig.json --noEmit
(0 error)
```

## 6. tokens.test.ts pass（AC-10）
```
$ mise exec -- pnpm vitest run apps/web/src/__tests__/tokens.test.ts
Test Files  1 passed (1)
     Tests  8 passed (8)
```

## 7. apps/api 影響なし（AC-12）
- 変更ファイル一覧（git status）に `apps/api/**` なし
