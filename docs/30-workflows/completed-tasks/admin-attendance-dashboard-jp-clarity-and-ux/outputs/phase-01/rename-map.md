# Phase 1 — 用語リネーム正本表（R / S / J / U ＋ 影響先列）

> `_shared-context.md` §2 を転記し、各行に「影響先（画面テキスト / aria-label / テスト T-NN）」列を追加した。
> これを Phase 5 実装の唯一の正とする（逐語の最終正本は Phase 2 `change-map.md` の行アンカー付き版）。
> 「記号（↑↓→ / #）」「`ZONE_LABEL`（0 回（未出席）等）」「`MemberAttendanceTable` / `AttendanceDrilldownModal` の文言」は変更しない。

---

## A. 英語表記 → 日本語（完全置換・Q1）

| # | ファイル | Before | After | 影響先 |
| --- | --- | --- | --- | --- |
| R-01 | `page.tsx` | `ADMIN / DASHBOARD`（`AdminPageHeader` eyebrow） | `管理 / ダッシュボード` | 画面テキスト |
| R-02 | `AttendanceAnalyticsPage.tsx` | `PRIMARY`（h2） | `全体の状況` | 画面テキスト |
| R-03 | 〃 | `TREND`（h2） | `出席の移り変わり` | 画面テキスト |
| R-04 | 〃 | `DETAIL`（h2） | `くわしい一覧` | 画面テキスト |
| R-05 | 〃 | `出席トレンド`（h3） | `月ごとの出席の移り変わり` | 画面テキスト |
| R-06 | 〃 | `出席回数帯別分布`（h3） | `出席回数べつの人数` | 画面テキスト |
| R-07 | `AttendanceDetailTabs.tsx` | `TOP10`（DETAIL_OPTIONS label） | `出席が多い順` | 画面テキスト / aria-label / **テスト T-02** |
| R-08 | 〃 | `出席ランキング TOP 10`（top10 sectionLabel） | `出席が多い人の一覧` | 画面テキスト / **テスト T-04** |
| R-09 | `AttendanceFilterBar.tsx` | `CSVエクスポート`（export link） | `表計算ファイルで書き出す` | 画面テキスト |
| R-10 | `lib/format-attendance.ts` | `3M` / `6M` / `1Y`（PERIOD_PRESETS.label） | `3か月` / `6か月` / `1年` | 画面テキスト（ボタン） |

> `全期間` / `今月` は既に日本語のため変更しない。

---

## B. 「セッション」→「開催回」へ統一（Q2）

| # | ファイル | Before | After | 影響先 |
| --- | --- | --- | --- | --- |
| S-01 | `KpiPanel.tsx` | `セッション数`（label） | `開催回数` | 画面テキスト / **回帰テスト（KpiPanel）** |
| S-02 | `KpiPanel.tsx` | `1 セッションあたり`（hint） | `1回の開催あたり` | 画面テキスト |
| S-03 | `KpiPanel.tsx` | `期間内の開催数`（hint・微修正） | `この期間の開催回数` | 画面テキスト |
| S-04 | `AttendanceAbsenteeAlert.tsx` | `直近 {N} セッション連続欠席`（summary） | `直近 {N} 回つづけて欠席` | 画面テキスト |
| S-05 | 〃 | `直近 {N} セッション連続欠席のメンバーはいません`（empty） | `直近 {N} 回つづけて欠席している人はいません` | 画面テキスト |
| S-06 | `AttendanceDetailTabs.tsx` | `セッション別`（DETAIL_OPTIONS label） | `開催回ごと` | 画面テキスト / aria-label |
| S-07 | 〃 | `セッション別出席状況`（session sectionLabel） | `開催回ごとの出席状況` | 画面テキスト / **テスト T-03** |
| S-08 | `SessionAttendanceTable.tsx` | `セッションデータがありません`（empty） | `開催回のデータがありません` | 画面テキスト |
| S-09 | `AttendanceTrendChart.tsx` | `... {sessionCount} セッション`（`<title>`） | `... 開催 {sessionCount} 回` | SVG `<title>`（ツールチップ） |
| S-10 | `AttendanceAnalyticsPage.tsx` | `月別の延べ出席数と開催セッション数の変化を確認します。`（intro） | `月ごとの延べ出席数と開催回数の変化を確認します。` | 画面テキスト |

---

## C. その他のエンジニア専門語の平易化（Q2/Q3 + ユーザー追補）

| # | ファイル | Before | After | 影響先 |
| --- | --- | --- | --- | --- |
| J-01 | `AttendanceTrendChart.tsx` | aria-label `出席トレンド` / empty `トレンドデータがありません` | `出席の移り変わり` / `推移データがありません` | aria-label / 画面テキスト |
| J-02 | `AttendanceAnalyticsPage.tsx` | TREND intro `月別推移と参加回数帯から、参加の偏りを確認します。` | `月ごとの移り変わりと出席回数のはばから、参加のかたよりを確認します。` | 画面テキスト |
| J-03 | `KpiPanel.tsx` | `ユニーク出席率 {x}%`（support） | `一度でも参加した人の割合 {x}%` | 画面テキスト / **回帰テスト（KpiPanel）** |
| J-04 | `KpiPanel.tsx` | aria-label `出席KPI補助指標` | `出席のおもな指標` | aria-label（SR 文言） |
| J-05 | `AttendanceAnalyticsPage.tsx` | `AdminSectionErrorClient sectionLabel="出席KPI"` | `sectionLabel="出席のおもな指標"` | error degrade 文言 |
| J-06 | `KpiPanel.tsx` | hint `前期間比 {delta}` | `前の期間とくらべて {delta}` | 画面テキスト |
| J-07 | `lib/format-attendance.ts` | `formatDelta` 単位 `pt` | `ポイント`（例 `↑1.2pt`→`↑1.2ポイント`・記号維持） | 画面テキスト（KPI hint）/ **回帰テスト（format-attendance）** |
| J-08 | `AttendanceZoneDistributionChart.tsx` | empty `区画別分布データがありません` | `出席回数べつのデータがありません` | 画面テキスト |
| J-09 | 〃 | aria-label `出席回数帯別分布` | `出席回数べつの人数` | aria-label / **テスト T-01・T-05** |
| J-10 | `AttendanceFilterBar.tsx` | `<legend>出席回数帯</legend>` | `累計の出席回数` | 画面テキスト |
| J-11 | `lib/format-attendance.ts` | `ZONE_HELP`（`出席回数帯は、各メンバーの累計出席回数を…`） | `各メンバーがこれまでに参加した合計回数を、0回／1〜9回／10〜99回／100回以上に分けて表示しています。` | 画面テキスト / **テスト T-06（前方一致）** |
| J-12 | `KpiPanel.tsx` | hint `セッション別出席者数の合計`（延べ出席数）／ label `期間内延べ出席数` | hint `開催回ごとの出席者数を合計した数`／ label `期間内の出席のべ人数`（任意・Phase 5 判断） | 画面テキスト |

> `ZONE_LABEL` は既に平易のため変更しない。`AttendanceDrilldownModal` の文言も変更不要（Phase 1 再確認のみ）。

---

## D. UI/UX 見やすさ微調整（Q3・新規 primitive なし）

| # | 対象 | 調整内容 | 影響先 | 制約 |
| --- | --- | --- | --- | --- |
| U-01 | `AttendanceAbsenteeAlert.tsx` の各行（`<li>` / empty `<div>`） | displayName 空（メールのみ）行でも「会員名／メール → 出席回数帯 → 欠席◯回 → 最終出席」の役割が読み取れるよう既存 span を保ち、`globals.css` の `.attendance-absentee-alert li` の行間・区切りを軽微調整 | CSS（視覚）/ DOM 構造は不変 | `<li>` 内 span 数・順序・testid 不変。新規要素追加は最小 |
| U-02 | 区画見出し（全体の状況 / 出席の移り変わり / くわしい一覧） | 既存 `.attendance-section-intro`（1 行説明）を維持し、見出し直下の日本語説明文が意味を補う状態を保つ（R-02〜R-04 と整合） | 既存構造流用 | 新規 primitive なし |
| U-03 | `globals.css` の `.attendance-*` 系 | 長い文言（`表計算ファイルで書き出す` 等）で折返し / はみ出しが起きないよう `white-space` / `gap` / `flex-wrap` を軽微調整（必要時のみ） | CSS（視覚） | 色は `var(--ubm-color-*)` のみ・HEX 禁止（AC-5）・トークンは `tokens.css` 実在値のみ |

> Q3 は「ラベル平易化＋見やすさ微調整」。レイアウトの大規模再設計はスコープ外。3 ゾーン骨格は維持し、文言と軽微リズムのみ調整する。
