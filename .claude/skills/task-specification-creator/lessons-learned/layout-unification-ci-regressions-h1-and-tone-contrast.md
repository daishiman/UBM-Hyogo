# Lesson — 共通レイアウト統一タスクの CI-only 回帰（h1 二重化 / tone specificity コントラスト）

## Context

`public-member-common-ui-card-unification`（公開・会員8画面を `PageShell` / `PageHeader` / `SectionCard` / `ButtonLink` 等の共通レイアウト primitive へ統一する VISUAL リファクタ）の PR #1213 が、`pnpm typecheck` / `pnpm lint` / focused vitest を全 pass しながら、GitHub Actions の playwright e2e と axe a11y で **2 系統の実機能回帰**を出した。dev sync-merge 自体はクリーン（skill-index union のみ）で、これらは Lane B 実装（commit `357c023a3`）が持ち込んだ回帰を CI が検出したもの。`docs/public-member-common-ui-card-unification-spec` ブランチ・2026-06-11。

## Lesson

共通レイアウト primitive で既存ページを「ラップ」する統一タスクは、**typecheck / lint では絶対に捉えられない 2 種類の回帰**を構造的に生む。仕様書 Phase 5（検証設計）/ Phase 11 に以下のアサートを明示すること。

- **L-LAYOUT-001（h1 二重化 — primitive の見出しと既存 hero の見出しが衝突）**: `PageHeader title={...}` は `<h1>` を描画する。既に hero（例 `ProfileHero` の `<h1>{fullName}</h1>`）を持つページを `PageHeader(title=同じ値)` でラップすると **1 ページに level-1 heading が 2 つ**でき、Playwright の `getByRole('heading', { level: 1 })`（strict-mode）が `resolved to 2 elements` で fail する。typecheck/lint は heading 数を見ないので緑。
  - **仕様化**: ページごとに「h1 の正本は PageHeader か既存 hero のどちらか一方」を Phase 1 のカード化マッピング表で明示し、hero を持つページは PageHeader に氏名/タイトルを渡さず**戻る導線 nav のみ**にする（見出しは hero に一本化）。Phase 11 に `getByRole('heading', { level: 1 })` の単一性アサートを必須化。
  - **修正例**: `/members/[id]` 成功ブランチの `PageHeader(title=fullName, lead=戻る)` を `<nav aria-label="パンくず"><a data-role="back">…</a></nav>` に置換。エラーブランチ（hero 不在で PageHeader が唯一の h1）は維持。

- **L-LAYOUT-002（tone specificity でコンポーネント自前の背景が上書きされ a11y コントラスト違反）**: `SectionCard tone="accent"` は `.ui-section-card[data-tone="accent"]`（specificity **0,2,0**）で light な `accent-soft` 背景＋`accent-ink` 文字を当てる。これが「自前で暗背景＋白文字」を持つコンポーネント（例 dark variant CTA の `[data-component="call-to-action-cta"]` = specificity **0,1,0**）を**背景だけ**上書きし、白系テキストが light 背景に乗って**コントラスト比 1.1（要 4.5:1）の WCAG 2.1 AA 違反**になる。axe（`color-contrast` serious）でのみ検出され、しかも **browser 依存**（chromium は `color-mix(in oklch, …)` 解決を incomplete 扱いして pass、firefox/webkit は具体色に解決して violation）。
  - **仕様化**: コンポーネントを `SectionCard tone=...` でラップする際は「tone の背景 specificity（0,2,0）がコンポーネント自前ルール（多くは 0,1,0 の `[data-component]`）に勝つ」前提で、(a) 意味的に正しい tone を選ぶ（dark variant に light な `accent` を当てない）、(b) 自前背景を残すならコンポーネント root セレクタを `.ui-section-card[data-component="…"]`（0,2,0）に上げて base/tone を確実に上書きする。Phase 11 に axe `color-contrast` 0 件を**主要 public ルートで**必須化し、**chromium 単独で緑を判断しない**（firefox/webkit を含める）。
  - **修正例**: `CallToActionCTA` の `tone="accent"` を撤去（dark variant は light accent カードではない）＋ CTA root セレクタを `.ui-section-card[data-component="call-to-action-cta"]` に昇格し `border: 1px solid transparent` / `box-shadow: none` で base 枠を打ち消す。

- **L-LAYOUT-003（visual snapshot の fail は baseline drift であり「CI fail」と分けて報告）**: 意図的再デザイン PR では `toHaveScreenshot` 系（`playwright-visual-full` / `visual (chromium, 4 screens)` / `sidebar-shell` viewport 別）が必ず baseline 差分で fail する。これはコード修正で直すものではなく、専用 `playwright-visual-baseline-update.yml`（`workflow_dispatch` + `visual-baseline-approval` 環境＝**ユーザー承認ゲート**）での baseline 再生成が正規経路。機能系（e2e strict-mode / axe / smoke）の fail と峻別し、baseline drift を勝手に再生成しない（重い binary 差分＋承認必須）。

## Evidence

- PR: #1213 `docs/public-member-common-ui-card-unification-spec`。
- 機能修正 commit: h1 二重化 = `/members/[id]/page.tsx`（PageHeader→戻る導線 nav）/ コントラスト = `CallToActionCTA.tsx`（tone 撤去）+ `legacy-public.css`（root selector specificity 昇格）。
- CI 検証: e2e `desktop-chromium` / `desktop-firefox` / `mobile-webkit` / `e2e-tests-coverage-gate` 全 **success**（修正前は firefox/webkit が a11y `color-contrast` と public-flow:24 axe で fail）。残る `playwright-visual-full` / `visual` snapshot fail は baseline drift（user-gated 再生成）。
- 関連: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-122（sync pre-flight typecheck/lint は件数・描画・a11y に盲目）の VISUAL 統一版。
