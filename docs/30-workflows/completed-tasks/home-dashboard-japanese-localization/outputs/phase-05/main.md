# Phase 5 outputs — 実装方針・編集サマリ

> SSOT: `../../_shared-context.md`。文言・行番号・方針はすべて SSOT を引用する。

## 実装方針

ホーム画面 `/` の英語表記を日本語化する。範囲は次の 3 系統に閉じる。

1. **統計カードラベル日本語化 + 同期バッジ文言**（F2 = `Stats.tsx`）
2. **英語 overline（eyebrow）6 箇所の要素ごと削除**（F1 page.tsx の 2 箇所 + F3 AboutUbm の 2 箇所 + F4 Timeline + F5 CallToActionCTA）
3. **dead CSS 削除 + CTA heading 余白調整**（F6 = `legacy-public.css`）

すべて apps/web 内のみ（不変条件 #1）。データ取得 endpoint・props 契約・shared 型は不変（不変条件 #2）。
DOM contract は eyebrow 要素削除とラベル文字列置換のみ変更（不変条件 #3）。新規 component / primitive は作らない（不変条件 #5）。

## 編集サマリ（F1–F6）

| F | ファイル | 変更内容 | 種別 |
| --- | --- | --- | --- |
| F1 | `apps/web/app/(public)/page.tsx` | `<Hero>` の `eyebrow="UBM HYOGO · CHAPTER SITE"` prop 行を削除（C-1）/ `<p data-role="eyebrow">FEATURED MEMBERS</p>` 行を要素ごと削除（C-2） | 編集 |
| F2 | `apps/web/src/components/public/Stats.tsx` | label×4 を日本語化（A）/ 同期バッジ「Forms 同期中」→「自動で最新化」（B） | 編集 |
| F3 | `apps/web/src/components/public/AboutUbm.tsx` | `<p data-role="eyebrow">ABOUT</p>`（C-3）/ `<p data-role="eyebrow">THREE ZONES</p>`（C-4）を要素ごと削除 | 編集 |
| F4 | `apps/web/src/components/public/Timeline.tsx` | `<p data-role="eyebrow">RECENT MEETINGS</p>`（C-5）を要素ごと削除 | 編集 |
| F5 | `apps/web/src/components/public/CallToActionCTA.tsx` | `<p data-role="eyebrow">FOR MEMBERS</p>`（C-6）を要素ごと削除 | 編集 |
| F6 | `apps/web/src/styles/legacy-public.css` | dead eyebrow ルール 4 件削除 + CTA heading margin-top→0（D）。Hero eyebrow ルールは保持 | 編集 |

## 推奨編集順序

1. **F2（Stats.tsx）** — 文字列置換のみで独立。最初に着手して効果を確認しやすい。
2. **F1, F3, F4, F5（eyebrow 削除）** — JSX 要素削除。互いに独立。まとめて実施。
3. **F6（legacy-public.css）** — eyebrow 削除後に dead 化する CSS を削除。F1/F3/F4/F5 完了後に実施するとマッチ対象 0 を確認しやすい。
4. テスト更新（T1–T4）は Phase 6 で実施。

## 注意点（全 F 共通）

- `data-role="value"` / `data-role="sub"` / `data-role="dot"` は不変（テキスト・要素とも触らない）。
- `Hero` 本体（`Hero.tsx`）は eyebrow prop を残す。`page.tsx` が prop を渡さないだけで Hero は条件描画（`eyebrow ? ... : null`）で eyebrow を出さない。Hero.tsx は編集しない。
- F6 は行番号でなくセレクタ文字列で特定する（CSS を上から削ると後続行がズレるため）。

> 1 ファイルずつの具体手順は `edit-runbook.md` を参照。
