# Phase 7 — AC トレーサビリティマトリクス

> AC-1〜AC-10（_shared-context §5 正本）× 検証（T-NN / TC-RXX / TC-E-XX / gate）× 実装ファイル の 1:1 対応。
> 担保区分: **[TEST]** = vitest TC で検証 / **[GATE]** = CI / ローカル機械検証（verify-design-tokens / shared diff / 残存 grep）/ **[VISUAL]** = Phase 11 screenshot で目視。

## 1. AC × 検証 × 実装ファイル マトリクス

| AC | 受入内容（要約） | 担保 検証 | 実装ファイル（Phase 5） | 担保区分 |
| --- | --- | --- | --- | --- |
| **AC-1** | 英語表記（R-01〜R-10）が全て日本語化・画面に英語残存 0 | TC-R01（PERIOD ラベル）/ TC-R05/R05b（DetailTabs radio）/ T-02 / 残存 grep TC-E-01/E-02 | `page.tsx` / `AttendanceAnalyticsPage.tsx` / `AttendanceDetailTabs.tsx` / `AttendanceFilterBar.tsx` / `format-attendance.ts` | [TEST] + [GATE]（残存 grep） |
| **AC-2** | 「セッション」（S-01〜S-10）が全て「開催回」系へ・残存 0 | TC-R02（開催回数）/ TC-R05（開催回ごと）/ T-03 / TC-E-11/E-12（回つづけて欠席）/ 残存 grep TC-E-03 | `KpiPanel.tsx` / `AttendanceAbsenteeAlert.tsx` / `AttendanceDetailTabs.tsx` / `SessionAttendanceTable.tsx` / `AttendanceTrendChart.tsx` / `AttendanceAnalyticsPage.tsx` | [TEST] + [GATE]（残存 grep） |
| **AC-3** | 専門語（J-01〜J-12: トレンド/ユニーク/KPI/区画/帯/pt）が平易日本語へ | TC-R03（一度でも参加した人の割合）/ TC-R06（ポイント）/ TC-R08（出席回数べつの人数）/ T-01/T-05/T-06 / 残存 grep TC-E-04/E-05 | `KpiPanel.tsx` / `AttendanceTrendChart.tsx` / `AttendanceZoneDistributionChart.tsx` / `AttendanceFilterBar.tsx` / `format-attendance.ts` / `AttendanceAnalyticsPage.tsx` | [TEST] + [GATE]（残存 grep） |
| **AC-4** | 見やすさ微調整（U-01〜U-03）反映・DOM 構造/testid/href 不変 | TC-D01（testid/role/href 維持）/ 構造アサート | `AttendanceAbsenteeAlert.tsx` / `globals.css`（U-03） | [TEST]（構造）+ [VISUAL]（Phase 11 視覚） |
| **AC-5** | 全色 OKLch トークン経由・HEX 0・新規 token 0 | （gate で担保） | `globals.css`（U-03 追加分・必要時）/ 全 attendance component | [GATE]（`verify-design-tokens` / Phase 9 token-audit） |
| **AC-6** | 新規 primitive / component 追加ゼロ | （gate で担保） | 新規ファイルなし（全て既存編集） | [GATE]（`git diff --name-only` に新規 component 無し） |
| **AC-7** | API / D1 / Form / shared 型 変更ゼロ | （gate で担保） | `apps/api` / `packages/shared` diff 空・`fetch-attendance.ts` 不変 | [GATE]（`git diff --name-only -- apps/api packages/shared` 空） |
| **AC-8** | testid / `data-*` / `href` / `role` / `aria-*` キー保持（aria-label 文言変更は意図的） | TC-D01 / TC-D-KPI（aria-label `出席のおもな指標` で role 維持）/ T-01/T-02（role で取得継続） | 全 attendance component | [TEST] |
| **AC-9** | 既存テスト（T-01〜T-06）が After 文言追従・focused vitest PASS・回帰追加 | T-01〜T-06 + TC-R01〜R08 + TC-E-07/E-08/E-11/E-12 | `__tests__/*` + `playwright/*`（追従 + 回帰） | [TEST] |
| **AC-10** | 既存全機能 挙動不変（フィルタ / 書き出し / modal / テーブル / degrade） | TC-R01b（monthsBack 不変）/ TC-D02（タブ排他・value 不変）/ TC-D01（href 不変）/ TC-E-06〜E-09（degrade 新文言・挙動不変） | `format-attendance.ts`（PRESETS）/ `AttendanceFilterBar.tsx`（href）/ `AttendanceDetailTabs.tsx`（排他）/ `AttendanceAnalyticsPage.tsx`（degrade）/ `SessionAttendanceTable.tsx`（modal） | [TEST] |

## 2. 担保区分の集計

| 区分 | 該当 AC | 検証手段 |
| --- | --- | --- |
| [TEST]（vitest） | AC-1, AC-2, AC-3, AC-4, AC-8, AC-9, AC-10 | Phase 4/6 の追従 + 回帰 + degrade spec |
| [GATE]（機械検証） | AC-1, AC-2, AC-3（残存 grep）/ AC-5（verify-design-tokens）/ AC-6（新規追加なし）/ AC-7（shared diff 空） | Phase 9 で機械検証 |
| [VISUAL]（screenshot） | AC-4 | Phase 11 staging visual smoke（baseline 再取得・M-2） |

> AC-5 / AC-6 / AC-7 は性質上 vitest TC では担保しきれない（CSS literal / 新規ファイルの有無 / リポジトリ diff）ため、**主担保は GATE**。これは未カバーではない（gate で 1:1 マップ済み）。

## 3. 未カバー AC ゼロ宣言

- AC-1〜AC-10 のすべてが [TEST] または [GATE] に **1 件以上マップされ、空セルが存在しない**。
- **未カバー AC: 0 件**。
- Phase 7 完了条件を満たす。1 件でも空セルが生じた場合は Phase 4（TC 追加）または Phase 5（実装追加）に差し戻す。

## 4. MINOR 連携（Phase 3 → Phase 4/5/11）

| MINOR | カバレッジ上の確認 | 紐づく AC |
| --- | --- | --- |
| M-1（ZONE_HELP 変更で Playwright 前方一致破壊） | T-06 が新文言前方一致へ追従済み | AC-9 |
| M-2（visual baseline 差分） | Phase 11 で baseline 再取得（意図的差分・user-gated） | AC-4 |
| M-3（延べ出席数 label の平仮名化） | TC-R04b で hint 補足を確認 | AC-3 |
| M-4（くわしい一覧の「テーブル」） | 任意改善（change-map §2.2 行 100）。必須カバー対象外 | AC-1（任意） |
