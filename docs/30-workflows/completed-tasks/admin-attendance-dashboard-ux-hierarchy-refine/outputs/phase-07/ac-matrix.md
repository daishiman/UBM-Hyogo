# Phase 7 AC トレーサビリティマトリクス

> AC-1〜AC-10（_shared-context §6 正本）× Phase 4 検証（TC-XX）× Phase 5 実装ファイル の 1:1 対応。各 AC が「どの TC で / どの実装ファイルで」担保されるかを明示し、**未カバー AC が 0 件**であることを確認する。
>
> 担保区分: **[TEST]** = vitest TC で検証 / **[GATE]** = CI/ローカル機械検証で担保 / **[VISUAL]** = Phase 11 screenshot で目視担保。

## 1. AC × TC × 実装ファイル マトリクス

| AC | 受入内容（要約） | 担保 TC（Phase 4） | 実装ファイル（Phase 5） | 担保区分 |
| --- | --- | --- | --- | --- |
| **AC-1** | PRIMARY ヒーロー（①出席率 `--ubm-text-3xl` + delta + unique ／ ②要フォロー数）が最上部に配置 | TC-C-HERO-01（出席率特大値 + delta + unique 描画）／ TC-I-LAYOUT-01（PRIMARY が filter 直下・最上部） | `KpiPanel.tsx`（hero 再編）／ `AttendanceAnalyticsPage.tsx`（PRIMARY 配置）／ `AttendanceAbsenteeAlert.tsx` | [TEST] + [VISUAL] |
| **AC-2** | 3 層（PRIMARY/TREND/DETAIL）が見出し・余白・サーフェスで区別。h1>h2>h3 | TC-I-LAYOUT-02（3 ゾーンの h2 存在）／ TC-I-A11Y-01（見出し階層 h1>h2>h3） | `AttendanceAnalyticsPage.tsx`（3 ゾーンラッパー）／ `globals.css`（`.attendance-zone-*`） | [TEST] + [VISUAL] |
| **AC-3** | DETAIL 3 表が Segmented タブで統合・排他表示・初期スクロール削減 | TC-C-TABS-01/02/03（session/member/top10 排他）／ TC-C-TABS-04（初期 session） | `AttendanceDetailTabs.tsx`（新規）／ `SessionAttendanceTable.tsx` / `MemberAttendanceTable.tsx` / `AttendanceTop10Ranking.tsx` | [TEST] |
| **AC-4** | 要フォローが PRIMARY で強調。0 名=neutral/ok、1+=warn。`data-attendance-follow`、新規 token なし | TC-U-FOLLOW-01（0→none）／ TC-U-FOLLOW-02（1+→warn）／ TC-C-FOLLOW-01/02（属性反映） | `lib/format-attendance.ts`（`attendanceFollowLevel`）／ `AttendanceAbsenteeAlert.tsx`（`data-attendance-follow`）／ `globals.css`（セレクタ） | [TEST] + [GATE]（token） |
| **AC-5** | 全色 OKLch トークン経由。HEX / `bg-[#xxx]` / `text-[#xxx]` ゼロ | （TC ではなく gate で担保） | `globals.css`（attendance ブロック）／ 全 attendance component | [GATE]（`verify-design-tokens` / Phase 9 token-audit） |
| **AC-6** | 新規 primitive 追加ゼロ。既存 primitive のみ | TC-C-TABS-05（`AttendanceDetailTabs` が `Segmented` を内部利用） | `components/` 配下に新規追加なし（`AttendanceDetailTabs` は feature 層） | [TEST] + [GATE]（Phase 9 §AC-6 確認） |
| **AC-7** | API endpoint / D1 / Form / shared 型 変更ゼロ | （gate で担保） | `apps/api` / `packages/shared` diff ゼロ・`fetch-attendance.ts` 不変 | [GATE]（Phase 9 `git diff --name-only`） |
| **AC-8** | レスポンシブ維持。mobile 1col → lg 2col（既存 grid utility） | TC-I-RESP-01（PRIMARY `grid-cols-1 lg:grid-cols-2`）／ TC-I-RESP-02（TREND 2col grid クラス存在） | `AttendanceAnalyticsPage.tsx`（grid utility）／ `globals.css` | [TEST] + [VISUAL] |
| **AC-9** | a11y 維持・向上。h1>h2>h3、`aria-label`/`aria-labelledby`、focus ring、WCAG AA。Segmented `role="radiogroup"` | TC-I-A11Y-01（見出し階層）／ TC-I-A11Y-02（ゾーン `aria-labelledby`）／ TC-C-TABS-06（`role="radiogroup"`/`radio`） | `AttendanceAnalyticsPage.tsx`（aria）／ `AttendanceDetailTabs.tsx`（Segmented role 踏襲） | [TEST] + [VISUAL] |
| **AC-10** | 既存全機能 挙動不変（フィルタ / CSV / modal / テーブル内容 / フッター / degrade） | TC-I-DEGRADE-01（ゾーン単位 degrade）／ TC-U-EXPORT-01（buildExportUrl 不変）／ TC-I-MODAL-01（ドリルダウン不変） | `AttendanceAnalyticsPage.tsx`（degrade）／ `buildExportUrl`（不変）／ `AttendanceDrilldownModal.tsx`（不変） | [TEST] |

## 2. 担保区分の集計

| 区分 | 該当 AC | 検証手段 |
| --- | --- | --- |
| [TEST]（vitest TC） | AC-1, AC-2, AC-3, AC-4, AC-6, AC-8, AC-9, AC-10 | Phase 4/6 の component/integration spec |
| [GATE]（機械検証） | AC-5, AC-6, AC-7 | `verify-design-tokens` / `git diff --name-only` / 新規 primitive 不在確認（Phase 9） |
| [VISUAL]（screenshot） | AC-1, AC-2, AC-8, AC-9 | Phase 11 staging visual smoke（補助確認） |

> AC-5 と AC-7 は性質上 TC では担保しきれない（CSS literal / リポジトリ diff の有無）ため、**主担保は GATE** とし Phase 9 で機械検証する。これは未カバーではない（gate で 1:1 にマップ済み）。

## 3. 未カバー AC ゼロ宣言

- AC-1〜AC-10 のすべてが TC（[TEST]）または機械検証（[GATE]）に **1 件以上マップされ、空セルが存在しない**。
- **未カバー AC: 0 件**。
- Phase 7 完了条件を満たす。1 件でも空セルが生じた場合は Phase 4（TC 追加）または Phase 5（実装追加）に差し戻す。

## 4. MINOR 連携（Phase 3 → Phase 5/Phase 8）

| MINOR | カバレッジ上の確認 | 紐づく AC |
| --- | --- | --- |
| M-1（route 二重 className/testid） | 既存 spec が `attendance-analytics-page` testid に依存しないか grep 確認 → Phase 8 で一元化 | AC-10 |
| M-2（`data-attendance-follow` 命名固定） | TC-C-FOLLOW-01/02 がセレクタ `data-attendance-follow` を検証 | AC-4 |
| M-3（既存 spec 追従） | KpiPanel / TrendChart / ZoneDistribution spec の追従済み確認 | AC-10 |
