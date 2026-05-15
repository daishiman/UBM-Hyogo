# Phase 3: 設計レビュー

> Phase: 3 / 13
> 名称: 設計レビュー（Phase 2 の独立検証ゲート）

---

## レビュー観点

| # | 観点 | 判定 | 根拠 |
|---|------|------|------|
| R1 | OKLch token 整合（HEX 直書き 0） | PASS（spec 段階） | Phase 2 で使用クラスはすべて `bg-surface-2` / `text-danger` / `bg-accent` / `text-panel` 等の現行 token utility。HEX 撲滅は task-18 gate で実装後 enforce。 |
| R2 | a11y（aria-live / role） | PASS | error は `role="alert" aria-live="assertive"`、loading は `role="status" aria-busy="true" aria-live="polite"` で WCAG 2.1 4.1.3 適合。 |
| R3 | focus 移譲の妥当性 | PASS | `tabIndex={-1}` + `useEffect` で `h1` に focus。`preventScroll: true` でスクロール暴れを抑制。 |
| R4 | prefers-reduced-motion 尊重 | PASS | skeleton は `motion-safe:animate-pulse` で、`prefers-reduced-motion: reduce` 時に pulse が抑制される。 |
| R5 | 既存 primitive 活用 | PASS | `Card` / `CardContent` を新規生やさず利用。新 primitive 増殖なし。 |
| R6 | API / D1 不変 | PASS | UI のみの変更。API endpoint / D1 への参照なし。 |
| R7 | テスト前提 (`.spec.tsx`) | PASS | Phase 4 で全 spec を `.spec.tsx` で計画。 |
| R8 | Card layout 判断 (root/error) | CONDITIONAL | root/error は scope が広く、視覚衝突を避けるため Card 化は「既存スタイル次第・最小差分」。Phase 5 で実体確認 → 決定。 |
| R9 | screen reader アナウンスの競合 | PASS | `aria-live="assertive"` と focus 移譲が同時発火するが、focus 移譲はアナウンスを上書きしない（CardContent → h1 の順序）。 |
| R10 | sr-only テキストの妥当性 | PASS | loading に「読み込み中」、login error に固定文言を採用。 |

---

## MINOR 指摘（先送り可）

- M1: `Card` の `header` slot が現在 Card.tsx に明示的に存在しない場合、`<header>` を Card 内に直接配置する形を Phase 5 で確認する。
- M2: CTA utility は現行実装の `bg-accent text-panel` を正本とする。旧 primary foreground 系 utility は使用しない。

両 MINOR とも Phase 5 開始時に実ファイル確認で即時解決可能、ブロッカーではない。

---

## MAJOR 指摘

なし。

---

## ゲート判定

**PASS** — Phase 4（テスト計画）に進む。Phase 5 開始時に M1 / M2 を実 file 確認で解消すること。

---

## 次フェーズへの引き継ぎ

Phase 4 では以下のテストケースを定義する:

- LoginError: render / focus 移譲 / `role="alert"` / jest-axe 0 violations
- LoginLoading: render / `role="status"` / `aria-busy="true"` / motion-safe / jest-axe 0 violations
- RootError: focus 移譲（既存 role/aria は維持）
- ProfileLoading: render / skeleton 形状 / jest-axe 0 violations
- Playwright smoke: `/login` slow load → skeleton 表示確認、`/login` error → focus 移譲確認、root error 確認、`/profile` slow load 確認
