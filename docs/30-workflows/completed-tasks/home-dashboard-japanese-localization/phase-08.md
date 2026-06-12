# Phase 8 — リファクタリング（dead CSS 削除による重複・drift 削減）

> 本 Phase は `_shared-context.md`（SSOT）§1.D dead CSS 削除表・§2 不変条件を正本として参照する。

## 目的

Phase 5 で eyebrow 要素を削除したことにより、対応する CSS セレクタが**マッチ対象ゼロの dead rule** になる。
これらを同一サイクルで削除し、dead CSS（重複・navigation drift の温床）を残さない。
新規重複・新規ルールは作らない（不変条件 #5）。本 Phase はリファクタリング記録であり、
実体の編集は Phase 5 の F6 と一体（同一ファイル `legacy-public.css`）。

## 成果物

### dead CSS 削除（Before/After）
`outputs/phase-08/before-after.md` に `対象 / Before / After / 理由` テーブルを置く（本書の正本）。
削除対象は SSOT §1.D の 4 ルール:

| 対象セレクタ | 行レンジ（参考値） | 処理 | 理由 |
| --- | --- | --- | --- |
| `[data-component="call-to-action-cta"] [data-role="eyebrow"]` | 312–318 | 削除 | FOR MEMBERS eyebrow 要素削除でマッチ対象 0（dead rule） |
| `[data-component="about-ubm"] [data-role="eyebrow"]` | 887–894 | 削除 | ABOUT / THREE ZONES eyebrow 削除でマッチ対象 0 |
| `[data-component="featured-members"] [data-role="eyebrow"]` | 984–991 | 削除 | FEATURED MEMBERS eyebrow 削除でマッチ対象 0 |
| `[data-component="timeline"] [data-role="header"] [data-role="eyebrow"]` | 1020–1027 | 削除 | RECENT MEETINGS eyebrow 削除でマッチ対象 0 |
| `[data-component="hero"][data-variant="card"] [data-role="eyebrow"]` | 817–824 | **保持** | Hero は prop 経由で eyebrow を依然サポート（dead でない） |

### CTA heading 余白調整
- `[data-component="call-to-action-cta"] [data-role="heading"]`（参考行 320–323）の `margin-top: var(--ubm-space-2)` を **0** にする。
  理由: eyebrow と分離する目的だった余白が、eyebrow 削除後は copy ブロック先頭の不要な余白になるため。

> 行番号は CSS を上から削除すると後続がズレる。**セレクタ文字列で特定**して編集する（SSOT §1.D 注記）。

### 関連成果物
- `outputs/phase-08/main.md` — リファクタリング方針・新規重複を作らない方針の確認。

## 統合テスト連携

- 削除した 4 ルールが `legacy-public.css` から消えたことを grep で確認する（構造検証）。
- jsdom は CSS 非評価のため、削除後のスペーシング（見出しがカード/ヘッダー上端に揃う）は
  Phase 11 スクリーンショット（user-gated）で確認する。
- Hero eyebrow ルールが保持されていること（誤削除していないこと）を grep で確認する（回帰ガード）。

## 完了条件

- [ ] `before-after.md` に 4 削除ルール + Hero 保持 + CTA heading 余白調整が `対象/Before/After/理由` 表で記録されている
- [ ] dead rule 4 件がセレクタ文字列で特定され削除される手順が示されている
- [ ] Hero eyebrow ルール（`[data-component="hero"][data-variant="card"] [data-role="eyebrow"]`）が保持される旨が明記されている
- [ ] CTA heading の `margin-top` を 0 にする旨が記録されている
- [ ] 新規重複・新規ルールを作らない（不変条件 #5）旨が確認されている
- [ ] 色追加 0・HEX 直書き 0（CSS は削除と margin-top 値変更のみ）であることが確認されている
