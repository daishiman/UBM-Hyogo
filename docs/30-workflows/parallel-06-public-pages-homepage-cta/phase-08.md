# Phase 8: アクセシビリティ / レスポンシブ

[実装区分: 実装仕様書]

| 項目 | 値 |
| --- | --- |
| Phase | 8 / 13 |
| 前 Phase | 7 |
| 次 Phase | 9 |
| 状態 | completed |

## A11y チェックリスト

- [ ] `<section>` 内に `<h2>` を 1 個持ち、heading hierarchy が崩れない（HomePage 上で h1=Hero、h2=各セクション）
- [ ] CTA `<a>` は visible text を持ち、`aria-label` 不要（自然な accessible name）
- [ ] focus-visible 時にアウトラインが視認できる（`var(--ubm-color-surface-panel)` 等 dark 背景上でコントラスト確保）
- [ ] color contrast: `var(--ubm-color-text-primary)` 背景上の `var(--ubm-color-surface-panel)` テキストが WCAG AA (4.5:1) 以上 — OKLch token 設計上担保される想定だが Phase 11 で screenshot 上で目視確認

## レスポンシブ

- [ ] mobile (< 768px): 1-column 縦積み、heading / body / cta が順に配置
- [ ] desktop (>= 768px): 2-column (copy / cta)、cta は右寄せ
- [ ] long heading / body でも overflow しない

## 検証

- Phase 11 で実機 screenshot (desktop / mobile) を取得し、prototype と比較する
- 必要に応じて axe-core 等の a11y アサーションを追加（既存 helper があれば流用）

## 完了条件

- A11y 4 項目 / レスポンシブ 3 項目をすべて満たす
