# Phase 1: 要件定義

> Source issue: [#770](https://github.com/daishiman/UBM-Hyogo/issues/770)（OPEN のまま仕様書化）
> Parent spec: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i07-profile-loading-skeleton/spec.md`
> Unassigned-task spec: `docs/30-workflows/unassigned-task/integration-fixes-i07-profile-loading-skeleton.md`
> taskType: `implementation`
> visualEvidence: `VISUAL`
> workflow_state: `implemented_local_runtime_pending`
> implementation_mode: `implemented_local`
> task classification: code task (Next.js App Router loading boundary)
> 実装区分: **実装仕様書**（CONST_005 必須項目すべてを含む / CONST_007 1サイクル完了スコープ）

---

## 1. 真の論点

- 現象: `apps/web/app/profile/loading.tsx` が以下の簡素実装のみで、parallel-07 spec §4.5 が未達。
  ```tsx
  export default function ProfileLoading() {
    return (
      <main>
        <h1>マイページ</h1>
        <p aria-live="polite">読み込み中…</p>
      </main>
    );
  }
  ```
- 主問題:
  1. CLS リスク: テキストだけの placeholder で実 page (`/profile`) の avatar + KV pair layout と高さが大きく乖離 → streaming 完了時に layout shift が発生する。
  2. token 不整合: skeleton block を持たないため、OKLch token 経由の placeholder rhythm（`bg-surface-2` 系）が適用されていない。
  3. a11y: `role="status"` / `aria-busy="true"` / `.sr-only` 補助テキストがなく、screen reader への適切なステータス通知になっていない（WCAG 2.1 SC 4.1.3 観点で改善余地）。
- why now: parallel-07 DoD §4.5 の取り残し項目。i05 (issue #768) / i06 (root error focus) と並列で integration-fixes の最終仕上げを行うフェーズ。
- why this way: 既に i01-i06 で確立した「`role="status"` + `aria-busy` + `aria-live="polite"` + `.sr-only` + OKLch token utility による skeleton block」パターンを `/profile` にそのまま横展開する。新規 primitive / hook 抽出はしない（必要なら i05/i06/i07 完了後の refactor PR で対応）。

## 2. P50 チェック結果（起票時点 snapshot）

| 項目 | 結果 |
|---|---|
| current branch に実装が存在する | No（起票時点では `apps/web/app/profile/loading.tsx` は簡素実装のまま） |
| upstream にマージ済み | No（origin/main, origin/dev とも未変更） |
| 前提タスク完了 | Yes（`--ubm-color-surface-bg-2` token と `--color-surface-2` の theme inline mapping は `apps/web/src/styles/tokens.css` / `apps/web/src/styles/globals.css` に存在 → `bg-surface-2` utility は Tailwind v4 `@theme inline` 経由で使用可能） |

→ 起票時点 snapshot は pre-fix だったが、本 workflow 内で local implementation と local evidence を取得済み。Authenticated browser screenshot / staging runtime visual evidence は user-gated のため、root `workflow_state` は `implemented_local_runtime_pending` とする。

## 3. 背景

### 3.1 parallel-07 取り残し経緯

parallel-07 spec §4.1-4.5 は公開系 / shared / `/login` / `/profile` の loading・error UI を OKLch token 経由で一括統一する設計だったが、PR #743 merge 時点で `/login` 系 (i05) と `/profile/loading.tsx` (i07) の skeleton 化が漏れた。本 issue #770 として line-item 化されている。

### 3.2 既存資産

- OKLch token: `apps/web/src/styles/tokens.css` の `--ubm-color-surface-bg-2`
- Tailwind v4 mapping: `apps/web/src/styles/globals.css` の `@theme inline` ブロックで `--color-surface-2: var(--ubm-color-surface-bg-2);` → `bg-surface-2` utility が直接使用可能（globals.css への追加 CSS 不要）
- 既存 skeleton pattern: i01-i06 仕様で確立済み（avatar + heading + KV bars 構成）

### 3.3 実 `/profile` page 構造（参照）

`apps/web/app/profile/page.tsx`（streaming 後に差し替わる本体）は `MemberHeader` + `<main>` + `h1` + profile sections で構成される。loading boundary は親 parallel-07 spec §4.5 の「avatar + KV pairs」要求を満たしつつ、project の profile shell と同じ `main` 起点・余白 rhythm に寄せる。`max-w-3xl` は親 spec の profile card approximation であり、Phase 11 で runtime 表示を確認する。

## 4. 機能要件

- F-1: `apps/web/app/profile/loading.tsx` を「avatar (16x16 rounded-full) + heading bar (h-8 w-48) + 4 段 KV bar (h-6, 幅 full → 5/6 → 4/6 → 3/6)」の skeleton で置換する。
- F-2: ルート要素は `<main>` で、`role="status"` / `aria-busy="true"` / `aria-live="polite"` を持つ。
- F-3: `.sr-only` で「マイページを読み込み中」を render し、screen reader にアナウンスする。
- F-4: 全 placeholder block は `bg-surface-2` utility（= OKLch token `--ubm-color-surface-bg-2` 経由）を使用し HEX 直書きをしない。
- F-5: pulse アニメーションは `motion-safe:animate-pulse` を使用し、`prefers-reduced-motion` を尊重する。
- F-6: container は `mx-auto max-w-3xl px-6 py-12 space-y-6` で実 page の rhythm と整合させる。
- F-7: `data-page="profile-loading"` 属性を root に付与し、E2E / Playwright で identification 可能にする。

## 5. 非機能要件

| 観点 | 要件 |
|---|---|
| a11y | WCAG 2.1 SC 1.3.1 / 4.1.3 を満たす。`.sr-only` 補助テキストで loading 状態を非視覚利用者にも通知する |
| デザイン整合 | OKLch token 経由（HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止、task-18 `verify-design-tokens` gate を通過すること） |
| パフォーマンス | loading boundary は zero-runtime JS（`"use client"` 不要 / Server Component で render） |
| CLS | 実 `/profile` page と container 幅・spacing を揃え、layout shift を最小化する |
| 互換性 | Next.js App Router の loading.tsx 規約（default export / props なし）に従う |
| テスト | Vitest + Testing Library で role / aria 属性 / `.sr-only` 表示を検証 |

## 6. スコープ確定（CONST_007）

### 含む（in-scope / 1サイクル内完了）

- `apps/web/app/profile/loading.tsx` を skeleton 形状で置換
- `apps/web/app/profile/loading.spec.tsx` 新規作成（role / aria / sr-only 検証）
- parallel-07 DoD §4.5 の消し込み記録、integration-fixes index の i07 状態更新

### 含まない（out-of-scope）

- `/profile` page 本体 (`page.tsx`) の変更
- avatar / KV pair component の新規実装
- 共通 hook / primitive の抽出 → i05/i06/i07 完了後の refactor PR
- 新規 API endpoint / D1 schema 変更（不変条件1, 5 違反）
- HEX 直書き color（不変条件2 / task-18 gate 違反）

## 7. ユビキタス言語

| 用語 | 定義 |
|---|---|
| profile loading boundary | `apps/web/app/profile/loading.tsx` が export する default function。Next.js が `/profile` route の Suspense fallback として render する |
| OKLch skeleton | `bg-surface-2` utility（Tailwind v4 `@theme inline` 経由 OKLch token `--ubm-color-surface-bg-2`）で表現する pulse skeleton block |
| KV pair bar | profile page で「ラベル + 値」を 1 行で表示する横長 row の placeholder（h-6 の bar 群） |
| CLS 整合 | 実 page と skeleton の container 幅・要素高さを揃え、streaming 完了時の layout shift を抑える設計方針 |
