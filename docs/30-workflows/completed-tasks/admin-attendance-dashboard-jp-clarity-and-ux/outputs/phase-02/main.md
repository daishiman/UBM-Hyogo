# Phase 2 — 設計（実体）

> 上流: `outputs/phase-01/{main,rename-map}.md`（要件 / 用語リネーム正本表）。下流: `./change-map.md`（ファイル別変更マップ = Phase 5 実装の唯一の正）。
> 文字列置換中心のため新規モジュール設計はない。本ファイルは「再利用判断 / DOM contract 保持 / ロジック含有箇所の契約 / U-03 軽微 CSS / state ownership」を固定する。

---

## 1. 既存コンポーネント再利用可否（[FB-SDK-07-1]）

| 判断 | 内容 |
| --- | --- |
| 新規 component | **作らない**。既存 9 実装ファイル + 1 route + globals.css の文言と軽微 CSS のみ変更 |
| 新規 primitive | **作らない**（AC-6）。`Segmented` / `Card` / `Badge` 等の既存 primitive をそのまま使う |
| 新規 hook / util | **作らない**。`formatDelta` は既存関数のシグネチャ不変・戻り文字列の単位表記のみ変更。`PERIOD_PRESETS` / `ZONE_HELP` は定数値のみ変更 |
| 新規型 | **作らない**。`AttendanceOverviewExt` / `SafeResult` 等は import のまま |

---

## 2. DOM contract 保持の設計（AC-8）

文言を変えても以下は不変とする:

| 不変対象 | 例 | 扱い |
| --- | --- | --- |
| `data-testid` | `attendance-kpi-rate` / `attendance-by-session-table` / `attendance-detail-tabs` / `attendance-export-link` 等 | **全維持**。テストの取得経路を壊さない |
| `role` | `group` / `radiogroup` / `radio` / `img` | 維持 |
| `href` | `attendance-export-link` の `href`（`buildAttendanceExportUrlClient`） | **値も挙動も不変**（ダウンロードされる実ファイルは引き続き CSV。文言だけ用途表現に変更） |
| `data-*`（属性キー） | `data-attendance-follow` / `data-active` / `aria-pressed` | キー・値の意味を維持 |
| `Segmented` の `value` | `"session" \| "member" \| "top10"` | **不変**。label だけ変更（label / value 分離・§6） |

**意図的に文言を変える aria-label / sectionLabel**（属性キー・role は維持）:

| 箇所 | Before | After | ID |
| --- | --- | --- | --- |
| `AttendanceTrendChart` figure aria-label | `出席トレンド` | `出席の移り変わり` | J-01 |
| `KpiPanel` secondary-grid aria-label | `出席KPI補助指標` | `出席のおもな指標` | J-04 |
| `AttendanceZoneDistributionChart` group aria-label | `出席回数帯別分布` | `出席回数べつの人数` | J-09 |
| `AdminSectionErrorClient` sectionLabel（KPI / session / top10） | `出席KPI` / `セッション別出席状況` / `出席ランキング TOP 10` | `出席のおもな指標` / `開催回ごとの出席状況` / `出席が多い人の一覧` | J-05 / S-07 / R-08 |

> `Segmented` の各 option は `aria-label={label}` で描画されるため、label 変更（`TOP10`→`出席が多い順`、`セッション別`→`開催回ごと`）は radio の aria 名も変わる。テスト T-02 はこれに追従する。

---

## 3. ロジック含有箇所の入出力契約

文字列以外に「計算 / 定数構造」を含む 3 箇所の契約を固定する。

### 3.1 `formatDelta(current, previous): string`（J-07）

| 項目 | 内容 |
| --- | --- |
| 変更点 | 戻り値末尾の単位 `pt` → `ポイント` のみ |
| 不変 | `—`（previous null / 非有限）・符号（`↑` / `↓` / `→`）・`Math.abs(diff * 100).toFixed(1)`（小数 1 桁）・入力型・戻り型（`string`） |
| 例 | `↑7.0pt` → `↑7.0ポイント` / `→0.0pt` → `→0.0ポイント` / `—`（不変） |

実コード（`format-attendance.ts` 8-13 行）の `return \`${sign}${Math.abs(diff * 100).toFixed(1)}pt\`;` の `pt` を `ポイント` に置換するのみ。

### 3.2 `PERIOD_PRESETS[].label`（R-10）

| 項目 | 内容 |
| --- | --- |
| 変更点 | `3M` / `6M` / `1Y` の `label` のみ → `3か月` / `6か月` / `1年` |
| 不変 | `id`（`"all" / "1m" / "3m" / "6m" / "1y"`）・`monthsBack`。よって `presetToPeriod` / URL クエリ / フィルタ挙動は完全不変 |
| 据置 | `全期間`（all）/ `今月`（1m）は既に日本語のため変更しない |

### 3.3 `ZONE_HELP`（J-11）

| 項目 | 内容 |
| --- | --- |
| 変更点 | 定数文字列を平易版へ置換 |
| 参照箇所 | `AttendanceZoneDistributionChart`（凡例 `<p>`）+ Playwright 前方一致（T-06） |
| 波及 | T-06 のアサート文字列を新文言の前方一致（`各メンバーがこれまでに参加した合計回数`）へ更新 |

---

## 4. U-03 軽微 CSS 調整の設計（必要時のみ）

| 対象クラス | 確認内容 | 調整方針 |
| --- | --- | --- |
| `.attendance-export-link` | `表計算ファイルで書き出す`（11 文字）に伸び、ボタンが折返し / はみ出さないか | 必要時のみ `white-space: nowrap` 解除 or `flex-wrap` / `gap` 微調整。色変更なし |
| `.attendance-kpi-support` / `.attendance-kpi-hint` | `一度でも参加した人の割合 {x}%` / `前の期間とくらべて {delta}` の長文化で行が詰まらないか | 必要時 `gap` / `line-height` 微調整 |
| `.attendance-absentee-alert li`（U-01） | メールのみ行の可読性（行間・区切り） | `gap` / 区切り線の軽微調整 |

> いずれも **必要時のみ**。色は `var(--ubm-color-*)` のみ・HEX 0・新規 token 0（AC-5）。jsdom は CSS を評価しないため視覚確認は Phase 11 へ委ねる（テストは構造・クラス存在のみ）。

---

## 5. テスト追従マップ（T-01〜T-06）

| ID | 対象 | 旧アサート | 新アサート | リネーム |
| --- | --- | --- | --- | --- |
| T-01 | `AttendanceZoneDistributionChart.spec.tsx` | `getByRole("group", { name: "出席回数帯別分布" })` / `getByText(/各メンバーの累計出席回数/)` | `name: "出席回数べつの人数"` / `getByText(/各メンバーがこれまでに参加した合計回数/)` | J-09 / J-11 |
| T-02 | `AttendanceDetailTabs.spec.tsx`（38 / 42 / 59 / 76 行付近の radio 取得） | `getByRole("radio", { name: "TOP10" })` | `name: "出席が多い順"` | R-07 |
| T-03 | 〃（54 行） | `/セッション別出席状況.*読み込みに失敗しました/` | `/開催回ごとの出席状況.*読み込みに失敗しました/` | S-07 |
| T-04 | 〃（77 行） | `/出席ランキング TOP 10.*読み込みに失敗しました/` | `/出席が多い人の一覧.*読み込みに失敗しました/` | R-08 |
| T-05 | `playwright/.../admin-attendance-dashboard-ux.spec.ts`（33 行） | `getByText('出席回数帯別分布')` | `getByText('出席回数べつの人数')` | J-09 |
| T-06 | 〃（34 行） | `getByText('出席回数帯は、各メンバーの累計出席回数')` | `getByText('各メンバーがこれまでに参加した合計回数')` | J-11 |

> `AttendanceDetailTabs.spec.tsx` の `会員別`（member タブ）は label 据置のため追従不要。`会員別出席率`（member sectionLabel・74 行アサート）も据置。

---

## 6. state ownership 確認（[VSCPKR-03]）

- `AttendanceDetailTabs` のタブ選択は `useState<DetailTabKey>("session")`（internal state・26 行）。
- `DETAIL_OPTIONS` の `label` 変更（`セッション別`→`開催回ごと` / `TOP10`→`出席が多い順`）は **`value`（`"session" / "member" / "top10"`）に影響しない**（label と value の分離）。
- よって `onChange` / `setActive` / 排他描画ロジックは完全不変。文言だけが変わる。

---

## 7. 3 ゾーン見出し対応（構造維持の確認）

| ゾーン | 旧 h2 | 新 h2 | 直下の補助文 |
| --- | --- | --- | --- |
| PRIMARY | `PRIMARY` | `全体の状況` | 「全体の健全性と、今日フォローすべき対象を最初に判断します。」（維持） |
| TREND | `TREND` | `出席の移り変わり` | J-02 で平易化 |
| DETAIL | `DETAIL` | `くわしい一覧` | 「詳細テーブルは必要な観点だけを切り替えて確認します。」（維持・「テーブル」→「一覧」は任意改善 M-4） |

> ゾーン順序・カード配置・grid 構造は変更しない（Q3 = 微調整）。
