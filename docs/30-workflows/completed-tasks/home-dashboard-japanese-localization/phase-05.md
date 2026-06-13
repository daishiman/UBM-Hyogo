# Phase 5 — 実装（ホーム画面の英語表記日本語化）

> 本 Phase は `_shared-context.md`（SSOT）§1 マッピング・§3 変更ファイル一覧・§2 不変条件を正本として参照する。
> 行番号・文言・方針はすべて SSOT を引用し、本書では逸脱しない。

## 目的

公開トップ `/`（`apps/web/app/(public)/page.tsx` が構成する 6 セクション）で英語表記になっている項目を、
非エンジニアの会員にも直感的にわかる日本語へ整える。具体的には次の 3 系統を一括で実装する。

1. **統計カード 4 ラベルの日本語化**（SSOT §1.A）と**同期バッジ文言の置換**（SSOT §1.B）。
2. **英語 overline（eyebrow）6 箇所の要素ごと削除**（SSOT §1.C）。直下に日本語見出しがあり意味が重複するため。
3. **dead CSS（eyebrow ルール 4 件）の削除と CTA heading の余白調整**（SSOT §1.D）。

ホバー等のギミックは導入しない（ユーザー明示）。文字列置換・要素削除・CSS 削除のみで、
新規 component / 新規 primitive は作らない（不変条件 #5）。

## 成果物

実装対象は SSOT §3 の **実装 6 ファイル（すべて「編集」）**。新規作成ファイルは無い。

### 新規作成ファイル
- なし（不変条件 #5: 新規 component 0 / 新規 primitive 0）。

### 修正ファイル（F1–F6・すべて編集）
| # | パス | 変更概要 |
| --- | --- | --- |
| F1 | `apps/web/app/(public)/page.tsx` | Hero `eyebrow` prop 削除（C-1）+ FEATURED MEMBERS overline 削除（C-2） |
| F2 | `apps/web/src/components/public/Stats.tsx` | ラベル 4 件日本語化（A）+ 同期バッジ文言（B） |
| F3 | `apps/web/src/components/public/AboutUbm.tsx` | ABOUT / THREE ZONES overline 削除（C-3, C-4） |
| F4 | `apps/web/src/components/public/Timeline.tsx` | RECENT MEETINGS overline 削除（C-5） |
| F5 | `apps/web/src/components/public/CallToActionCTA.tsx` | FOR MEMBERS overline 削除（C-6） |
| F6 | `apps/web/src/styles/legacy-public.css` | dead eyebrow ルール 4 件削除 + CTA heading margin-top 調整（D） |

> 1 ファイルずつの具体的編集手順（探す文字列・置換後・注意点）は `outputs/phase-05/edit-runbook.md` を正本とする。
> 後続実装者は edit-runbook.md をそのまま着手単位として使用する。

### 関連成果物
- `outputs/phase-05/main.md` — 実装方針・編集サマリ・順序。
- `outputs/phase-05/edit-runbook.md` — F1–F6 の 1 ファイルずつの編集手順。

## 統合テスト連携

- 本 Phase で変更する DOM contract は **eyebrow 要素の削除**と**ラベル文字列の置換**のみ（不変条件 #3）。
  `data-component` / `data-stat` / `data-role`（eyebrow を除く）/ `aria-*` / `role` / `id`（`stats-heading` 等）/ href / testid は不変。
- テスト更新（T1–T4）は Phase 6 で実施する。本 Phase の編集後、Phase 6 の focused vitest（SSOT §4 のコマンド）で
  新文言・eyebrow 不在が assert される。
- 英語残存 grep（SSOT §4-4）と API 非接触 grep（SSOT §4-5）は Phase 6 の回帰ガードとして連携する。
- jsdom は CSS を評価しないため、F6（CSS 削除）はコンポーネントテストでは構造検証されない。視覚崩れは Phase 11 スクリーンショット（user-gated）で確認する。

## 完了条件

- [ ] F1: `page.tsx` の `<Hero>` から `eyebrow` prop 行を削除し、FEATURED MEMBERS の `<p data-role="eyebrow">` 行を要素ごと削除した
- [ ] F2: `Stats.tsx` の 4 ラベル（Members/Zones/Meetings / yr/Last sync）を日本語（公開メンバー/事業フェーズ/年間の支部会/最終データ更新）に置換し、同期バッジ「Forms 同期中」を「自動で最新化」に置換した
- [ ] F3: `AboutUbm.tsx` の ABOUT / THREE ZONES の `<p data-role="eyebrow">` 行を 2 件とも要素ごと削除した
- [ ] F4: `Timeline.tsx` の RECENT MEETINGS の `<p data-role="eyebrow">` 行を要素ごと削除した
- [ ] F5: `CallToActionCTA.tsx` の FOR MEMBERS の `<p data-role="eyebrow">` 行を要素ごと削除した
- [ ] F6: `legacy-public.css` の dead eyebrow ルール 4 件（call-to-action-cta / about-ubm / featured-members / timeline）をセレクタ文字列で特定して削除し、CTA heading の `margin-top` を 0 にした。Hero eyebrow ルールは保持した
- [ ] `data-role="value"` / `data-role="sub"` / `data-role="dot"` のテキスト・要素は不変（SSOT §1.A/B 注記）
- [ ] `git diff dev -- apps/api packages/shared` が空（apps/web 内のみ・不変条件 #1）
- [ ] 新規 component / 新規 primitive を追加していない（不変条件 #5）
