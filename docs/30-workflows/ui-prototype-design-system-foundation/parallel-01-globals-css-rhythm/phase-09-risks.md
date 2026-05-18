---
phase: 9
title: リスク・代替案 — 既存 base 衝突 / specificity / cascade 干渉
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-01-globals-css-rhythm
status: spec_created
---

# Phase 9 — リスク・代替案

[実装区分: 実装仕様書]

## 1. リスク一覧

| ID | リスク | 影響 | 発生確率 | 緩和策 |
|----|--------|------|--------|--------|
| R-01 | 既存 `@layer base` の `body` 規則と本 SW `[data-route]` 規則が cascade で互いに干渉 | 中 | 低 | `body` は触らず `[data-route]` のみ対象。値が同等なら衝突しない |
| R-02 | parallel-02（tag pill / member card hover / `[data-visibility]`）の selector と重なる | 中 | 低 | parallel-02 は `[data-component]` / `[data-visibility]` / `:hover` を扱い、本 SW の `[data-card]` / `[data-text]` 等と名前空間が分離 |
| R-03 | parallel-03 が `data-shell` 属性を付け忘れ、AppShell の chrome が出ない | 高 | 中 | parallel-03 の Phase 5 で `data-shell` 必須付与を契約として明記する（本 SW で `data-shell` 値の意味を Phase 4 に固定） |
| R-04 | Tailwind v4 utility と specificity が同等で意図せず後勝ち | 中 | 中 | 本 SW は base state のみ、page.tsx の Tailwind utility を後勝ちで上書き許容する設計 |
| R-05 | `backdrop-filter: blur(12px)` が古い Safari で効かない | 低 | 低 | `-webkit-backdrop-filter` を併記。effect なしでも見た目崩れはない（背景色は単独で機能） |
| R-06 | dark theme cascade が将来追加された場合に値の上書きが必要 | 低 | 中 | dark theme は MVP 非対応（NFR-04）。tokens.css 側で対応する設計のため、本 SW の selector は再利用可能 |
| R-07 | `[data-theme="warm"]` / `[data-theme="cool"]` cascade で sidebar の border 色が想定外に変わる | 低 | 中 | `--ubm-color-border-default` は theme override 内で再定義済（tokens.css L99, L115）。意図通りの挙動 |
| R-08 | `@layer components` 末尾追加でファイル肥大化 | 低 | 高 | 100-150 行程度の追加で許容範囲。本 workflow 内では分割せず、肥大化しない selector 数に抑える |
| R-09 | typography line-height を無単位値（1.7 等）で指定して継承される | 中 | 低 | 仕様通り。無単位は推奨パターン（W3C） |
| R-10 | `verify-design-tokens` gate が新規 selector を未承認として fail | 中 | 中 | gate スクリプトは HEX / `bg-[#` を検出するもので selector 名は対象外。リスク低 |

## 2. 採用しない代替案（再掲・Phase 2 §4 補足）

| 案 | 不採用理由 |
|----|----------|
| CSS-in-JS で page chrome を出す | OpenNext / Workers Edge runtime での hydration コスト増。global CSS の方が安価 |
| Tailwind plugin を書いて `bg-page-surface` 等の utility を生やす | プラグイン保守コスト > selector 規則保守コスト |
| `app/(public)/layout.tsx` 内に `<style>` で書く | route group 単位の重複・SSR ハイドレーション差分リスク |
| `[data-card]` を class `.ui-card` に置換 | AppShell が attribute 主体のため、契約一貫性のため attribute を採用 |

## 3. ロールバック

本 SW の変更は単一ファイル（globals.css）の追加挿入のみ。問題発生時は `git revert <commit>` で完全に元の状態へ戻せる。tokens.css / page.tsx / layout.tsx には触らないため副作用なし。
