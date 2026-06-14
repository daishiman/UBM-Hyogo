# Phase 8 — Before / After（dead CSS 削除・CTA heading 余白調整）

> SSOT: `../../_shared-context.md` §1.D。行番号は参考値。**セレクタ文字列で特定**して編集する。

## dead eyebrow ルールの削除（4 件）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| `[data-component="call-to-action-cta"] [data-role="eyebrow"]`（312–318） | `{ font-size: var(--ubm-text-xs); letter-spacing: 0.08em; text-transform: uppercase; color: color-mix(...); margin: 0; }` | （ブロックごと削除） | FOR MEMBERS eyebrow 要素削除でマッチ対象 0 = dead rule。重複・drift 削減のため削除 |
| `[data-component="about-ubm"] [data-role="eyebrow"]`（887–894） | `{ margin: 0 0 8px; color: var(--ubm-color-text-muted); font-family: var(--ubm-font-en); font-size: var(--ubm-text-xs); letter-spacing: 0.16em; text-transform: uppercase; }` | （ブロックごと削除） | ABOUT / THREE ZONES eyebrow 削除でマッチ対象 0 |
| `[data-component="featured-members"] [data-role="eyebrow"]`（984–991） | `{ margin: 0 0 4px; color: var(--ubm-color-text-muted); font-family: var(--ubm-font-en); font-size: var(--ubm-text-xs); letter-spacing: 0.16em; text-transform: uppercase; }` | （ブロックごと削除） | FEATURED MEMBERS eyebrow 削除でマッチ対象 0 |
| `[data-component="timeline"] [data-role="header"] [data-role="eyebrow"]`（1020–1027） | `{ margin: 0 0 4px; color: var(--ubm-color-text-muted); font-family: var(--ubm-font-en); font-size: var(--ubm-text-xs); letter-spacing: 0.16em; text-transform: uppercase; }` | （ブロックごと削除） | RECENT MEETINGS eyebrow 削除でマッチ対象 0 |

## 保持するルール（誤削除防止）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| `[data-component="hero"][data-variant="card"] [data-role="eyebrow"]`（817–824） | `{ margin: 0; color: var(--ubm-color-text-muted); font-family: var(--ubm-font-en); font-size: var(--ubm-text-xs); letter-spacing: 0.16em; text-transform: uppercase; }` | **変更なし（保持）** | Hero は eyebrow prop を依然サポートする汎用コンポーネント。home が prop を渡さないだけで dead でない |

## CTA heading の余白調整

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| `[data-component="call-to-action-cta"] [data-role="heading"]`（320–323） | `{ margin-top: var(--ubm-space-2); color: inherit; }` | `{ margin-top: 0; color: inherit; }` | eyebrow（FOR MEMBERS）削除後、heading が copy ブロックの先頭要素になる。eyebrow との分離余白だった margin-top を 0 にして上端余白を消す |

## 不変条件チェック

- 色の追加: **0**（削除のみ。CTA heading は `margin-top` の値変更のみで色プロパティは不変）。
- HEX 直書き: **0**（新規 `#xxx` / `bg-[#xxx]` なし）。
- 新規重複・新規ルール: **0**。
- jsdom は CSS 非評価のため、削除後のスペーシングは Phase 11 スクリーンショット（user-gated）で確認する。
