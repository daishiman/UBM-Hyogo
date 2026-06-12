# 実装ガイド — 出席ダッシュボードの日本語化と分かりやすさの改善

> ステータス: `implemented_local_visual_present_staging_pending`。本タスクは表現層の文言を平易な日本語へ置換する実装。Part 1（中学生レベル）+ Part 2（開発者レベル）+ 視覚証跡で構成する。6 canonical PNG は local Playwright admin fixture で取得済み。authenticated staging baseline は user-gated。

---

## Part 1 — 中学生レベルの説明（専門用語なし・例え話）

### なぜ英語のままだと困るか

管理者と会員が見る「出席ダッシュボード」という画面があります。出席の状況をまとめて見せる画面です。ところが今この画面には、見出しやボタンに英語がたくさん混じっています。たとえば「PRIMARY」「TREND」「DETAIL」「TOP10」「3M / 6M / 1Y」「CSVエクスポート」といった具合です。さらに日本語でも「セッション」「ユニーク出席率」「区画」「pt」のような、ふだん使わない難しい言葉が並んでいます。

これは、町内会の掲示板に英語の見出しと専門用語だらけの紙が貼ってあるようなものです。書いてある中身（出席の数字）は正しくても、**読む人が「これは何のこと?」と立ち止まってしまい、意味が伝わりません**。英語が苦手な会員さんや、ITに詳しくない管理者さんには特に不親切です。ユーザーからも「英語表記は直感的に分からない、もっと分かりやすい日本語にしてほしい」という声が出ました。これが直したい問題です。

### 何をするか（どう日本語に直すか）

中身（出席の数字や計算）は **いっさい変えません**。**言葉の見え方だけ**を、誰でも読める日本語に置き換えます。たとえばこう直します。

- 「PRIMARY」→「全体の状況」、「TREND」→「出席の移り変わり」、「DETAIL」→「くわしい一覧」。
- 「セッション」→「開催回」。たとえば「直近 3 セッション連続欠席」→「直近 3 回つづけて欠席」。
- 「3M / 6M / 1Y」→「3か月 / 6か月 / 1年」。
- 「CSVエクスポート」→「表計算ファイルで書き出す」。
- 「ユニーク出席率」→「一度でも参加した人の割合」、「pt」→「ポイント」。

英語の辞書を片手に読む必要がなくなり、はじめて見た人でも「何の数字か・どう読むか」がすぐ分かるようになります。あわせて、名前の代わりにメールアドレスしか出ていない行や、文字が長くなってはみ出しそうな場所を、ほんの少し見やすく整えます。

### 数字や機能は変えない約束

- 出席の数字を計算する仕組み（サーバ側）は **一切変えません**。見せる言葉だけ変えます。
- 「3か月」「6か月」のような期間で絞り込むボタンも、表計算ファイルの書き出しも、くわしい内容を開くポップアップも、**今まで通り同じように動きます**。押したときの動きは変わりません。
- 色は決められた「色のパレット」からだけ使い、勝手な色は作りません。

### 今回作ったもの

- 管理画面の出席ダッシュボードで、英語見出しと専門語を平易な日本語へ置き換えた画面表示。
- 「開催回」「出席の移り変わり」「表計算ファイルで書き出す」など、会員・管理者がそのまま読める言葉の統一表。
- 長い日本語ラベルでも折り返して読める、最小限の見た目調整。

---

## Part 2 — 開発者レベルの説明

### 概要

`/(admin)/admin/dashboard/attendance`（出席ダッシュボード）の表現層（`apps/web/src/features/admin/attendance/` + 同 route の `page.tsx` + `globals.css` 軽微調整）のみを変更する。**英語表記・エンジニア専門語を平易な日本語へ置換する文字列リネーム**が中心であり、データ取得（6 endpoint bundle）・shared 型・API・D1・Google Form schema は不変（AC-7）。3 ゾーン（全体の状況 / 出席の移り変わり / くわしい一覧）の骨格・DOM 構造・testid・href・role は維持し、表示テキスト・aria-label の**文言**と軽微な CSS リズムのみを変更する（AC-4 / AC-6 / AC-8）。

### TypeScript の型定義

この変更では新しい公開型を作らない。既存型をそのまま使用し、表示 label のみを置き換える。

```ts
import type {
  AttendanceOverviewExt,
  AttendanceTrend,
  AttendanceZone,
  AttendanceZoneDistribution,
} from "@ubm-hyogo/shared";

export type PeriodPresetId = (typeof PERIOD_PRESETS)[number]["id"];

export interface AttendanceFilterState {
  readonly periodPreset: PeriodPresetId;
  readonly periodFrom: string | null;
  readonly periodTo: string | null;
  readonly zones: readonly AttendanceZone[];
}
```

### APIシグネチャ

API surface は変更しない。apps/web は既存の 6 endpoint bundle を `safeServerFetch` 経由で読むだけで、今回の変更は JSX 表示文字列と aria-label に閉じる。

```ts
export async function fetchAttendanceAnalyticsBundle(input: {
  readonly periodFrom: string | null;
  readonly periodTo: string | null;
  readonly zones: readonly AttendanceZone[] | null;
  readonly limit: number;
  readonly lastN: number;
}): Promise<AttendanceAnalyticsBundle>;
```

CLI で確認する境界は次の通り。`apps/api` と `packages/shared` に diff が出たら AC-7 違反。

```bash
git diff --name-only -- apps/api packages/shared
```

### 使用例

実装後は表示文言が After に変わり、内部キーや URL は変わらない。

```tsx
<AdminPageHeader
  eyebrow="管理 / ダッシュボード"
  title="出席ダッシュボード"
  description="出席率の移り変わり・出席回数べつの人数・欠席フォロー対象を確認"
/>

<Segmented
  ariaLabel="出席詳細の表示切替"
  options={[
    { value: "session", label: "開催回ごと" },
    { value: "member", label: "会員別" },
    { value: "top10", label: "出席が多い順" },
  ]}
/>
```

### エラーハンドリング

`SafeResult` の degrade 経路は保持する。`AdminSectionErrorClient` へ渡す `sectionLabel` は After 文言へ置き換えるが、`code` と `message` は既存 API の値をそのまま渡す。`bundle.overview.ok === false`、`bundle.trend.ok === false`、`bundle.zoneDistribution.ok === false`、`ranking.ok === false`、`bySession.ok === false` の分岐構造は変更しない。

### 設定項目と定数一覧

| 定数/設定 | 変更 | 不変条件 |
| --- | --- | --- |
| `PERIOD_PRESETS[].label` | `3M/6M/1Y` → `3か月/6か月/1年` | `id`、配列順、`monthsBack` は不変 |
| `ZONE_HELP` | 文頭を `各メンバーがこれまでに参加した合計回数...` へ | `ZONE_LABEL` と `SELECTABLE_ZONES` は不変 |
| `formatDelta` | 単位 `pt` → `ポイント` | 符号、丸め、計算式、signature は不変 |
| `.attendance-export-link` | 長文ラベル用に折返し許容 | 色 token は既存 `var(--ubm-color-*)` のみ |

### テスト構成

| 層 | コマンド/対象 | 目的 |
| --- | --- | --- |
| focused unit | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/features/admin/attendance/__tests__` | After 文言、`formatDelta`、タブ、KPI、zone help を固定 |
| type/lint | `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` | 型・lint の非退化確認 |
| token gate | `mise exec -- pnpm verify:tokens` | HEX 直書きと token 逸脱を検出 |
| boundary grep | `git diff --name-only -- apps/api packages/shared` | API/shared/D1 境界に触れていないことを確認 |

### 変更ファイル一覧（_shared-context.md §9 の 16 ファイル）

| # | 区分 | パス | 主な変更 |
| --- | --- | --- | --- |
| 1 | 修正 | `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` | R-01（`AdminPageHeader` eyebrow `ADMIN / DASHBOARD`→`管理 / ダッシュボード`） |
| 2 | 修正 | `.../attendance/components/AttendanceAnalyticsPage.tsx` | R-02〜R-06 / S-10 / J-02 / J-05（h2/h3/intro/sectionLabel） |
| 3 | 修正 | `.../attendance/components/KpiPanel.tsx` | S-01〜S-03 / J-03 / J-04 / J-06 / J-12 |
| 4 | 修正 | `.../attendance/components/AttendanceAbsenteeAlert.tsx` | S-04 / S-05 / U-01 |
| 5 | 修正 | `.../attendance/components/AttendanceDetailTabs.tsx` | R-07 / R-08 / S-06 / S-07 |
| 6 | 修正 | `.../attendance/components/AttendanceFilterBar.tsx` | R-09 / J-10 |
| 7 | 修正 | `.../attendance/components/AttendanceTrendChart.tsx` | S-09 / J-01 |
| 8 | 修正 | `.../attendance/components/AttendanceZoneDistributionChart.tsx` | J-08 / J-09 |
| 9 | 修正 | `.../attendance/components/SessionAttendanceTable.tsx` | S-08 |
| 10 | 修正 | `.../attendance/lib/format-attendance.ts` | R-10 / J-07 / J-11 |
| 11 | 修正（任意） | `apps/web/src/styles/globals.css` | U-03 軽微 CSS（はみ出し回避・必要時のみ・`var(--ubm-color-*)` のみ） |
| 12 | 修正（追従） | `.../attendance/__tests__/AttendanceZoneDistributionChart.spec.tsx` | T-01 追従 + 回帰 |
| 13 | 修正（追従） | `.../attendance/__tests__/AttendanceDetailTabs.spec.tsx` | T-02〜T-04 追従 + 回帰 |
| 14 | 修正（追従/回帰） | `.../attendance/__tests__/KpiPanel.spec.tsx` | J-03 / S-01 回帰 |
| 15 | 修正（追従/回帰） | `.../attendance/__tests__/format-attendance.spec.ts` | R-10 / J-07 回帰 |
| 16 | 修正（追従） | `apps/web/playwright/tests/admin-attendance-dashboard-ux.spec.ts` | T-05 / T-06 追従 |

> **変更なし**: `apps/api/**` / `packages/shared/**` / `fetch-attendance.ts`（6 endpoint bundle）/ `MemberAttendanceTable.tsx` / `AttendanceTop10Ranking.tsx` / `AttendanceDrilldownModal.tsx` / `ZONE_LABEL`（AC-7 / AC-10・既に平易な日本語）。`git diff --name-only -- apps/api packages/shared` は空であること。

### 用語リネーム正本表（R / S / J / U の要点）

逐語の完全表は `_shared-context.md` §2 を正とする。要点のみ抜粋:

#### R 系（英語表記 → 日本語・完全置換）

| # | Before | After |
| --- | --- | --- |
| R-01 | `ADMIN / DASHBOARD` | `管理 / ダッシュボード` |
| R-02〜R-04 | `PRIMARY` / `TREND` / `DETAIL` | `全体の状況` / `出席の移り変わり` / `くわしい一覧` |
| R-05 / R-06 | `出席トレンド` / `出席回数帯別分布` | `月ごとの出席の移り変わり` / `出席回数べつの人数` |
| R-07 / R-08 | `TOP10` / `出席ランキング TOP 10` | `出席が多い順` / `出席が多い人の一覧` |
| R-09 | `CSVエクスポート` | `表計算ファイルで書き出す` |
| R-10 | `3M` / `6M` / `1Y` | `3か月` / `6か月` / `1年` |

#### S 系（「セッション」→「開催回」へ統一）

| # | Before | After |
| --- | --- | --- |
| S-01 / S-02 | `セッション数` / `1 セッションあたり` | `開催回数` / `1回の開催あたり` |
| S-04 / S-05 | `直近 {N} セッション連続欠席` | `直近 {N} 回つづけて欠席` |
| S-06 / S-07 | `セッション別` / `セッション別出席状況` | `開催回ごと` / `開催回ごとの出席状況` |
| S-08 / S-09 | `セッションデータがありません` / `... {n} セッション` | `開催回のデータがありません` / `... 開催 {n} 回` |
| S-10 | `... 開催セッション数の変化を確認します。` | `... 開催回数の変化を確認します。` |

#### J 系（その他の専門語の平易化）

| # | Before | After |
| --- | --- | --- |
| J-01 | `出席トレンド` / `トレンドデータがありません` | `出席の移り変わり` / `推移データがありません` |
| J-03 | `ユニーク出席率 {x}%` | `一度でも参加した人の割合 {x}%` |
| J-04 / J-05 | aria-label `出席KPI補助指標` / `sectionLabel="出席KPI"` | `出席のおもな指標` |
| J-06 | `前期間比 {delta}` | `前の期間とくらべて {delta}` |
| J-07 | `formatDelta` 単位 `pt` | `ポイント`（後述・契約） |
| J-08 / J-09 | `区画別分布データがありません` / aria-label `出席回数帯別分布` | `出席回数べつのデータがありません` / `出席回数べつの人数` |
| J-10 | `<legend>出席回数帯</legend>` | `累計の出席回数` |
| J-11 | `ZONE_HELP`（「出席回数帯は、各メンバーの累計出席回数を…」） | 「各メンバーがこれまでに参加した合計回数を、0回／1〜9回／10〜99回／100回以上に分けて表示しています。」 |

#### U 系（見やすさ微調整・新規 primitive なし）

| # | 対象 | 調整 |
| --- | --- | --- |
| U-01 | `AttendanceAbsenteeAlert` 各 `<li>` | displayName 空（メールのみ）行でも役割が読めるリズム調整。DOM 構造・testid 不変 |
| U-02 | 区画見出し（3 ゾーン） | `.attendance-section-intro` の日本語説明を保つ（R-02〜R-04 と整合） |
| U-03 | `globals.css` `.attendance-*` | 長文言（`表計算ファイルで書き出す` 等）のはみ出し回避（`white-space`/`gap`・`var(--ubm-color-*)` のみ・HEX 禁止） |

### `formatDelta` の単位変更契約（pt → ポイント・計算不変）

`lib/format-attendance.ts` の `formatDelta` は前期間比の差分を表示する。本タスクで変更するのは **戻り値の単位表記のみ**（J-07）:

| 項目 | Before | After | 不変か |
| --- | --- | --- | --- |
| 数値計算（delta の算出） | — | 変更なし | **不変** |
| 符号記号（↑ / ↓ / →） | `↑1.2pt` | `↑1.2ポイント` | 記号は**維持** |
| 単位文字列 | `pt` | `ポイント` | **これだけ変更** |

- signature（引数・戻り値の型）は変えない。数値フォーマット・丸め・閾値ロジックは一切変えない。文字列リテラル `"pt"` → `"ポイント"` の置換のみ。
- 回帰テスト（`format-attendance.spec.ts`）で `↑1.2ポイント` 等の After 文字列を固定する。

### PERIOD_PRESETS の label のみ変更

`PERIOD_PRESETS[].label` の `3M` / `6M` / `1Y` を `3か月` / `6か月` / `1年` へ（R-10）。`全期間` / `今月` は既に日本語のため変更しない。**`value`（`3m`/`6m`/`1y` 等の内部キー）・配列順・絞り込みロジックは不変**（AC-10）。表示 label のみの置換。

### ZONE_HELP の置換

`ZONE_HELP` 定数の本文を J-11 の After 文へ置換する。「出席回数帯」という語を除去し、「各メンバーがこれまでに参加した合計回数を、0回／1〜9回／10〜99回／100回以上に分けて表示しています。」とする。Playwright（T-06）が前方一致 `各メンバーがこれまでに参加した合計回数` で参照するため、文頭を After 文に合わせる。`ZONE_LABEL`（`0 回（未出席）` 等）は変更しない。

### テスト追従（T-01〜T-06）+ 回帰テスト

同一 wave で Before 依存アサートを After へ更新する（放置すると CI fail・[FB-TASK-01/02] 対策）。

| # | ファイル | Before アサート | After |
| --- | --- | --- | --- |
| T-01 | `AttendanceZoneDistributionChart.spec.tsx` | `getByRole("group", { name: "出席回数帯別分布" })` | `name: "出席回数べつの人数"`（J-09） |
| T-02 | `AttendanceDetailTabs.spec.tsx` | `getByRole("radio", { name: "TOP10" })` | `name: "出席が多い順"`（R-07） |
| T-03 | 〃 | `/セッション別出席状況.*読み込みに失敗しました/` | `/開催回ごとの出席状況.*.../`（S-07） |
| T-04 | 〃 | `/出席ランキング TOP 10.*読み込みに失敗しました/` | `/出席が多い人の一覧.*.../`（R-08） |
| T-05 | `playwright/.../admin-attendance-dashboard-ux.spec.ts` | `getByText('出席回数帯別分布')` | `getByText('出席回数べつの人数')`（J-09） |
| T-06 | 〃 | `getByText('出席回数帯は、各メンバーの累計出席回数')` | `getByText('各メンバーがこれまでに参加した合計回数')`（J-11） |

回帰テスト（After 文言固定・Phase 4/6 で設計）: PERIOD_PRESETS ラベル（`3か月`/`6か月`/`1年`）/ `formatDelta`「ポイント」/ KpiPanel「開催回数」「一度でも参加した人の割合」/ DetailTabs「開催回ごと」「出席が多い順」/ AbsenteeAlert「回つづけて欠席」/ ZoneDistribution「出席回数べつの人数」。

### 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/features/admin/attendance/__tests__
mise exec -- pnpm verify:tokens         # design token gate（HEX 直書き検出・AC-5）
git diff --name-only -- apps/api packages/shared   # 空であること（AC-7）
# 画面の英語/専門語残存チェック（AC-1/AC-2/AC-3）
grep -rnE "PRIMARY|TREND|DETAIL|TOP ?10|ADMIN / DASHBOARD|セッション|ユニーク|トレンド|区画" \
  apps/web/src/features/admin/attendance apps/web/app/\(admin\)/admin/dashboard/attendance
```

### エッジケース

| ケース | 期待挙動 |
| --- | --- |
| `AttendanceAbsenteeAlert` の displayName が空 | メールアドレス表示を**維持**（U-01 はリズム調整のみ・表示内容は不変） |
| 要フォロー 0 件（欠席者なし） | empty 文言が S-05 の After（`直近 {N} 回つづけて欠席している人はいません`）で表示。崩れない |
| `formatDelta` の delta = 0 | `→0ポイント` 等・記号と単位の組み合わせが正しい（計算不変） |
| 各 SafeResult error | セクション単位の degrade を**維持**（AC-10）。文言変更で degrade 経路は変わらない |
| 期間プリセット切替 | `3か月`/`6か月`/`1年` は label のみ変更。`value` 不変ゆえ絞り込み結果は不変 |
| 表計算ファイル書き出し（旧 CSV） | リンク文言のみ変更。URL / ダウンロード挙動は不変（AC-10） |
| ドリルダウン modal | `SessionAttendanceTable` 内で挙動不変（変更対象外・AC-10） |
| mobile 幅 | 3 ゾーンが 1 カラム縦積み。長文言のはみ出しを U-03 で回避 |

---

## 視覚証跡（Phase 11 screenshot canonical 名）

VISUAL タスクのため、下記 6 canonical screenshot を `outputs/phase-11/screenshots/` に取得予定（canonical 命名は `outputs/phase-11/screenshot-plan.json` / `screenshot-coverage.md` と一致）。apps/web 実装・ローカル検証は完了済み。6 canonical PNG は対象 route が admin 認証 gate 配下・Playwright staging 専用のためlocal fixture で取得済みで、staging deploy + admin 認証のうえ user 承認後に取得する。

| # | canonical 名 | 意図 | 検証 AC |
| --- | --- | --- | --- |
| ① | `attendance-dashboard-full-jp.png` | 3 ゾーン全体が日本語見出しで表示（after 状態） | AC-1 / AC-2 / AC-3 / AC-4 |
| ② | `attendance-overview-zone-jp.png` | 「全体の状況」ゾーンの KPI / 要フォロー対象が日本語 | AC-1 / AC-2 / AC-3 |
| ③ | `attendance-trend-zone-jp.png` | 「出席の移り変わり」ゾーン（移り変わり + 出席回数べつの人数） | AC-1 / AC-3 |
| ④ | `attendance-detail-tabs-jp.png` | 「くわしい一覧」タブ（開催回ごと / 会員別 / 出席が多い順） | AC-1 / AC-2 |
| ⑤ | `attendance-filter-bar-jp.png` | フィルタ（3か月/6か月/1年・累計の出席回数・表計算ファイルで書き出す） | AC-1 / AC-3 |
| ⑥ | `attendance-dashboard-mobile-jp.png` | モバイル幅・3 ゾーン 1 カラム縦積みで日本語表示が成立 | AC-4 |

> 6 canonical PNG capture は local Playwright admin fixture で取得済み。staging 認証済み admin baseline は user-gated で staging deploy + admin 認証後に取得する。staging runtime artifact を擬似生成しない。
