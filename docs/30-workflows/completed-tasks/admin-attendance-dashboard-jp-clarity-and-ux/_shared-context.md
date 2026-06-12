# 共有コンテキスト — admin-attendance-dashboard-jp-clarity-and-ux

> このファイルは SubAgent 全員が最初に読む共有正本。調査結果・方針・受入条件・**用語リネーム正本表**を集約する。
> 仕様書本文（phase-NN.md / outputs/phase-N/*.md）はここを根拠に書く。

---

## 0. 実装区分

`[実装区分: 実装完了]` — コード変更を伴う（VISUAL タスク・CONST_004 デフォルト）。

判定根拠: ユーザー報告は「出席ダッシュボードの英語表記は非エンジニアの会員には直感的に理解できない。より直感的に分かる日本語にしてほしい。あわせて UI/UX として見にくい部分を操作しやすく整えてほしい。エンジニア的な専門用語は使わずに表現してほしい」。目的達成には `apps/web` の出席ダッシュボード表現層（文言の日本語化・専門用語の平易化・軽微な見やすさ調整）のコード変更が必須。ドキュメントだけでは「英語表記」「見にくさ」は解消できないため、本サイクルで apps/web 実装・focused Vitest・token gate・Phase 12 validator・workflow inventory sync まで完了した。commit / PR / authenticated staging capture のみ user-gated。

---

## 1. 真の論点（要件レビュー思考法の一次結論）

| 観点 | 結論 |
| --- | --- |
| **真の主問題** | 機能不足ではない。**画面の見出し・ラベル・補助文に英語表記（PRIMARY / TREND / DETAIL / ADMIN / DASHBOARD / TOP10 / 3M / 6M / 1Y / CSV）とエンジニア寄りの日本語専門語（セッション / トレンド / ユニーク出席率 / 区画 / KPI / pt）が混在し、非エンジニアの会員・管理者が「何の数字か・どう読むか」を直感的に把握できない**。情報そのものは十分。表現（言葉）が伝わっていない。 |
| **依存関係・責務境界** | データは API から十分に返っており不足なし。問題は **UI 表現層（apps/web）の文言と軽微なレイアウトのみ**。API / D1 / Google Form schema / `packages/shared` 型は無罪。責務は `apps/web/src/features/admin/attendance/` 配下 + 同 route の `page.tsx` + `globals.css` の軽微調整に閉じる。 |
| **価値とコストの不均衡** | 現状は専門用語を読み解くコストを会員に転嫁している。改善価値は「日本語で迷わず読める」こと。コストは文字列置換中心で小さく、回帰リスクは低い（既存テスト/Playwright の文字列追従が主）。 |
| **改善優先順位** | ①英語見出し・ラベルの日本語化 → ②エンジニア専門語の平易化（セッション→開催回など）→ ③見にくい箇所の軽微なUX調整（要フォロー対象の行の読みやすさ・区画見出しの補助）。新規 primitive は作らない。 |
| **4条件** | 価値性◯（会員/管理者の読解コスト低減が定義済み）/ 実現性◯（文字列置換 + 軽微 CSS + テスト追従で 1 サイクル完了）/ 整合性◯（責務は web 表現層に閉じ invariant 違反なし・testid/href/DOM 構造不変）/ 運用性◯（既存 vitest + Playwright + `verify-design-tokens` で回帰保護）。 |

---

## 2. 用語リネーム正本表（このタスクの核 — 全 SubAgent はこの表を逐語の正とする）

> ユーザー確定（AskUserQuestion 4 問・全て推奨案）:
> - **Q1 英語見出し**: 完全に日本語へ置換（英語は残さない）
> - **Q2「セッション」**: 「開催回」へ統一
> - **Q3 UI/UX 改善範囲**: ラベル平易化 ＋ 見やすさ微調整（新規 primitive は作らない）
> - **Q4「CSVエクスポート」**: 「表計算ファイルで書き出す」へ

### 2-A. 英語表記 → 日本語（完全置換・Q1）

| # | ファイル | 現在地（行は実装時に再確認） | Before | After |
| --- | --- | --- | --- | --- |
| R-01 | `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` | `AdminPageHeader` の `eyebrow` | `ADMIN / DASHBOARD` | `管理 / ダッシュボード` |
| R-02 | `apps/web/src/features/admin/attendance/components/AttendanceAnalyticsPage.tsx` | PRIMARY ゾーン `<h2>` | `PRIMARY` | `全体の状況` |
| R-03 | 〃 | TREND ゾーン `<h2>` | `TREND` | `出席の移り変わり` |
| R-04 | 〃 | DETAIL ゾーン `<h2>` | `DETAIL` | `くわしい一覧` |
| R-05 | 〃 | TREND 内 `<h3>` | `出席トレンド` | `月ごとの出席の移り変わり` |
| R-06 | 〃 | TREND 内 `<h3>` | `出席回数帯別分布` | `出席回数べつの人数` |
| R-07 | `AttendanceDetailTabs.tsx` | `DETAIL_OPTIONS` ラベル | `TOP10` | `出席が多い順` |
| R-08 | 〃 | `top10` タブ `sectionLabel` | `出席ランキング TOP 10` | `出席が多い人の一覧` |
| R-09 | `AttendanceFilterBar.tsx` | エクスポートリンク文言 | `CSVエクスポート` | `表計算ファイルで書き出す` |
| R-10 | `lib/format-attendance.ts` | `PERIOD_PRESETS[].label` | `3M` / `6M` / `1Y` | `3か月` / `6か月` / `1年` |

> 補足: `全期間` / `今月`（PERIOD_PRESETS）は既に日本語のため変更しない。

### 2-B.「セッション」→「開催回」へ統一（Q2）

| # | ファイル | Before | After |
| --- | --- | --- | --- |
| S-01 | `KpiPanel.tsx` | `セッション数`（Metric label） | `開催回数` |
| S-02 | `KpiPanel.tsx` | `1 セッションあたり`（平均出席数 hint） | `1回の開催あたり` |
| S-03 | `KpiPanel.tsx` | `期間内の開催数`（セッション数 hint・既に開催ベース） | `この期間の開催回数`（微修正・任意） |
| S-04 | `AttendanceAbsenteeAlert.tsx` | `直近 {N} セッション連続欠席`（summary） | `直近 {N} 回つづけて欠席` |
| S-05 | `AttendanceAbsenteeAlert.tsx` | `直近 {N} セッション連続欠席のメンバーはいません`（empty） | `直近 {N} 回つづけて欠席している人はいません` |
| S-06 | `AttendanceDetailTabs.tsx` | `セッション別`（DETAIL_OPTIONS label） | `開催回ごと` |
| S-07 | `AttendanceDetailTabs.tsx` | `セッション別出席状況`（session タブ sectionLabel） | `開催回ごとの出席状況` |
| S-08 | `SessionAttendanceTable.tsx` | `セッションデータがありません`（empty） | `開催回のデータがありません` |
| S-09 | `AttendanceTrendChart.tsx` | `<title>` の `... {sessionCount} セッション` | `... 開催 {sessionCount} 回` |
| S-10 | `AttendanceAnalyticsPage.tsx` | TREND 内 intro `月別の延べ出席数と開催セッション数の変化を確認します。` | `月ごとの延べ出席数と開催回数の変化を確認します。` |

### 2-C. その他のエンジニア専門語の平易化（Q2/Q3 + ユーザー追補「専門用語を使わずに」）

| # | ファイル | Before | After | 備考 |
| --- | --- | --- | --- | --- |
| J-01 | `AttendanceTrendChart.tsx` | aria-label `出席トレンド` / empty `トレンドデータがありません` | `出席の移り変わり` / `推移データがありません` | カタカナ「トレンド」除去 |
| J-02 | `AttendanceAnalyticsPage.tsx` | TREND intro `月別推移と参加回数帯から、参加の偏りを確認します。` | `月ごとの移り変わりと出席回数のはばから、参加のかたよりを確認します。` | 「推移」は残しても可。`偏り`→`かたより`平易化 |
| J-03 | `KpiPanel.tsx` | `ユニーク出席率 {x}%`（support） | `一度でも参加した人の割合 {x}%` | 「ユニーク」除去 |
| J-04 | `KpiPanel.tsx` | aria-label `出席KPI補助指標` | `出席のおもな指標` | 「KPI」除去（スクリーンリーダー文言） |
| J-05 | `AttendanceAnalyticsPage.tsx` | `AdminSectionErrorClient` の `sectionLabel="出席KPI"` | `sectionLabel="出席のおもな指標"` | 「KPI」除去 |
| J-06 | `KpiPanel.tsx` | hint `前期間比 {delta}` | `前の期間とくらべて {delta}` | 「前期間比」平易化 |
| J-07 | `lib/format-attendance.ts` | `formatDelta` 戻り値の単位 `pt` | `ポイント` | 例: `↑1.2pt` → `↑1.2ポイント`。記号（↑↓→）は維持 |
| J-08 | `AttendanceZoneDistributionChart.tsx` | empty `区画別分布データがありません` | `出席回数べつのデータがありません` | 「区画」除去 |
| J-09 | `AttendanceZoneDistributionChart.tsx` | aria-label `出席回数帯別分布` | `出席回数べつの人数` | テストも追従（後述） |
| J-10 | `AttendanceFilterBar.tsx` | `<legend>出席回数帯</legend>` | `累計の出席回数` | 「帯」除去 |
| J-11 | `lib/format-attendance.ts` | `ZONE_HELP`（`出席回数帯は、各メンバーの累計出席回数を…`） | `各メンバーがこれまでに参加した合計回数を、0回／1〜9回／10〜99回／100回以上に分けて表示しています。` | 「出席回数帯」除去・平易化。Playwright が前方一致で参照（後述） |
| J-12 | `KpiPanel.tsx` | `期間内延べ出席数` label / hint `セッション別出席者数の合計` | label 維持可（`延べ`は説明併記）/ hint `開催回ごとの出席者数を合計した数` | 「延べ」は hint で補足。label は `期間内の出席のべ人数` へ平易化可 |

> `ZONE_LABEL`（`0 回（未出席）` / `1〜9 回` / `10〜99 回` / `100 回以上` / `分類不能`）は既に平易な日本語のため変更しない。
> `AttendanceDrilldownModal.tsx`（出席詳細 / 出席 / 欠席 / 閉じる / 読み込み中… / 読み込みエラー）は既に平易な日本語のため変更不要（Phase 1 で再確認のみ）。

### 2-D. UI/UX 見やすさ微調整（Q3「ラベル平易化＋見やすさ微調整」・新規 primitive なし）

| # | 対象 | 調整内容 | 制約 |
| --- | --- | --- | --- |
| U-01 | `AttendanceAbsenteeAlert.tsx` の各行（`<li>`） | メールしか出ない（displayName 空）行でも「会員名／メール → 出席回数帯 → 欠席◯回 → 最終出席」の役割が読み取れるよう、各 `<span>` に視覚ラベル（例: `欠席 {n} 回`・`最終出席: —` は既存）を保ち、`globals.css` の `.attendance-absentee-alert li` のリズム（行間・区切り）を軽微調整する | DOM 構造（`<li>` 内 span 数・順序）と testid は不変。新規要素追加は最小（視覚目的の span のみ可） |
| U-02 | 区画見出し（全体の状況 / 出席の移り変わり / くわしい一覧） | 既存 `.attendance-section-intro`（1 行説明）がある。見出し直下の説明文が日本語で意味を補う状態を保つ（R-02〜R-04 と整合） | 既存構造を流用。新規 primitive なし |
| U-03 | `globals.css` の `.attendance-*` 系 | 文言が長くなる箇所（`表計算ファイルで書き出す` 等）で折返し・はみ出しが起きないよう `white-space` / `gap` を軽微調整（必要時のみ）。色は `var(--ubm-color-*)` のみ・HEX 禁止 | AC-5（design token gate）順守。トークン値は `tokens.css` 実在値のみ |

> Q3 は「ラベル平易化＋見やすさ微調整」。レイアウトの大規模再設計（ゾーン構造の作り替え・カード配置変更・チャート表現の刷新）はスコープ外（今サイクルでは扱わない）。3 ゾーン構造（PRIMARY/TREND/DETAIL = 全体の状況/出席の移り変わり/くわしい一覧）の骨格は維持し、文言と軽微リズムのみ調整する。

---

## 3. 追従が必要な既存テスト / Playwright（同一サイクルで更新・[FB-TASK-01/02] 対策）

> 文字列アサートが Before 文字列に依存しているため、実装と同一 wave で After へ更新する。放置すると CI fail。

| # | テストファイル | 行（実装時に再確認） | 現在のアサート | 追従後 |
| --- | --- | --- | --- | --- |
| T-01 | `apps/web/src/features/admin/attendance/__tests__/AttendanceZoneDistributionChart.spec.tsx` | 20 | `getByRole("group", { name: "出席回数帯別分布" })` | `name: "出席回数べつの人数"`（J-09） |
| T-02 | `apps/web/src/features/admin/attendance/__tests__/AttendanceDetailTabs.spec.tsx` | 42 / 59 / 76 | `getByRole("radio", { name: "TOP10" })` | `name: "出席が多い順"`（R-07） |
| T-03 | 〃 | 54 | `getByText(/セッション別出席状況.*読み込みに失敗しました/)` | `/開催回ごとの出席状況.*読み込みに失敗しました/`（S-07） |
| T-04 | 〃 | 77 | `getByText(/出席ランキング TOP 10.*読み込みに失敗しました/)` | `/出席が多い人の一覧.*読み込みに失敗しました/`（R-08） |
| T-05 | `apps/web/playwright/tests/admin-attendance-dashboard-ux.spec.ts` | 33 | `getByText('出席回数帯別分布')` | `getByText('出席回数べつの人数')`（J-09） |
| T-06 | 〃 | 34 | `getByText('出席回数帯は、各メンバーの累計出席回数')` | `getByText('各メンバーがこれまでに参加した合計回数')`（J-11・前方一致を新文言に合わせる） |

> 新規追加テスト（After 文言を固定する回帰テスト）は Phase 4/6 で設計。
> `apps/web/playwright/tests/visual/admin-shell/dashboard-attendance.spec.ts` は visual snapshot 系のため、文言変更で baseline 再取得が必要になり得る（Phase 11 / staging visual baseline は user-gated）。Phase 4 で要否を判定する。

---

## 4. 対象コードベース（現状実装の事実）

リポジトリルート: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260611-132150-wt-7/`

### 4.1 ページ本体 / route
- ページ: `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx`（行1-42）— `AdminPageHeader`（`eyebrow="ADMIN / DASHBOARD"` ← R-01）+ `AttendanceAnalyticsPage`。`force-dynamic`。

### 4.2 主コンポーネント（全て `apps/web/src/features/admin/attendance/components/` 配下、特記なき限り）

| コンポーネント | ファイル | 本タスクの変更 |
| --- | --- | --- |
| `AttendanceAnalyticsPage` | `AttendanceAnalyticsPage.tsx`（行1-106） | R-02〜R-06 / S-10 / J-02 / J-05（h2/h3/intro/sectionLabel） |
| `KpiPanel` | `KpiPanel.tsx`（行1-78） | S-01〜S-03 / J-03 / J-04 / J-06 / J-12 |
| `AttendanceAbsenteeAlert` | `AttendanceAbsenteeAlert.tsx`（行1-51） | S-04 / S-05 / U-01 |
| `AttendanceDetailTabs` | `AttendanceDetailTabs.tsx`（行1-74） | R-07 / R-08 / S-06 / S-07 |
| `AttendanceFilterBar` | `AttendanceFilterBar.tsx`（行1-68） | R-09 / J-10 |
| `AttendanceTrendChart` | `AttendanceTrendChart.tsx`（行1-57） | S-09 / J-01 |
| `AttendanceZoneDistributionChart` | `AttendanceZoneDistributionChart.tsx`（行1-50） | J-08 / J-09 |
| `SessionAttendanceTable` | `SessionAttendanceTable.tsx`（行1-65） | S-08 |
| `MemberAttendanceTable` | `MemberAttendanceTable.tsx`（行1-39） | 変更なし（既に日本語: 会員 / 出席数 / 出席率） |
| `AttendanceTop10Ranking` | `AttendanceTop10Ranking.tsx`（行1-47） | 変更なし（`#1` 等のランク記号・`{n} 回` は維持） |
| `AttendanceDrilldownModal` | `AttendanceDrilldownModal.tsx`（行1-102） | 変更なし（既に平易な日本語） |
| ヘルパ | `lib/format-attendance.ts`（行1-52） | R-10 / J-07 / J-11 |

### 4.3 データ取得（変更しない・AC-7 / 不変条件 #1 #5）
- `apps/web/src/lib/admin/fetch-attendance.ts` の `fetchAttendanceAnalyticsBundle()` が overview / by-session / ranking / trend / zone-distribution / absentees の 6 endpoint を `safeServerFetch` 経由で並列 fetch。**本タスクは endpoint・shape・型を一切変更しない**。表示文字列のみ変更する。

### 4.4 スタイリング（軽微調整のみ）
- `apps/web/src/styles/globals.css` の `.attendance-*` 系（行956-1090 付近）。文言長変更に伴うはみ出し回避の軽微調整のみ（U-03）。色は `var(--ubm-color-*)` のみ・HEX 禁止（AC-5）。

---

## 5. 受入条件（AC）— 仕様の核

- **AC-1**: 用語リネーム正本表 §2-A（R-01〜R-10）の英語表記がすべて日本語へ置換され、画面表示テキストに `PRIMARY` / `TREND` / `DETAIL` / `ADMIN / DASHBOARD` / `TOP10` / `TOP 10` / `3M` / `6M` / `1Y` / `CSV` が残っていない（`grep` で 0 件）。
- **AC-2**: §2-B（S-01〜S-10）の「セッション」がすべて「開催回」系日本語へ置換され、画面表示テキストに「セッション」が残っていない（`grep` で 0 件）。
- **AC-3**: §2-C（J-01〜J-12）のエンジニア専門語（トレンド / ユニーク出席率 / KPI / 区画 / 帯 / pt）が平易な日本語へ置換されている（画面表示・aria-label・スクリーンリーダー文言を含む）。
- **AC-4**: §2-D（U-01〜U-03）の見やすさ微調整が反映され、要フォロー対象の各行・区画見出し・長い文言のはみ出しが視認上改善している（DOM 構造・testid・href は不変）。
- **AC-5**: 全色が OKLch トークン経由（`var(--ubm-color-*)`）。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` がゼロ（CI gate `verify-design-tokens` pass）。新規 token 追加ゼロ。
- **AC-6**: 新規 primitive 追加ゼロ・新規 component 追加ゼロ（既存 component の文言と軽微 CSS のみ変更。invariant #3 / ui-prototype #3）。
- **AC-7**: API endpoint / D1 schema / Google Form schema / `packages/shared` 型の変更がゼロ。`fetchAttendanceAnalyticsBundle` と 6 endpoint surface・`SafeResult` shape・`AttendanceZone` 等の型はそのまま。`git diff --name-only -- apps/api packages/shared` が空。
- **AC-8**: testid / `data-*` / `href` / `role` / `aria-*` の構造（属性キーと値の意味）が保持され、既存の DOM contract が壊れない（aria-label の**文言**変更は J-04/J-09 等で意図的に行うが、属性キーと役割は維持）。
- **AC-9**: §3 の既存テスト（T-01〜T-06）が After 文言へ追従し、focused vitest と（必要なら）Playwright が PASS する。After 文言を固定する回帰テストが追加されている。
- **AC-10**: 既存の全機能が挙動不変で温存される — フィルタ（期間プリセット / 出席回数チェック）、表計算ファイル書き出し（旧 CSV エクスポート・URL/ダウンロード挙動不変）、ドリルダウン modal、各テーブル内容、要フォロー details 展開。`SafeResult` error 時のセクション単位 degrade も維持。

### スコープ外（今サイクルでは扱わない・CONST_007 例外ではない）
- 3 ゾーン構造そのものの作り替え・カード配置の大規模変更・チャート表現の刷新（Q3 は「微調整」を選択）。
- 新 endpoint を要する集計・データ追加（会員ごとの直近 N 回出席フラグ一覧 等）。API 変更が必要で invariant 違反となるため扱わない。
- `MemberAttendanceTable` / `AttendanceTop10Ranking` / `AttendanceDrilldownModal` の文言（既に平易な日本語で変更不要）。

---

## 6. 制約・不変条件

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| 5 | apps/web から D1 直接アクセス禁止 | `safeServerFetch` 経由のまま。D1 binding 不使用。 |
| ui-prototype #1 | 既存 API のみ接続・新 endpoint/D1/Form 変更禁止 | AC-7 で保証。 |
| ui-prototype #2 | OKLch トークン正本化・HEX 禁止 | AC-5 で保証（`verify-design-tokens` gate）。 |
| ui-prototype #3 | プロトタイプ primitives 正本・新規 primitive 禁止 | AC-6 で保証（文言と軽微 CSS のみ）。 |
| プロジェクト方針 | 出力は全て日本語 | 本タスクの目的そのもの。 |

---

## 7. テスト方針（Phase 4/6/7 で詳細化）

- focused vitest 実行はリポジトリルートが root のため `apps/web/...` フルパス指定 + `--root=. --config=vitest.config.ts` 形式が必須（メモリ既知の罠）。例:
  ```bash
  mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/features/admin/attendance/__tests__
  ```
- 既存テスト追従（T-01〜T-06）＋ After 文言固定の回帰テスト追加（PERIOD_PRESETS ラベル / formatDelta「ポイント」/ KpiPanel「開催回数」「一度でも参加した人の割合」/ DetailTabs「開催回ごと」「出席が多い順」/ AbsenteeAlert「回つづけて欠席」/ ZoneDistribution「出席回数べつの人数」）。
- jsdom/happy-dom は CSS を評価しないため、U-01/U-03 の見た目は構造・クラス存在の検証に留め、視覚確認は Phase 11 screenshot（staging・user-gated）に委ねる。
- 回帰保護: `verify-design-tokens`（HEX 0 件）、（必要時）Playwright visual smoke。

## 8. ローカル検証コマンド（Phase 5/9/11 で使用）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/features/admin/attendance/__tests__
mise exec -- pnpm verify:tokens         # design token gate（HEX 直書き検出）
git diff --name-only -- apps/api packages/shared   # 空であること（AC-7）
# 画面表示の英語/専門語残存チェック（AC-1/AC-2/AC-3）
grep -rnE "PRIMARY|TREND|DETAIL|TOP ?10|ADMIN / DASHBOARD|セッション|ユニーク|トレンド|区画" \
  apps/web/src/features/admin/attendance apps/web/app/\(admin\)/admin/dashboard/attendance
```

---

## 9. メタ情報（artifacts.json 用）

- task_name: `admin-attendance-dashboard-jp-clarity-and-ux`
- task_path: `docs/30-workflows/completed-tasks/admin-attendance-dashboard-jp-clarity-and-ux`
- taskType: `implementation` / docs_only: `false` / VISUAL: true
- workflow_state / status: `implemented_local_visual_present_staging_pending`（apps/web 実装・ローカル検証済み。commit・PR・authenticated staging capture は user-gated）
- implementation_mode: `new`（文言は実装済みだが、本タスクは表現層文言の置換 = 新規実装サイクル）
- ui_routes: `/(admin)/admin/dashboard/attendance`
- endpoints（参照のみ・変更なし）: overview / by-session / ranking / trend / zone-distribution / absentees
- d1_tables: なし（変更なし） / secrets_introduced: なし
- invariants_touched: 5（ui-prototype #1/#2/#3 含む）
- 関連 issue: なし（staging スクリーンショット観察起点・relatedIssue=null）
- 関連既存タスク: `admin-attendance-dashboard-ux`（CSS 復旧・landed）/ `completed-tasks/admin-attendance-dashboard-ux-hierarchy-refine`（3 ゾーン階層化・landed）。本タスクはそれらの上に**文言の日本語化・平易化**を重ねる独立タスク（構造は維持）。

### 実装ファイル一覧（artifacts.implementation_files）
1. `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx`
2. `apps/web/src/features/admin/attendance/components/AttendanceAnalyticsPage.tsx`
3. `apps/web/src/features/admin/attendance/components/KpiPanel.tsx`
4. `apps/web/src/features/admin/attendance/components/AttendanceAbsenteeAlert.tsx`
5. `apps/web/src/features/admin/attendance/components/AttendanceDetailTabs.tsx`
6. `apps/web/src/features/admin/attendance/components/AttendanceFilterBar.tsx`
7. `apps/web/src/features/admin/attendance/components/AttendanceTrendChart.tsx`
8. `apps/web/src/features/admin/attendance/components/AttendanceZoneDistributionChart.tsx`
9. `apps/web/src/features/admin/attendance/components/SessionAttendanceTable.tsx`
10. `apps/web/src/features/admin/attendance/lib/format-attendance.ts`
11. `apps/web/src/styles/globals.css`（U-03 軽微調整・必要時のみ）
12. `apps/web/src/features/admin/attendance/__tests__/AttendanceZoneDistributionChart.spec.tsx`（T-01 追従 + 回帰）
13. `apps/web/src/features/admin/attendance/__tests__/AttendanceDetailTabs.spec.tsx`（T-02〜T-04 追従 + 回帰）
14. `apps/web/src/features/admin/attendance/__tests__/KpiPanel.spec.tsx`（J-03/S-01 回帰）
15. `apps/web/src/features/admin/attendance/__tests__/format-attendance.spec.ts`（R-10/J-07 回帰）
16. `apps/web/playwright/tests/admin-attendance-dashboard-ux.spec.ts`（T-05/T-06 追従）
