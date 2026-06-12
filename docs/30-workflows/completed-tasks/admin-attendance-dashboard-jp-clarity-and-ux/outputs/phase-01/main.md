# Phase 1 — 要件定義（実体）

> 上流: `_shared-context.md`（調査・方針・用語リネーム正本表・AC 正本）。下流: `outputs/phase-02/change-map.md`（ファイル別変更マップ）。
> 本ファイルは要件定義の実体。用語リネームの逐語正本は `./rename-map.md`（R/S/J/U + 影響先列）。

---

## 0. P50 前提確認（Step 0）

実装着手前に current branch / 実装状態を `git` / `grep` で確認した結果を記録する。

| 確認項目 | 結果 |
| --- | --- |
| current branch | detached HEAD（worktree `task-20260611-132150-wt-7`）。実装ブランチは Phase 5 で `feat/admin-attendance-dashboard-jp-clarity-and-ux` を作成 |
| 出席ダッシュボードの実装状態 | **既に実装済み**。`/(admin)/admin/dashboard/attendance` は 3 ゾーン（PRIMARY / TREND / DETAIL）構造で稼働中 |
| 現状の文言 | ゾーン見出しが英語（`PRIMARY` / `TREND` / `DETAIL`）、eyebrow が `ADMIN / DASHBOARD`、タブが `TOP10` / `セッション別`、期間プリセットが `3M` / `6M` / `1Y`、書き出しが `CSVエクスポート`、各所に `セッション` / `ユニーク出席率` / `トレンド` / `区画` / `出席回数帯` / `pt` が混在 |
| データ層 | `fetchAttendanceAnalyticsBundle()` が 6 endpoint（overview / by-session / ranking / trend / zone-distribution / absentees）を `safeServerFetch` 経由で並列 fetch。**データは十分**。問題は表現層の言葉だけ |

**Step 0 の結論**: 現状は `AttendanceAnalyticsPage` が PRIMARY / TREND / DETAIL の 3 ゾーン（英語 h2）で実装済み。本タスクはデータ層・型・DOM 構造（testid / role / `data-*` / `href`）を一切変えず、これらの英語表記とエンジニア専門語を平易な日本語へ置換する（＋長い文言のはみ出し回避の軽微 CSS のみ）。

裏取りコマンド（再現用）:

```bash
grep -nE "PRIMARY|TREND|DETAIL|ADMIN / DASHBOARD|TOP10|セッション|ユニーク|トレンド|区画|CSVエクスポート" \
  apps/web/app/\(admin\)/admin/dashboard/attendance/page.tsx \
  apps/web/src/features/admin/attendance/components/*.tsx \
  apps/web/src/features/admin/attendance/lib/format-attendance.ts
```

---

## 1. 対象 inventory（12 実装ファイル + globals.css + 既存テスト）

### 1.1 ページ / route

| # | パス | 本タスクの変更 |
| --- | --- | --- |
| 1 | `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` | `AdminPageHeader` の `eyebrow="ADMIN / DASHBOARD"`（R-01）／ `description` 内の「区画分布」平易化（J 系の派生・change-map で確定） |

### 1.2 主コンポーネント（`apps/web/src/features/admin/attendance/components/` 配下）

| # | コンポーネント | ファイル | 変更ID |
| --- | --- | --- | --- |
| 2 | `AttendanceAnalyticsPage` | `AttendanceAnalyticsPage.tsx` | R-02〜R-06 / S-10 / J-02 / J-05 ＋ ページ案内文（30-32 行の `出席回数帯` / `累計出席回数`）の平易化 |
| 3 | `KpiPanel` | `KpiPanel.tsx` | S-01〜S-03 / J-03 / J-04 / J-06 / J-12 |
| 4 | `AttendanceAbsenteeAlert` | `AttendanceAbsenteeAlert.tsx` | S-04 / S-05 / U-01 |
| 5 | `AttendanceDetailTabs` | `AttendanceDetailTabs.tsx` | R-07 / R-08 / S-06 / S-07 |
| 6 | `AttendanceFilterBar` | `AttendanceFilterBar.tsx` | R-09 / J-10 |
| 7 | `AttendanceTrendChart` | `AttendanceTrendChart.tsx` | S-09 / J-01 |
| 8 | `AttendanceZoneDistributionChart` | `AttendanceZoneDistributionChart.tsx` | J-08 / J-09 |
| 9 | `SessionAttendanceTable` | `SessionAttendanceTable.tsx` | S-08 |
| — | `MemberAttendanceTable` | `MemberAttendanceTable.tsx` | 変更なし（会員 / 出席数 / 出席率 = 既に日本語） |
| — | `AttendanceTop10Ranking` | `AttendanceTop10Ranking.tsx` | 変更なし（`#1` / `{n} 回` を維持） |
| — | `AttendanceDrilldownModal` | `AttendanceDrilldownModal.tsx` | 変更なし（既に平易な日本語・Phase 1 で再確認のみ） |

### 1.3 ヘルパ / スタイル

| # | パス | 変更ID |
| --- | --- | --- |
| 10 | `apps/web/src/features/admin/attendance/lib/format-attendance.ts` | R-10 / J-07 / J-11 |
| 11 | `apps/web/src/styles/globals.css`（`.attendance-*` 系） | U-03（はみ出し回避の軽微調整・必要時のみ） |

### 1.4 既存テスト / Playwright（同一 wave 追従が必須）

| # | パス | 追従ID |
| --- | --- | --- |
| 12 | `__tests__/AttendanceZoneDistributionChart.spec.tsx` | T-01（+ 回帰） |
| 13 | `__tests__/AttendanceDetailTabs.spec.tsx` | T-02〜T-04（+ 回帰） |
| 14 | `__tests__/KpiPanel.spec.tsx`（既存・編集） | J-03 / S-01 回帰 |
| 15 | `__tests__/format-attendance.spec.ts`（既存・編集） | R-10 / J-07 回帰 |
| 16 | `playwright/tests/admin-attendance-dashboard-ux.spec.ts` | T-05 / T-06 |

---

## 2. 命名規則（current 規則・新規ドリフトを生まない）

| 種別 | 規則 | 例 |
| --- | --- | --- |
| コンポーネント | PascalCase | `AttendanceAnalyticsPage` / `KpiPanel` |
| 関数 / 定数 | camelCase / UPPER_SNAKE | `formatDelta` / `PERIOD_PRESETS` / `ZONE_HELP` |
| CSS クラス | `.attendance-*` BEM 風 | `.attendance-kpi-panel` / `.attendance-detail-tabs__panel` |
| testid | `attendance-*`（ケバブ） | `attendance-kpi-rate` / `attendance-by-session-table` |

> 本タスクは**新規 component / primitive / 関数 / CSS クラス命名を増やさない**（[FB-SDK-07-4] = 命名ドリフトの発生源を持たない）。変更は既存定義の文言（と必要時の軽微 CSS プロパティ値）のみ。

---

## 3. 受入条件（AC-1〜AC-10・番号付き列挙と検証手段）

> 正本は `_shared-context.md` §5。本 Phase で test/grep の検証手段を併記して固定する。

| AC | 要旨 | 検証手段 |
| --- | --- | --- |
| **AC-1** | 英語表記（R-01〜R-10）が全て日本語へ置換され画面に英語が残らない | `grep -rnE "PRIMARY\|TREND\|DETAIL\|TOP ?10\|ADMIN / DASHBOARD\|3M\|6M\|1Y\|CSV"`（attendance feature + route）が 0 件 |
| **AC-2** | 「セッション」（S-01〜S-10）が全て「開催回」系へ置換 | `grep -rn "セッション"`（同範囲）が 0 件 |
| **AC-3** | エンジニア専門語（J-01〜J-12: トレンド / ユニーク / KPI / 区画 / 帯 / pt）が平易日本語へ置換（画面 / aria-label / SR 文言含む） | `grep -rnE "トレンド\|ユニーク\|区画\|KPI\|出席回数帯\|pt(?![a-z])"`（同範囲）が 0 件 |
| **AC-4** | 見やすさ微調整（U-01〜U-03）が反映・DOM 構造 / testid / href は不変 | vitest（DOM 構造・testid 維持）＋ Phase 11 screenshot（視覚） |
| **AC-5** | 全色 OKLch トークン経由・HEX 0 件・新規 token 0 | `pnpm verify:tokens`（`verify-design-tokens` gate）pass |
| **AC-6** | 新規 primitive / component 追加ゼロ | `git diff --name-only` に新規 `.tsx` component なし（既存ファイル編集のみ） |
| **AC-7** | API / D1 / Form / shared 型 変更ゼロ | `git diff --name-only -- apps/api packages/shared` が空 |
| **AC-8** | testid / `data-*` / `href` / `role` / `aria-*` の構造保持（aria-label の文言変更は意図的・属性キーは維持） | vitest（既存 testid / role を維持して pass）＋ change-map の属性キー不変確認 |
| **AC-9** | 既存テスト（T-01〜T-06）が After 文言へ追従し focused vitest PASS・回帰テスト追加 | `vitest run --root=. --config=vitest.config.ts apps/web/src/features/admin/attendance/__tests__` が PASS |
| **AC-10** | 既存全機能が挙動不変（フィルタ / 書き出し / modal / テーブル / degrade） | vitest（degrade・タブ排他）＋ 手動（フィルタ・ダウンロード URL 不変） |

すべての AC が test または grep / gate に 1:1 でマップ可能であることを確認済み（Phase 7 の AC マトリクスへ引き継ぐ）。

---

## 4. VISUAL タスク宣言（[Feedback 3] / [Feedback W1-02b-1]）

- 本タスクは **VISUAL**（UI 表示文言の変更 + 軽微レイアウト調整あり）である。
- Phase 11 で staging スクリーンショットを取得し、文言の日本語化が視認上適切であることを目視確認する（user-gated）。
- `visualEvidence: "VISUAL"`（`VISUAL_ON_EXECUTION` ではない。後者は NON_VISUAL 扱いになる罠）。
- visual snapshot baseline（`playwright/tests/visual/admin-shell/dashboard-attendance.spec.ts`）は文言変更で差分が出るため、再取得要否を Phase 4 で判定する（MINOR M-2）。

---

## 5. 既存テスト追従リスト（T-01〜T-06・同一 wave 必須・[FB-TASK-01/02]）

| # | テストファイル | 現アサート（Before 依存） | 追従後 | 対応リネーム |
| --- | --- | --- | --- | --- |
| T-01 | `AttendanceZoneDistributionChart.spec.tsx` | `getByRole("group", { name: "出席回数帯別分布" })` / `getByText(/各メンバーの累計出席回数/)` | `name: "出席回数べつの人数"` / 新 `ZONE_HELP` 前方一致 | J-09 / J-11 |
| T-02 | `AttendanceDetailTabs.spec.tsx` | `getByRole("radio", { name: "TOP10" })`（3 箇所） | `name: "出席が多い順"` | R-07 |
| T-03 | 〃 | `getByText(/セッション別出席状況.*読み込みに失敗しました/)` | `/開催回ごとの出席状況.*/` | S-07 |
| T-04 | 〃 | `getByText(/出席ランキング TOP 10.*読み込みに失敗しました/)` | `/出席が多い人の一覧.*/` | R-08 |
| T-05 | `playwright/.../admin-attendance-dashboard-ux.spec.ts` | `getByText('出席回数帯別分布')` | `getByText('出席回数べつの人数')` | J-09 |
| T-06 | 〃 | `getByText('出席回数帯は、各メンバーの累計出席回数')` | `getByText('各メンバーがこれまでに参加した合計回数')` | J-11 |

> 補足: `AttendanceDetailTabs.spec.tsx` の error 文言アサート（`会員別出席率`）は変更しない（S/J 対象外・member タブの sectionLabel は据置）。

---

## 6. 実装事実との照合メモ（drift 防止・Phase 5 が逐語正本を持つための注記）

実コードを Read で確認した結果、`_shared-context.md` §2 の表と実コードの間に以下の軽微な差異があるため、Phase 2 change-map で実コード行を正として吸収する（リネームの方向性は §2 が正本）:

- **eyebrow（R-01）**: `page.tsx` 29 行の `AdminPageHeader eyebrow="ADMIN / DASHBOARD"`。同 31 行 `description="...区画分布..."` の「区画」も J-08 系で平易化対象に含める。
- **KpiPanel 実ラベル**: 実コードは `全体出席率` / `期間内延べ出席数` / `平均出席数` / `セッション数`。S-01 は `セッション数`→`開催回数`、J-12 は hint `セッション別出席者数の合計`→`開催回ごとの出席者数を合計した数`。
- **J-04 aria-label**: 実コードは `aria-label="出席KPI補助指標"`（56 行）→ `出席のおもな指標`。
- **AbsenteeAlert（S-04/S-05/U-01）**: empty は別 `<div>`（12-24 行）、warn は `<details>`（25-49 行）の 2 分岐。両方に `直近 {N} セッション...` があるため両方追従する。
- **page.tsx 案内文 vs AnalyticsPage 案内文**: 実際の長文案内（`期間と出席回数帯で絞り込み...`）は `AttendanceAnalyticsPage.tsx` 30-32 行にある。ここの `出席回数帯` / `累計出席回数` も J 系で平易化する。

> これらは「リネームの追加」ではなく「§2 の方針を実コード行に正確にマップした」もの。Phase 2 change-map が逐語の唯一の正となる。

---

## 7. スコープ外（今サイクルでは扱わない）

- 3 ゾーン構造そのものの作り替え・カード配置の大規模変更・チャート表現の刷新（Q3 = 微調整を選択）。
- 新 endpoint を要する集計・データ追加（会員ごとの直近 N 回出席フラグ一覧 等）。API 変更が必要で invariant 違反となる。
- 既に平易な日本語の文言（`MemberAttendanceTable` / `AttendanceTop10Ranking` / `AttendanceDrilldownModal` / `ZONE_LABEL`）。
