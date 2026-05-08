# Phase 2: 設計

## 変更対象ファイル
| path | 種別 |
| --- | --- |
| `apps/web/package.json` | M (devDeps 追加) |
| `apps/web/postcss.config.mjs` | C |
| `apps/web/src/styles/tokens.css` | C |
| `apps/web/src/styles/globals.css` | C |
| `apps/web/tailwind.config.ts` | C |
| `apps/web/app/layout.tsx` | M |
| `apps/web/app/styles.css` | D |
| `apps/web/tsconfig.json` | M (paths) |
| `apps/web/src/__tests__/tokens.test.ts` | C |
| `pnpm-lock.yaml` | M (auto) |

## @theme bridge map
phase-2.md §S2-4 を正本とする。代表的な bridge:
- `--color-surface ← var(--ubm-color-surface-bg)`
- `--color-accent ← var(--ubm-color-accent)`
- `--color-{ok|warn|danger|info}[-soft] ← var(--ubm-color-...)`
- `--color-zone-{a..e} ← var(--ubm-color-zone-...)`
- `--radius-{sm..2xl} ← var(--ubm-radius-...)`
- `--shadow-{xs..lg} ← var(--ubm-shadow-...)`
- `--font-sans ← var(--ubm-font-body)` / `--font-mono ← var(--ubm-font-mono)`

## styles.css 撤去計画
- `apps/web/app/styles.css` は prototype 写経物。本タスクで削除。
- 参照箇所は `apps/web/app/layout.tsx` のみ → `@/styles/globals.css` に切替。
- layout reset（`*,html,body` 等）は `globals.css @layer base` に移植。
- prototype class（`[data-component="..."]`）は `legacy-public.css` で token-backed compatibility layer として維持し、task-10 の primitive 化で段階的に再構成。

## 副作用
- `pnpm-lock.yaml` 更新
- 既存 `[data-component="..."]` selector を使う画面は `legacy-public.css` で維持し、task-10 で primitive 化へ移行
- `tsconfig.json` paths 追加 → 既存 import 解決に影響しないことを typecheck で確認
