# parallel-04 shared page chrome — Implementation Guide (Phase 12)

- sub-workflow: `ui-prototype-design-system-foundation / parallel-04-shared-page-chrome`
- base branch: `dev`
- commit base: 549ec713a20313bd2dbc9fed9658514ee9cc355f
- visualEvidence: VISUAL (parallel-04 fallback screenshots captured; full-route regression remains serial-07)

## 1. 目的 / Why

`apps/web/app/` の root chrome 4 ファイル (`layout.tsx` / `error.tsx` / `not-found.tsx` / `loading.tsx`) を OKLch design token と Card / EmptyState primitive で再構成し、UI prototype 正本と整合させる。ToastProvider を root layout に単一マウントし、route group 配下に新たな primitive を生やさない。

## 2. 変更ファイル

| ファイル | 種別 | 概要 |
|---------|------|------|
| `apps/web/app/layout.tsx` | edit | `<html lang="ja" data-theme="warm">` / `tokens.css → globals.css` 順序 / `metadata` (object title) / `viewport` (themeColor=oklch) export / body 直下に ToastProvider |
| `apps/web/app/error.tsx` | edit | `"use client"` / `{error: Error & {digest?}, reset}` props / Card primitive (`CardHeader/Title/Description/Content/Footer`) / `logger.error({event:"error.boundary.caught", digest})` を mount 時 1 回 / 再試行ボタン + トップへ戻る Link |
| `apps/web/app/not-found.tsx` | edit | Server Component / Card + EmptyState 構成 / `data-page="not-found"` `data-testid="not-found"` `aria-labelledby` / 2 Link (/, /members) |
| `apps/web/app/loading.tsx` | edit | Server Component / `role="status" aria-busy="true" aria-live="polite"` / Card 内 4 skeleton + `bg-surface-2 motion-safe:animate-pulse` / `sr-only` "読み込み中" |
| `apps/web/app/__tests__/layout.spec.tsx` | add | metadata/viewport export 検証 / `data-theme=warm` / body data-shell=root |
| `apps/web/app/__tests__/error.component.spec.tsx` | edit | TC-U-01..08: dev stack / prod no-stack / digest / reset / logger 1回 / token utility migration |
| `apps/web/app/__tests__/not-found.spec.tsx` | add | data-page / aria-labelledby / Card+EmptyState / 2 link / title・description |
| `apps/web/app/__tests__/loading.spec.tsx` | add | role/aria-busy/aria-live / sr-only / 4 skeleton / Card 構成 |

## 3. DoD 充足状況

| ID | 状態 |
|----|------|
| DoD-01..10 (ファイル成果物) | ✅ green |
| DoD-T-01..05 (テスト) | ✅ 4 spec すべて vitest pass (686 passed / 1 skipped) |
| DoD-Q-01 typecheck | ✅ exit 0 |
| DoD-Q-02 lint | ✅ exit 0 |
| DoD-Q-03 build | ✅ Next.js webpack build success |
| DoD-Q-04 verify:tokens | ✅ exit 0 (88 tracked) |
| DoD-Q-05 test suffix | ✅ no `.test.*` |
| DoD-Q-06 verify-pr-ready | ✅ 0 gate failed |
| DoD-V-01 fallback screenshots | ✅ EV-12..15 PNG captured |

## 4. Phase 11 Evidence

| EV-ID | path | 状態 |
|-------|------|------|
| EV-01 typecheck.log | `outputs/phase-11/typecheck.log` | PASS |
| EV-02 lint.log | `outputs/phase-11/lint.log` | PASS |
| EV-03 vitest.log | `outputs/phase-11/vitest.log` | PASS (686/687) |
| EV-04 build.log | `outputs/phase-11/build.log` | PASS |
| EV-05 design-tokens.log | `outputs/phase-11/design-tokens.log` | PASS |
| EV-06 test-suffix.log | `outputs/phase-11/test-suffix.log` | PASS |
| EV-07 pr-ready.log | `outputs/phase-11/pr-ready.log` | PASS (0 fail) |
| EV-08 toast-provider-grep.txt | `outputs/phase-11/toast-provider-grep.txt` | runtime source only: layout.tsx import/render |
| EV-09 hex-direct-grep.txt | `outputs/phase-11/hex-direct-grep.txt` | 空 (HEX なし) |
| EV-10 screenshot-plan.json | `outputs/phase-11/screenshot-plan.json` | generated |
| EV-11 phase11-capture-metadata.json | `outputs/phase-11/phase11-capture-metadata.json` | generated |
| EV-12 root-layout.png | `outputs/phase-11/root-layout.png` | captured |
| EV-13 fallback-error.png | `outputs/phase-11/fallback-error.png` | captured |
| EV-14 fallback-not-found.png | `outputs/phase-11/fallback-not-found.png` | captured |
| EV-15 fallback-loading.png | `outputs/phase-11/fallback-loading.png` | captured |
| EV-16 ui-sanity-visual-review.md | `outputs/phase-11/ui-sanity-visual-review.md` | authored after screenshot review |

## 5. リスク / 残課題

- full 19-route runtime screenshots は serial-07 Playwright visual regression に統合する。parallel-04 の root fallback 4 画面は EV-12..15 で取得済み。
- ToastProvider grep は `__tests__` を除外した runtime source-only evidence とし、ランタイム mount は `apps/web/app/layout.tsx` の単一。

## 6. リリース判定

DoD 全項目 green。PR を `dev` に向け作成可能。
