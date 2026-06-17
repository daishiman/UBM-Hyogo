# Phase 2: 設計 — レスポンシブ体系・CSS / component 変更

## メタ情報

- task_id: `responsive-mobile-tablet-ui-fixes`
- 前提: [phase-1-requirements.md](phase-1-requirements.md) の AC-1..AC-10 / [shared-context.md](shared-context.md)
- 設計対象: ブレークポイント体系、CSS 変更ブロック、レイアウト component 変更、テストレーン。

## 目的

AC-1..AC-10 を満たす最小差分の設計を確定し、Phase 5（実装手順）が copy-paste 可能なレベルで CSS / component 変更を定義する。

## 設計原則（CLAUDE.md 不変条件 / prototype-driven）

1. mobile-first（base はモバイル、`min-width` で拡張）。既存の `max-width` ルールは段階的に標準境界へ寄せる。
2. design token 経由（HEX 直書き禁止）。新規色は追加しない。
3. 新規 primitive を生やさない。既存 CSS クラス / Tailwind utility の範囲で是正。
4. API/D1/Form 非接触。CSS / breakpoint / レイアウト属性のみ変更。

## 変更対象ファイル一覧

| 種別 | パス | 変更種別 | 対応 AC |
| --- | --- | --- | --- |
| token | `apps/web/src/styles/tokens.css` | 編集（`--bp-md/lg/xl` 追加・コメント規約） | AC-1 |
| CSS | `apps/web/src/styles/globals.css` | 編集（メディアクエリ境界統一・grid 流体化・テーブル・オーバーレイ） | AC-1,2,4,6,7,8 |
| CSS | `apps/web/src/styles/legacy-public.css` | 編集（`main` 幅 clamp・stat-card / hero grid 流体化） | AC-2,6 |
| CSS | `apps/web/src/styles/auth.css` | 編集（auth フォーム狭幅 padding） | AC-3,5 |
| component | `apps/web/src/components/shell/SidebarDrawer.tsx` | 編集（drawer 幅 `min(17rem, 88vw)`） | AC-8 |
| CSS | `apps/web/src/styles/globals.css` | 編集（tooltip/popover viewport-safe max-width） | AC-8 |
| test | `apps/web/playwright/tests/visual-full/full-visual.spec.ts` | 編集（既存 visual full に横スクロール 0 アサート追加） | AC-2..AC-10 |
| test | `apps/web/src/components/shell/__tests__/SidebarDrawer.spec.tsx` | 新規/編集（drawer 幅クラスの jsdom 構造検証） | AC-8 |

## ブレークポイント設計（AC-1 / RC-1）

`tokens.css` 末尾にドキュメント目的の変数を追加（CSS メディアクエリは変数を直接使えないため、規約コメントとして固定）:

```css
/* --- responsive breakpoints (documentation anchors; media queries must inline these px values) --- */
:root {
  --bp-md: 768px;  /* tablet 開始 */
  --bp-lg: 1024px; /* small desktop / sidebar aside 開始 */
  --bp-xl: 1280px; /* desktop */
}
```

`globals.css` の境界統一規則（RC-1 是正）:

| Before | After | 理由 |
| --- | --- | --- |
| `@media (max-width: 767px)` | `@media (max-width: 767.98px)` | `md`(768) 未満を明示。768 ちょうどの揺らぎ防止 |
| `@media (max-width: 900px)`（attendance grid 等） | `@media (max-width: 1023.98px)` | タブレット帯(768-1024)でも詰まる 2 カラムを `lg` 未満で単カラム化 |
| `@media (max-width: 768px)`（tag-master 等） | `@media (max-width: 1023.98px)` | 同上（タブレットで 640px min 2 カラムが溢れるため `lg` 未満で 1 カラム） |
| `@media (min-width: 768px)`（user menu popover 切替） | 維持（標準境界） | 768 は標準のため変更不要 |

## グリッド流体化設計（AC-6 / RC-2）

```css
/* legacy-public.css: main 幅の左右 padding を clamp 化（小型携帯で 40px 固定が広すぎる/狭い問題） */
main {
  width: min(1120px, 100%);
  padding-inline: clamp(1rem, 4vw, 1.25rem);
  margin: 0 auto;
}

/* stat-card grid: 携帯で 2 カラムを単カラム化 */
[data-component="stat-card"] {
  grid-template-columns: minmax(0, 1fr);
}
@media (min-width: 768px) {
  [data-component="stat-card"] {
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  }
}

/* tag-master-grid / attendance / schema-glossary: minmax(Nrem,…) を minmax(0,…) + lg 未満単カラムへ */
.tag-master-grid,
.attendance-primary-grid {
  grid-template-columns: minmax(0, 1fr);
}
@media (min-width: 1024px) {
  .tag-master-grid {
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  }
  .attendance-primary-grid {
    grid-template-columns: minmax(0, 1.35fr) minmax(0, 0.85fr);
  }
}
.schema-glossary {
  grid-template-columns: minmax(0, 1fr);
}
@media (min-width: 768px) {
  .schema-glossary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (min-width: 1024px) {
  .schema-glossary { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
```

> 是正の要点: `minmax(18rem, …)` の **18rem 最小値**が携帯幅を超えてはみ出す。`minmax(0, …)` にすると親幅を超えない。

## テーブル可視性設計（AC-7 / RC-3）

mobile（< md）では「カード積み」、tablet 以上は sticky 見出し + セル `min-width` 横スクロールで content を隠さない。

```css
/* 管理テーブル共通ラッパ。mobile はカード化、tablet+ は横スクロール許容 */
.admin-table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
@media (max-width: 767.98px) {
  /* カード積み: thead を隠し、各 td を data-label で縦積み（既存テーブルに data-label 属性を additive 付与） */
  .admin-table--cards thead { display: none; }
  .admin-table--cards tr { display: grid; gap: 0.25rem; padding-block: 0.75rem; }
  .admin-table--cards td { display: grid; grid-template-columns: 9rem 1fr; gap: 0.5rem; }
  .admin-table--cards td::before { content: attr(data-label); color: var(--ubm-color-text-muted); }
}
@media (min-width: 768px) {
  .admin-table th, .admin-table td { min-width: 7rem; white-space: normal; }
}
```

> 既存テーブル component には `data-label` 属性の **additive 付与**のみ行い、列構造・testid・href は不変（不変条件遵守）。
> カード化が過剰な小規模テーブルは「sticky 見出し + セル `min-width` + 横スクロール」のみで可（Phase 5 で per-table 判断）。

## オーバーレイ収納設計（AC-8 / RC-4）

```css
/* shell tooltip: viewport 右端で見切れないよう max-width clamp */
.ubm-shell-tooltip { max-width: min(240px, calc(100vw - var(--shell-bar-w-collapsed) - 1.5rem)); }

/* user menu popover: mobile は上開き、はみ出し防止に max-width clamp */
.ui-sidebar-user-menu-popover { max-width: min(208px, calc(100vw - 2rem)); }
```

```tsx
// SidebarDrawer.tsx: drawer 幅を min(17rem, 88vw) 相当へ（小型携帯でバックドロップ tap 領域確保）
// Before: className="... w-[17rem] max-w-[85vw] ..."
// After : className="... w-[min(17rem,88vw)] ..."
```

## 共通画面・auth 設計（AC-5 / RC-5）

```css
/* auth.css: 420px 固定 + 安全 padding */
.auth-card { width: min(100%, 420px); padding-inline: clamp(1rem, 5vw, 1.5rem); }
```

```tsx
// error.tsx / not-found.tsx / loading.tsx: ルートコンテナを Tailwind で
// "min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center" 化（既存クラスに準拠）
```

## ステップ間 state / 既存テスト影響

- 本タスクは UI state を増やさない（純 CSS / 属性 additive）。`SidebarDrawer` の幅クラス変更のみ jsdom 構造 spec で検証。
- 既存テストへの影響: テーブルへの `data-label` 追加・幅クラス変更が既存 query を壊さないこと（Phase 6 で確認）。

## 参照資料

### システム仕様（aiworkflow-requirements）

- `ui-ux-*.md`（レスポンシブ・レイアウト境界）, `architecture-*.md`。

## 成果物

- 本ファイル（設計）。変更ファイル一覧・ブレークポイント体系・CSS ブロック・component 変更・テストレーン。

## 統合テスト連携

- Phase 4 が本設計の CSS 変更を Playwright visual（mobile/tablet）+ jsdom 構造 spec に対応付ける。

## 完了条件

AC-1..AC-10 に対し、変更ファイル・CSS 差分方針・component 変更が copy-paste 可能なレベルで定義され、不変条件に矛盾しないこと。
