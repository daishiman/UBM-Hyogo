# Phase 8 outputs — リファクタリング方針

> SSOT: `../../_shared-context.md` §1.D / §2。

## リファクタリング方針

Phase 5 の eyebrow 要素削除により dead 化する CSS ルール（マッチ対象 0）を同一サイクルで削除し、
**dead CSS を残さない**。これは重複（生きていないルール）と navigation drift（編集時に「どのルールが効くか」を
誤認する温床）を削減するリファクタリングである。

- **新規重複・新規ルールは作らない**（不変条件 #5）。削除と最小限の値変更（CTA heading margin-top→0）のみ。
- 実体の編集は Phase 5 の F6 と一体（同一ファイル `legacy-public.css`）。本 Phase はその意図・before/after を記録する。
- 色の追加・HEX 直書きは一切しない（不変条件 #4）。`verify-design-tokens` 緑維持（Phase 9 で保証）。

## 削除と保持の判定

| セレクタ | 判定 | 根拠 |
| --- | --- | --- |
| `[data-component="call-to-action-cta"] [data-role="eyebrow"]` | 削除 | FOR MEMBERS eyebrow（C-6）削除でマッチ対象 0 |
| `[data-component="about-ubm"] [data-role="eyebrow"]` | 削除 | ABOUT / THREE ZONES eyebrow（C-3/C-4）削除でマッチ対象 0 |
| `[data-component="featured-members"] [data-role="eyebrow"]` | 削除 | FEATURED MEMBERS eyebrow（C-2）削除でマッチ対象 0 |
| `[data-component="timeline"] [data-role="header"] [data-role="eyebrow"]` | 削除 | RECENT MEETINGS eyebrow（C-5）削除でマッチ対象 0 |
| `[data-component="hero"][data-variant="card"] [data-role="eyebrow"]` | **保持** | Hero は prop 経由で eyebrow を依然サポート（dead でない） |

## スペーシングへの影響

eyebrow 削除後、各見出しが親の先頭要素になる。

- about-ubm / featured-members / timeline の `section-heading` は `margin-top:0` 相当で、カード/ヘッダー上端に揃う（視覚的に問題なし）。
- CTA `[data-role="heading"]` は `margin-top: var(--ubm-space-2)`（eyebrow との分離目的）を持つ。eyebrow 削除後は copy ブロック先頭の余白になるため **`margin-top` を 0 にする**。

詳細な before/after は `before-after.md` を参照。
