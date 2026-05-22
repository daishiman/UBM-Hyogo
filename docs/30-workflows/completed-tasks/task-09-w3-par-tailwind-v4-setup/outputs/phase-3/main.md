# Phase 3: 設計レビュー

## レビュー観点と結果
- **v4 互換性**: `@import "tailwindcss"` + `@theme inline` + `@layer base` は v4 公式パターン。OK。
- **Workers 互換性**: `@tailwindcss/postcss` は標準 PostCSS plugin で `@opennextjs/cloudflare` の build pipeline と互換。OK。
- **token prefix 衝突**: `--ubm-*` prefix で隔離、Tailwind 既定 `--color-*` namespace は @theme inline で bridge のみ。衝突なし。
- **fallback 戦略**: `@supports not (color: oklch(0% 0 0))` で OKLch 非対応ブラウザ向けに sRGB 近似 HEX を 09b §3.5 の値で宣言。HEX grep gate は tokens.css を例外扱い。
- **theme cascade**: `@theme inline` キーワード使用により `[data-theme="warm"]` / `[data-theme="cool"]` の override が utility 経由で効く。OK。
- **既存コードへの影響**: 既存 `text-zinc-*` / `text-blue-*` 等の Tailwind default palette は v4 既定で残るため動作継続。OK。

## 不採用案
- v4 `@plugin` 経由の forms / typography 導入: 本タスク不要、保留（未タスク候補なし）。
- JS-config `theme.extend`: v4 では非推奨、CSS-first を採用。

## 結論
phase-2 設計を承認。Phase 4 へ進む。
