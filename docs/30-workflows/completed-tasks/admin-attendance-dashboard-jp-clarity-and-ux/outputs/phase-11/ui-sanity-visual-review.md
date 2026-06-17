# Phase 11 UI Sanity / 視覚レビュー — admin-attendance-dashboard-jp-clarity-and-ux

## VISUAL 宣言

- **タスク種別 = VISUAL**。対象は出席ダッシュボード `/admin/dashboard/attendance` の表現層（英語表記・専門語の日本語化 + 軽微 UX 調整）。
- 6 canonical PNG capture は local Playwright admin fixture で取得済み。staging baseline capture は **user-gated**（staging deploy + admin 認証 + user 承認後）。本書は local implementation 後のレビュー基準を固定し、実 PNG との照合に使う。
- 6 canonical screenshot（`screenshot-plan.json` / `phase11-capture-metadata.json` と一致）を Apple HIG / 文言分かりやすさ観点で照合する基準を定義する。

## レビュー対象

| route | 改修 | viewport |
| --- | --- | --- |
| `/admin/dashboard/attendance` | 英語見出し → 日本語 / 専門語 → 平易日本語 / 要フォロー行・長い文言の軽微調整（3 ゾーン構造は維持） | desktop + mobile |

## 6 screenshot の意図と AC 対応

| # | canonical 名 | 意図（何を見せるか） | 対応 AC |
| --- | --- | --- | --- |
| ① | `attendance-dashboard-full-jp.png` | 3 ゾーン全体が日本語見出し（全体の状況 / 出席の移り変わり / くわしい一覧）で表示される after 状態。英語見出しが消えていること | AC-1 / AC-2 / AC-3 / AC-4 |
| ② | `attendance-overview-zone-jp.png` | 「全体の状況」ゾーンの KPI（全体出席率 / 前の期間とくらべて / 一度でも参加した人の割合 / 開催回数）と要フォロー対象が日本語表示。「セッション」「ユニーク」「KPI」消失 | AC-1 / AC-2 / AC-3 |
| ③ | `attendance-trend-zone-jp.png` | 「出席の移り変わり」ゾーン（月ごとの移り変わり + 出席回数べつの人数）が日本語表示。「トレンド」「区画」「帯」消失 | AC-1 / AC-3 |
| ④ | `attendance-detail-tabs-jp.png` | 「くわしい一覧」タブ（開催回ごと / 会員別 / 出席が多い順）が日本語ラベルで切替表示。「セッション別」「TOP10」消失・role/aria キー不変 | AC-1 / AC-2 |
| ⑤ | `attendance-filter-bar-jp.png` | フィルタ（期間: 全期間/今月/3か月/6か月/1年・累計の出席回数・表計算ファイルで書き出す）が日本語表示。「3M/6M/1Y」「CSVエクスポート」消失 | AC-1 / AC-3 |
| ⑥ | `attendance-dashboard-mobile-jp.png` | モバイル幅・3 ゾーンが 1 カラム縦積みで日本語表示が成立・長い文言がはみ出さない | AC-4 |

## Apple HIG / 文言分かりやすさ レビュー観点（実 capture で判定）

| # | 原則 | 確認内容 | 対応 AC | 判定（実 capture 後記入） |
| --- | --- | --- | --- | --- |
| H-1 | Clarity（明瞭性） | 見出し・ラベル・補助文が平易な日本語で、非エンジニアが意味に詰まらない | AC-1 / AC-3 | TBD |
| H-2 | Consistency（一貫性） | 同一概念（開催回 / 出席の移り変わり / 出席回数べつ）が画面内で 1 表現に統一されている | AC-1 / AC-2 | TBD |
| H-3 | Hierarchy（階層） | h1>h2>h3 の論理階層が日本語見出しで維持され、3 ゾーンの優先順位が読み取れる | AC-1 | TBD |
| H-4 | Deference（控えめな装飾） | サーフェスは内容を引き立て、OKLch トークンのみで彩度が抑制的（HEX 0） | AC-5 | TBD |
| H-5 | Spacing rhythm（余白リズム） | 文言が長くなった箇所でも余白が `--ubm-space-*` で一貫し、はみ出し / 詰まりがない | AC-4 | TBD |
| H-6 | Status communication（状態伝達） | 要フォロー対象の有無が日本語＋トーンで直感的に伝わる | AC-4 | TBD |
| H-7 | Responsive integrity（応答的整合） | mobile で 3 ゾーンが 1 カラム縦積みに崩れず、日本語が折返しても読みやすい | AC-4 | TBD |
| H-8 | Accessibility（アクセシビリティ） | aria-label の**値**が日本語化されても属性キー・役割が維持され、Segmented が radiogroup/radio で操作可能 | AC-8 | TBD |
| H-9 | Function preservation（機能温存） | フィルタ / タブ切替 / 書き出しリンク / modal が日本語ラベルのまま挙動不変 | AC-10 | TBD |

## 「パッと見て読めるか」最終判定基準（ユーザー報告の解消確認）

実装後、`attendance-dashboard-full-jp.png` を 3 秒見て以下が言えること:
- [ ] 何の数字か日本語で分かる（英語見出し・専門語に詰まらない）
- [ ] 全体の出席状況と「対応が必要な人がいるか」が読み取れる
- [ ] 詳しく見たいときどこを見ればよいか（傾向 / 個別の導線）が日本語で分かる

3 つすべてが「YES」になれば、ユーザー報告（「英語表記は非エンジニアに直感的に理解できない」）は解消とみなす。

## 現段階の判定

6 canonical PNG は local Playwright admin fixture で取得済み。authenticated staging baseline は user-gated のため未取得。
