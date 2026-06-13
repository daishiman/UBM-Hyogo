# Phase 7 outputs — カバレッジ確認の詳細

> SSOT: `../../_shared-context.md` §3 / §4。

## カバレッジ方針（変更範囲限定）

本タスクは文字列置換・要素削除・CSS 削除中心の小規模変更のため、グローバル coverage gate（80%）を
新規に揺らさない。focused vitest（SSOT §4-1）で**変更したコンポーネントの line/branch 到達**を確認する。

| 対象 | テスト | カバレッジ観点 |
| --- | --- | --- |
| `Stats.tsx` | T1（Stats.component.spec） | label×4 日本語 + badge-sync 文言の到達 |
| `AboutUbm.tsx` | T2（AboutUbm.component.spec） | eyebrow 0 件 + section-heading 日本語の到達 |
| `Timeline.tsx` | T3（Timeline.component.spec） | eyebrow 不在 + header section-heading の到達 |
| `CallToActionCTA.tsx` | T4（CallToActionCTA.component.spec） | eyebrow 不在の到達 |
| `app/(public)/page.tsx` | page.spec（stub） | FEATURED MEMBERS overline 削除 / Hero prop 非渡しを間接確認 |
| `legacy-public.css` | （なし） | **CSS = jsdom 非評価 = 構造検証限定**（Phase 11 で補完） |

## jsdom の制約（明記）

- jsdom は CSS を**評価しない**（computed style を実レンダリングしない）。
- そのため F6（CSS 削除・margin-top 0）は **コンポーネントテストでは視覚的に検証できない**。
- F6 の妥当性は次の二段で担保する:
  1. **構造検証**: dead rule が `legacy-public.css` から削除されたことを grep 確認（AC-4）。
  2. **視覚証跡**: eyebrow 削除後の見出し上端余白を Phase 11 スクリーンショット（user-gated）で確認。

## AC と検証手段の対応（要約）

詳細は `ac-matrix.md`。AC-1/2/3/5 はコンポーネントテスト、AC-4 は構造 grep + Phase 11、
AC-6 は英語残存 grep、AC-7 は api diff、AC-8 は `verify-design-tokens` で検証する。
