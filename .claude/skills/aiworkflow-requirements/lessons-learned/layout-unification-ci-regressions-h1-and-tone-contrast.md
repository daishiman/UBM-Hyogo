# Lessons Learned — 共通レイアウト統一タスクの CI-only 回帰（h1 二重化 / tone specificity コントラスト）

`public-member-common-ui-card-unification`（公開・会員8画面を `PageShell` / `PageHeader` / `SectionCard` / `ButtonLink` へ統一する VISUAL リファクタ）PR #1213 が `pnpm typecheck` / `pnpm lint` / focused vitest を全 pass しつつ GitHub Actions の playwright e2e と axe a11y で 2 系統の実機能回帰を出した記録（2026-06-11 `docs/public-member-common-ui-card-unification-spec`）。dev sync-merge 自体はクリーンで、これは Lane B 実装（`357c023a3`）が持ち込んだ回帰を PR CI が検出したもの。task-specification-creator [[layout-unification-ci-regressions-h1-and-tone-contrast]] と対。

## L-LAYOUT-001: PageHeader の h1 と既存 hero の h1 が衝突して二重化 → Playwright strict-mode 違反

- 事象: `PageHeader title={fullName}` が `<h1>` を描画する一方、同ページの `ProfileHero` も `<h1>{fullName}</h1>` を持つ。Lane B が hero ありのページを `PageHeader(title=同名)` でラップしたため `/members/[id]` に level-1 heading が 2 つでき、`getByRole('heading', { level: 1 })`（`public-detail-register-legal.spec.ts:43` / `MemberDetailPage` page object）が `resolved to 2 elements` の strict-mode 違反で fail。`pnpm typecheck` / `pnpm lint` は heading 数を見ないので緑だった。
- How to apply: hero（独自 h1）を持つページを共通レイアウトでラップする際は **h1 の正本を片方に一本化**する。hero がある場合は PageHeader にタイトルを渡さず戻る導線 nav のみにし、見出しは hero に委ねる。Phase 11 検証に `getByRole('heading', { level: 1 })` の単一性アサートを必須化。
- 修正: `/members/[id]/page.tsx` 成功ブランチの `PageHeader(title=fullName, lead=戻る)` を `<nav aria-label="パンくず"><a data-role="back">…</a></nav>` に置換。エラーブランチ（hero 不在で PageHeader が唯一 h1）は維持。

## L-LAYOUT-002: SectionCard tone の specificity (0,2,0) がコンポーネント自前背景 (0,1,0) を上書き → WCAG AA コントラスト違反

- 事象: `SectionCard tone="accent"` = `.ui-section-card[data-tone="accent"]`（specificity **0,2,0**）が light な `accent-soft` 背景を当て、dark variant CTA の自前ルール `[data-component="call-to-action-cta"]`（**0,1,0**・暗背景+白文字）の**背景だけ**を上書き。結果、白系テキスト（`#fff2e4` / `#fff5e9`）が light 背景（`#ffe4ca`）に乗り**コントラスト比 1.1（要 4.5:1）**の WCAG 2.1 AA 違反。axe `color-contrast`（serious）でのみ検出され、**browser 依存**（chromium は `color-mix(in oklch, …)` を incomplete 扱いで pass、firefox/webkit は具体色解決で violation）。`a11y.spec.ts` と `public-flow.spec.ts:24`（home で axe）が firefox/webkit で fail。
- How to apply: コンポーネントを `SectionCard tone=...` でラップする際は「tone 背景 specificity (0,2,0) がコンポーネント自前 `[data-component]`（多く 0,1,0）に勝つ」前提で、(a) 意味的に正しい tone を選ぶ（dark variant に light accent を当てない）、(b) 自前背景を残すなら root セレクタを `.ui-section-card[data-component="…"]`（0,2,0）へ昇格して base/tone を確実に上書きする。Phase 11 に axe `color-contrast` 0 件を主要 public ルートで必須化し、**chromium 単独で緑を判断しない**。
- 修正: `CallToActionCTA` の `tone="accent"` 撤去 + CTA root を `.ui-section-card[data-component="call-to-action-cta"]` へ昇格（`border: 1px solid transparent` / `box-shadow: none` で base 枠打消し）。

## L-LAYOUT-003: visual snapshot fail は baseline drift であり機能 CI fail と峻別

- 事象: 意図的再デザイン PR では `toHaveScreenshot` 系（`playwright-visual-full` / `visual (chromium, 4 screens)` / `sidebar-shell` viewport 別）が baseline 差分で必ず fail。これはコード修正対象ではなく、専用 `playwright-visual-baseline-update.yml`（`workflow_dispatch` + `visual-baseline-approval` 環境＝ユーザー承認ゲート）での baseline 再生成が正規経路。
- How to apply: 「CI が赤い」を機能 fail と即断せず、`smoke` / `auth-slot` / e2e（機能）と `visual*`（snapshot）を分けて報告する。baseline drift を勝手に再生成しない（重い binary 差分 + 承認必須）。機能系のみ自律修正し、baseline 再生成は user-gated として残す。

## 検証

- 機能修正 commit: h1 = `/members/[id]/page.tsx`（`f4bfe6d4f`）/ コントラスト = `CallToActionCTA.tsx` + `legacy-public.css`（`e70c857e2`）。
- e2e `desktop-chromium` / `desktop-firefox` / `mobile-webkit` / `e2e-tests-coverage-gate` 全 **success**（run 27341029233）。`pnpm typecheck` / `pnpm --filter web lint` / `pnpm verify:tokens`(91) / focused vitest（CallToActionCTA 11 / ProfileHero 5 / page 3）全 pass。残 `playwright-visual-full` / `visual` snapshot fail は baseline drift（user-gated 再生成）。
- 参照: L-DEVSYNC-122（sync pre-flight typecheck/lint は件数・描画・a11y に盲目）の VISUAL 統一版。
