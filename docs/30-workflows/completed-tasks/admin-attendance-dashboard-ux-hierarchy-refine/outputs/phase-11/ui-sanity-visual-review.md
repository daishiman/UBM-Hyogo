# Phase 11 UI Sanity / Apple HIG 視覚レビュー — admin-attendance-dashboard-ux-hierarchy-refine

> VISUAL タスク。実装・ローカル機械検証は完了し、実 capture は `pending_visual_capture`。本書は **各 canonical screenshot を照合する Apple HIG 観点のレビュー基準**を固定する。

## レビュー対象

| route | 改修 | viewport |
| --- | --- | --- |
| `/admin/dashboard/attendance` | 8 セクション flat → PRIMARY / TREND / DETAIL の 3 層リファイン | desktop + mobile |

## Apple HIG レビュー観点（実装後に screenshot で判定）

| # | HIG 原則 | 確認内容 | 対応 AC | 判定（実装後記入） |
| --- | --- | --- | --- | --- |
| H-1 | Hierarchy（階層） | 最上部 PRIMARY ヒーローが最大の視覚ウェイトを持ち、視線が最初にそこへ向かう。h1>h2>h3 の論理階層と視覚階層が一致 | AC-1 / AC-2 | TBD |
| H-2 | Focus（焦点） | 「全体出席率」と「要フォロー対象」の 2 焦点が一目で判別でき、その他は従属的に配置される | AC-1 / AC-4 | TBD |
| H-3 | Clarity（明瞭性） | 出席率の特大タイポ（`--ubm-text-3xl`）が即読可能。delta（↑/↓）の方向が色とアイコンで明確 | AC-1 | TBD |
| H-4 | Deference（控えめな装飾） | サーフェス（card/border/shadow）は内容を引き立て、過度な装飾がない。OKLch トークンのみで彩度が抑制的 | AC-5 | TBD |
| H-5 | Spacing rhythm（余白リズム） | ゾーン間・カード間の余白が 4px grid トークン（`--ubm-space-*`）で一貫。詰まり/間延びがない | AC-2 | TBD |
| H-6 | Progressive disclosure（段階的開示） | DETAIL の 3 テーブルが Segmented タブで 1 領域に統合され、初期スクロール量が削減。必要時のみ展開 | AC-3 | TBD |
| H-7 | Status communication（状態伝達） | 要フォロー 0 件 = 落ち着いたトーン、1+ 件 = warning トーンで「対応が必要」が直感的に伝わる | AC-4 | TBD |
| H-8 | Responsive integrity（応答的整合） | mobile では 3 層が 1 カラム縦積みに崩れず、タップ領域が十分。desktop で 2 カラムが破綻しない | AC-8 | TBD |
| H-9 | Accessibility（アクセシビリティ） | コントラスト WCAG 2 AA（4.5:1）、フォーカスリング可視、Segmented は radiogroup/radio で操作可能、aria-label 付与 | AC-9 | TBD |
| H-10 | Consistency（一貫性） | 既存 admin 画面（`/admin` ダッシュボード）の card/KPI/grid パターンと視覚言語が揃う。新規 primitive を生やさない | AC-6 | TBD |

## 「パッと見て何をしたいか分かるか」最終判定基準（ユーザー報告の解消確認）

実装後、`attendance-dashboard-full.png` を 3 秒見て以下が言えること:
- [ ] この支部の出席は健全か（全体出席率と推移が一目で分かる）
- [ ] 今すぐ対応すべき人がいるか（要フォロー対象の有無がトーンで分かる）
- [ ] 詳しく見たいときどこを見ればよいか（傾向は TREND、個別は DETAIL タブと導線が明確）

3 つすべてが「YES」になれば、ユーザー報告（「パッと見て何をやりたいか分からない」）は解消とみなす。

## 現段階の判定

認証済み screenshot は未取得。上記基準は Phase 11 capture 時に各 PNG と照合して埋める。
