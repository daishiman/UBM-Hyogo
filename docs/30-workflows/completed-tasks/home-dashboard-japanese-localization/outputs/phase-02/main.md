# Phase 2 成果物 — 設計 main

> 正本: [`../../_shared-context.md`](../../_shared-context.md) §1・§2。

## 1. 既存コンポーネント再利用可否

| コンポーネント | 新規/編集 | 根拠 |
| --- | --- | --- |
| `Stats.tsx` | 編集のみ | `data-role="label"` テキストと `badge-sync` テキスト置換 |
| `Hero.tsx` | **編集なし** | prop を渡さないだけ（汎用性・既存テスト互換のため本体不変） |
| `AboutUbm.tsx` | 編集のみ | eyebrow 要素 2 件削除 |
| `Timeline.tsx` | 編集のみ | eyebrow 要素 1 件削除 |
| `CallToActionCTA.tsx` | 編集のみ | eyebrow 要素 1 件削除 |
| `app/(public)/page.tsx` | 編集のみ | Hero prop 削除 + FEATURED MEMBERS eyebrow 削除 |

- **新規 component 0 / 新規 primitive 0**（SSOT §2-5）。
- 上記コンポーネントは `app/(public)/page.tsx`（ホーム）からのみ利用（SSOT §2-7・grep 確認済み）。eyebrow 削除は他画面へ波及しない。

## 2. A/B 文字列置換設計（`Stats.tsx`）

`data-role="label"` のテキストノードのみ置換し、`value` / `sub` / `dot` / `data-stat` は不変。

- 44: `Members` → `公開メンバー`
- 49: `Zones` → `事業フェーズ`
- 54: `Meetings / yr` → `年間の支部会`
- 59: `Last sync` → `最終データ更新`
- 64: `badge-sync` 内テキスト `Forms 同期中` → `自動で最新化`（`data-role="dot"` 要素は不変）

`Stats` の props 契約・`PublicStatsView` 型は不変（SSOT §2-2）。

## 3. C. eyebrow 削除方式

| 方式 | 対象 | 内容 |
| --- | --- | --- |
| **C-1: prop 非伝播** | C-1（Hero / page.tsx:75） | `<Hero>` から `eyebrow` prop を渡さない。Hero 本体は `eyebrow ? <p data-role="eyebrow">…</p> : null`（Hero.tsx:48）を**保持**。Hero は汎用コンポーネントとして eyebrow をサポートし続け、既存 `Hero.component.spec.tsx` は破壊しない。 |
| **要素削除** | C-2..C-6 | `<p data-role="eyebrow">…</p>` を要素ごと削除。page.tsx:94 / AboutUbm.tsx:50,56 / Timeline.tsx:51 / CallToActionCTA.tsx:24。直下の日本語見出しのみ残す。 |

## 4. D. dead CSS 削除設計（`legacy-public.css`）

C で eyebrow 要素を削除すると、対応 CSS セレクタはマッチ対象ゼロの dead rule になる。同一サイクルで削除する（dead CSS を残さない）。

| セレクタ | 行（参考） | 処理 |
| --- | --- | --- |
| `[data-component="call-to-action-cta"] [data-role="eyebrow"]` | 312–318 | 削除 |
| `[data-component="hero"][data-variant="card"] [data-role="eyebrow"]` | 817–824 | **保持**（Hero は prop 経由で eyebrow を依然サポート） |
| `[data-component="about-ubm"] [data-role="eyebrow"]` | 887–894 | 削除 |
| `[data-component="featured-members"] [data-role="eyebrow"]` | 984–991 | 削除 |
| `[data-component="timeline"] [data-role="header"] [data-role="eyebrow"]` | 1020–1027 | 削除 |

**CTA 見出し余白調整**: `[data-role="heading"]`（320–323）の `margin-top: var(--ubm-space-2)` は eyebrow との分離目的だった。eyebrow 削除後は copy ブロック先頭の余白になるため `margin-top` を **0** にする（または Phase 11 で余白が出ないことを確認）。

> **編集手順上の注意**: CSS を上から削除すると後続行がズレる。**セレクタ文字列で特定**して編集する（行番号は参考値・SSOT §1D）。CSS は削除のみで色追加 0 → `verify-design-tokens` 緑維持（SSOT §2-4）。

## 5. DOM contract 保持（SSOT §2-3）

- 変更するのは「eyebrow 要素の削除」と「ラベル文字列の置換」のみ。
- 不変: `data-component` / `data-stat` / `data-role`（**eyebrow 除く**）/ `aria-*` / `role` / `id`（`stats-heading` 等）/ href / testid。
- eyebrow 削除に伴い `section-heading` / CTA `heading` が親の先頭要素になるが、構造的な data 属性は他に影響しない。

## 6. 設計サマリ

文字列置換（A/B・5 行）+ 要素削除（C-2..C-6・5 要素 + Hero prop 非伝播）+ CSS 削除4 + CTA margin-top 0、の最小差分。各変更の入力/出力/副作用は [`localization-map.md`](./localization-map.md) を正とする。
