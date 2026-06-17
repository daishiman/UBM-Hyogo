# Phase 2 — 設計

> 正本: [`_shared-context.md`](./_shared-context.md)。設計判断はすべて SSOT §1（マッピング）/ §2（不変条件）/ §3（変更ファイル）に整合させる。
> 状態: **implemented_local_evidence_captured**

## 目的

Phase 1 で確定した要件を、**新規 component を生やさず既存コンポーネントの編集のみ**で実現する設計に落とし込む。具体的には (1) 統計ラベル/同期バッジの文字列置換、(2) eyebrow 要素の削除方式（Hero のみ prop 非伝播・他は要素削除）、(3) eyebrow 削除に伴う dead CSS 削除と CTA 見出し上端余白の調整、を DOM contract 保持の制約下で設計する。各変更の「入力・出力・副作用」を [`outputs/phase-02/localization-map.md`](./outputs/phase-02/localization-map.md) に明文化する。

## 実行タスク

1. **既存コンポーネント再利用可否の確認**:
   - 新規 component **0** / 新規 primitive **0**（SSOT §2-5）。`Stats` / `AboutUbm` / `Timeline` / `CallToActionCTA` / `Hero` を**編集のみ**で完結する。
   - これらは `app/(public)/page.tsx`（ホーム）からのみ利用（SSOT §2-7・grep 確認済み）。eyebrow 削除は他画面へ波及しない。
2. **A. 統計ラベル設計**（`Stats.tsx`・SSOT §1A）: `data-role="label"` のテキストノードのみ置換。`Members→公開メンバー`（44 行）/ `Zones→事業フェーズ`（49 行）/ `Meetings / yr→年間の支部会`（54 行）/ `Last sync→最終データ更新`（59 行）。`data-role="value"` / `data-role="sub"` は不変。
3. **B. 同期バッジ設計**（`Stats.tsx:64`・SSOT §1B）: `data-role="badge-sync"` 内のテキスト `Forms 同期中 → 自動で最新化`。`data-role="dot"`（点滅ドット）は不変・テキストノードのみ差し替える。
4. **C. eyebrow 削除設計**（6 箇所・SSOT §1C）:
   - **C-1（Hero, page.tsx:75）= 方式 C-1**: `<Hero>` から `eyebrow` prop を**渡さないだけ**。`Hero` 本体は `eyebrow ? <p data-role="eyebrow">{eyebrow}</p> : null`（Hero.tsx:48）の条件描画を保持し、汎用コンポーネントとして eyebrow prop をサポートし続ける（既存 `Hero.component.spec.tsx` 互換）。
   - **C-2..C-6 = 要素削除**: `page.tsx:94`（FEATURED MEMBERS）/ `AboutUbm.tsx:50,56`（ABOUT, THREE ZONES）/ `Timeline.tsx:51`（RECENT MEETINGS）/ `CallToActionCTA.tsx:24`（FOR MEMBERS）の `<p data-role="eyebrow">…</p>` を要素ごと削除し、直下の日本語見出しのみ残す。
5. **D. dead CSS 削除設計**（`legacy-public.css`・SSOT §1D）:
   - 削除: `[data-component="call-to-action-cta"] [data-role="eyebrow"]`（312–318）/ `[data-component="about-ubm"] [data-role="eyebrow"]`（887–894）/ `[data-component="featured-members"] [data-role="eyebrow"]`（984–991）/ `[data-component="timeline"] [data-role="header"] [data-role="eyebrow"]`（1020–1027）。
   - **保持**: `[data-component="hero"][data-variant="card"] [data-role="eyebrow"]`（817–824）— Hero は prop 経由で eyebrow を依然サポートするため。
   - **CTA 見出し余白調整**: CTA `[data-role="heading"]`（320–323）の `margin-top: var(--ubm-space-2)` は eyebrow との分離目的だった。eyebrow 削除後は copy 先頭の余白になるため `margin-top` を **0** にする（または Phase 11 で余白が出ないことを確認）。
   - **行番号は参考値**。CSS を上から削除すると後続行がズレるため、**セレクタ文字列で特定**して編集する。
6. **DOM contract 保持の確認**（SSOT §2-3）: 変更するのは「eyebrow 要素の削除」と「ラベル文字列置換」のみ。`data-component` / `data-stat` / `data-role`（**eyebrow 除く**）/ `aria-*` / `role` / `id`（`stats-heading` 等）/ href / testid は不変。
7. **localization-map.md 作成**: SSOT §1 の完全な対応表（旧→新・ファイル:行）を再掲し、各変更の入力・出力・副作用を記述する。

## 成果物

- [`outputs/phase-02/main.md`](./outputs/phase-02/main.md) — 設計本体（再利用可否・削除方式 C-1/D・DOM contract 保持）
- [`outputs/phase-02/localization-map.md`](./outputs/phase-02/localization-map.md) — SSOT §1 完全対応表（旧→新・ファイル:行）+ 各変更の入力/出力/副作用

## 参照資料

- [`_shared-context.md`](./_shared-context.md) — §1（A/B/C/D 表）/ §2（不変条件 1–7）/ §3（F1–F6・T1–T4）
- `apps/web/src/components/public/Hero.tsx:48` — eyebrow 条件描画（prop 非伝播方式 C-1 の根拠）
- `apps/web/src/styles/legacy-public.css` — eyebrow CSS ルール（削除4 / 保持1）+ CTA heading margin-top（320–323）

## 統合テスト連携

- 設計は**静的レンダリング DOM**のみを対象とし、API 統合点を追加しない（`apps/api` diff 空・SSOT §2-1）。
- eyebrow 削除と CSS 削除は **既存 component spec の assertion に直接影響**するため、Phase 4 のテスト更新（T1–T4）と整合させる（特に「eyebrow 不在」assertion・SSOT §1E）。
- `app/(public)/page.spec.tsx` は全セクション stub 済・FEATURED MEMBERS overline は未 assert のため変更不要（SSOT §1E）。`Hero.component.spec.tsx` は optional eyebrow contract を維持しつつ、サンプル文言を日本語へ更新する。

## 完了条件

- [ ] 新規 component 0 / 新規 primitive 0 で、既存 5 コンポーネント編集のみで完結する設計であることを確認した
- [ ] A（ラベル4件）/ B（同期バッジ）の文字列置換を `data-role` 単位で設計した
- [ ] C-1（Hero prop 非伝播）と C-2..C-6（要素削除）の方式差を明記した
- [ ] D（dead CSS 削除4・保持1・CTA heading margin-top 0 調整・セレクタ文字列特定）を設計した
- [ ] DOM contract（eyebrow 除く data-role / data-stat / data-component / aria / role / id / href / testid）保持を確認した
- [ ] localization-map.md に旧→新対応表と各変更の入力/出力/副作用を記述した
