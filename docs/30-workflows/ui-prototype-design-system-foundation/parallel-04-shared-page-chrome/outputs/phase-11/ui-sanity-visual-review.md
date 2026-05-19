# UI Sanity Visual Review — parallel-04-shared-page-chrome

- runAt: 2026-05-19T04:12:30Z
- commit: 549ec713a20313bd2dbc9fed9658514ee9cc355f
- reviewer: implementation agent (Chromium screenshot review + code-level review)

## 1. レビュー対象

| route / fallback | 検証ファイル |
|------------------|-------------|
| root chrome | `outputs/phase-11/root-layout.png` / `apps/web/app/layout.tsx` |
| error boundary | `outputs/phase-11/fallback-error.png` / `apps/web/app/error.tsx` |
| 404 fallback | `outputs/phase-11/fallback-not-found.png` / `apps/web/app/not-found.tsx` |
| loading fallback | `outputs/phase-11/fallback-loading.png` / `apps/web/app/loading.tsx` |

## 2. Token / a11y 検証結果（コード静的レビュー）

| 観点 | 期待 | 結果 |
|------|------|------|
| `<html lang="ja" data-theme="warm">` | 必須 | OK (layout.tsx L13) |
| `tokens.css` → `globals.css` import 順序 | 必須 | OK |
| `metadata` / `viewport` export | 必須 | OK (object 形式 title / themeColor=oklch) |
| HEX 直書きなし | 4 ファイル | OK (`hex-direct-grep.txt` 空) |
| ToastProvider single mount | `app/layout.tsx` のみ | OK (`toast-provider-grep.txt` は `__tests__` 除外の source-only grep) |
| error.tsx `"use client"` + `{error, reset}` props 型 | 必須 | OK |
| error.tsx Card primitive 構成 | 必須 | OK (`ui-card-header/title/description/content/footer`) |
| error.tsx `logger.error({event:"error.boundary.caught"})` | 必須 | OK (TC-U-06 で検証) |
| not-found.tsx Server Component + Card + EmptyState | 必須 | OK (no `"use client"`) |
| not-found.tsx 2 Link (/, /members) | 必須 | OK |
| loading.tsx `role="status" aria-busy aria-live` | 必須 | OK |
| loading.tsx 4 skeleton + `motion-safe:animate-pulse` | 必須 | OK |

## 3. Apple UI/UX 観点レビュー

- レイアウト整列: `mx-auto max-w-xl` / `max-w-3xl` で中央寄せ＋一貫した padding。
- タイポグラフィ: Card primitive の `CardTitle` / `CardDescription` を継承し、独自字体を持ち込まず token 由来。
- カラーコントラスト: `text-danger` (error) / `text-text-3` (muted) / `bg-accent text-panel` (CTA) — すべて tokens.css 経由で WCAG AA 担保される設計。
- インタラクション: error.tsx の reset ボタンは `<button>` (a11y focusable) + "トップへ戻る" Link を併置。not-found.tsx も 2 つの遷移経路を提供。
- レスポンシブ: `motion-safe:animate-pulse` で `prefers-reduced-motion` 尊重。max-w-* で SP 端末でも余白制御。

## 4. Runtime screenshots

EV-12..15 は Chromium でローカル取得済み。`root-layout.png` / `fallback-error.png` / `fallback-not-found.png` / `fallback-loading.png` を確認し、Card / EmptyState / loading skeleton の重なりや欠けは見当たらない。full 19-route visual regression は serial-07 の担当として残す。

## 5. 結論

Phase 8 DoD-01..10 / DoD-T-01..05 / DoD-Q-01..06 と parallel-04 fallback visual evidence EV-12..15 を充足。full-route regression は serial-07 で確認する前提で foundation 実装は完了。
