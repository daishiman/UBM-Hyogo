# Phase 3: 設計レビュー（Gate-A）

`[実装区分: 実装仕様書]`

## 3.1 レビュー観点と判定

| # | 観点 | 判定 | コメント |
|---|------|------|----------|
| R1 | 既存 primitive 再利用（FB-SDK-07-1） | PASS | icon は正本 `Icon` system に委譲。新 primitive なし |
| R2 | 命名一貫性（FB-SDK-07-4） | PASS | `useId` / Escape `keydown` / `<Icon name>` の既存パターンに整合 |
| R3 | 責務境界 | PASS | id・close は DensityToggle 内、icon は Icon system。`Segmented` 無変更 |
| R4 | event listener leak | PASS | mount 時 add、unmount cleanup で対称解除。ハンドラ内で `detailsRef.current.open` を判定（AC-9） |
| R5 | hydration 安全性 | PASS | `open` prop を渡さない非制御 `<details>` のため SSR/CSR の state 制御差分なし |
| R6 | design token gate | PASS | SVG は currentColor、CSS 限定差分も HEX なし（AC-8） |
| R7 | 回帰リスク | PASS | native summary toggle 維持で AC-5/AC-7 を保持。追加 close は Escape / outside pointerdown のみ |
| R8 | テスト可能性 | PASS | jsdom で複数配置 id / Escape(keydown) / pointerdown(click-outside) を fireEvent で固定可能 |

## 3.2 MINOR 指摘（未タスク化はしない=今サイクル内吸収）

- M1: click-outside の `pointerdown` は jsdom で `document.dispatchEvent(new Event("pointerdown"))` だと `target` を持たないため、テストでは `fireEvent.pointerDown(outsideEl)` を使い `contains` 判定が成立する DOM を用意する。→ Phase 4 テスト設計に明記済とする。
- M2: `useId()` が返す id にはコロンが含まれる（React 18 は `:r0:` 形式）。`getElementById` ではなく属性セレクタ or `aria-describedby` 照合でテストする。→ Phase 4 に明記。

## 3.3 判定

**Gate-A: PASS（条件なし）** — Phase 4 へ進む。MINOR M1/M2 はテスト設計時に吸収する。

## 完了条件
- Phase 4 へ進める判定が記録されていること。
