# Phase 8 リファクタ Before/After テーブル（[Feedback RT-03]）

> 形式: `対象 / Before / After / 理由 / 挙動不変の確認方法`。本タスクは**構造リファクタではなく文言の単一化**が主のため、DOM ツリーは Before/After で**不変**（AC-4/AC-8）。最低 4 行（開催回の単一化 / aria-label と h2 の表記一致 / Before 文字列の残骸除去 / globals.css 軽微調整の集約）を必須とし、全行に「挙動不変であること」の確認方法を添える。

## 1. リファクタ行テーブル

| # | 対象 | Before | After | 理由 | 挙動不変の確認方法 |
| --- | --- | --- | --- | --- | --- |
| 1 | 「開催回」概念の単一化（S-01〜S-10 横断: `KpiPanel` / `AttendanceDetailTabs` / `SessionAttendanceTable` / `AttendanceTrendChart` / `AttendanceAnalyticsPage` / `AttendanceAbsenteeAlert`） | 「セッション数」「セッション別」「N セッション連続欠席」など `セッション` 語が複数ファイルに分散 | 全箇所で語幹を **開催回**（開催回数 / 開催回ごと / N 回つづけて欠席 / 開催 N 回）に統一。`セッション` を画面・aria・テスト名から一掃 | 同一概念が 1 表現に揃い、非エンジニアが「別指標」と誤解しない（AC-2）。表記揺れの残骸を除去 | (a) `grep -rn "セッション" apps/web/src/features/admin/attendance` が 0 件（AC-2） (b) focused vitest 全 PASS (c) 定数キー（`DETAIL_OPTIONS` 等）は不変＝testid/role 不変 |
| 2 | 「出席の移り変わり」aria-label（J-01）と TREND ゾーン h2（R-03）の表記一致（`AttendanceTrendChart` / `AttendanceAnalyticsPage`） | ゾーン h2 は日本語化されるがチャート aria-label が `出席トレンド`（カタカナ「トレンド」残骸）のまま分岐し得る | h2 と aria-label をともに **出席の移り変わり** に統一。「トレンド」カタカナを残さない | 見出しと読み上げ文言が一致し、スクリーンリーダー利用者にも同一概念が伝わる（AC-3/AC-8） | (a) `grep -rn "トレンド" apps/web/src/features/admin/attendance` が 0 件 (b) `AttendanceTrendChart.spec.tsx` の role/aria アサーション PASS (c) aria 属性キー（`aria-label`）は不変・値のみ変更 |
| 3 | Before 文字列の残骸除去（コメント / テスト記述名 / aria-label 値・全 attendance 配下） | リネーム適用後もコメント・`describe`/`it` 名・aria-label 値に `PRIMARY` / `TREND` / `区画` / `出席回数帯` / `pt` などの Before 文字列が残骸化し得る | 画面表示・aria-label・コメント・テスト名を After 系へ揃える（定数キー・型名・testid は不変で正） | 検索性・保守性の劣化を防ぐ。Before 文字列が残ると AC-1/AC-2 の grep 0 件判定を誤らせる | (a) §3 の横断 grep でヒットが After 系のみ（Before 残骸 0 件） (b) 定数キー由来のヒットは許容と分類 (c) focused vitest 全 PASS |
| 4 | `globals.css` `.attendance-*` 軽微調整（U-03）の集約 | 文言長変更に伴う `white-space` / `gap` 調整を新規クラスや重複ルールで追加し得る | 既存 `.attendance-*` セレクタへの property 追加に集約。新規クラスを作らず、全プロパティ `var(--ubm-*)` 経由 | 重複ルール / 命名ドリフトを生まない。HEX 非増加（AC-5/AC-6） | (a) Phase 9 token-audit（HEX / `bg-[#` / `text-[#` ゼロ）PASS (b) `verify-design-tokens` gate PASS (c) Phase 11 screenshot で視覚差分が「はみ出し解消の意図した変化のみ」 |

## 2. DOM ツリー（Before = After・不変の明示）

```
<main (admin layout)>
  AdminPageHeader (h1: 出席ダッシュボード, eyebrow: 管理 / ダッシュボード)   ← eyebrow 値のみ日本語化(R-01)
  AttendanceAnalyticsPage  [data-testid 不変]
    AttendanceFilterBar                                    ← legend/リンク文言のみ日本語化(R-09/J-10)
    section.attendance-zone-primary  [aria-labelledby 不変]   (h2: 全体の状況)   ← h2 文言のみ(R-02)
      KpiPanel              ← Metric label / hint / aria-label 値のみ(S-01..03/J-03..06/J-12)
      AttendanceAbsenteeAlert  ← summary/empty 文言と行リズムのみ(S-04/S-05/U-01)
    section.attendance-zone-trend    [aria-labelledby 不変]   (h2: 出席の移り変わり) ← h2/intro 文言のみ(R-03/R-05/R-06/S-10/J-02)
      AttendanceTrendChart            ← aria-label/empty/title 文言のみ(J-01/S-09)
      AttendanceZoneDistributionChart ← aria-label/empty 文言のみ(J-08/J-09)
    section.attendance-zone-detail   [aria-labelledby 不変]   (h2: くわしい一覧)  ← h2 文言のみ(R-04)
      AttendanceDetailTabs (Segmented role=radiogroup 不変)  ← option label/sectionLabel のみ(R-07/R-08/S-06/S-07)
        ├─ SessionAttendanceTable   ← empty 文言のみ(S-08)
        ├─ MemberAttendanceTable    ← 変更なし(既に平易)
        └─ AttendanceTop10Ranking   ← 変更なし(ランク記号維持)
```

- **要点**: 3 ゾーン構造・h1>h2>h3 階層・testid・role・aria キー・タブ排他表示はすべて **Before = After で不変**。変更は各ノードの**表示文字列と aria-label の値**、および `lib/format-attendance.ts` の `label`/単位表記に限る。

## 3. 残骸洗い出しコマンドと分類

```bash
grep -rnE "PRIMARY|TREND|DETAIL|TOP ?10|ADMIN / DASHBOARD|セッション|ユニーク|トレンド|区画|出席回数帯|CSVエクスポート" \
  apps/web/src/features/admin/attendance \
  apps/web/app/\(admin\)/admin/dashboard/attendance
```

| ヒット箇所の種類 | 期待 |
| --- | --- |
| 画面表示テキスト / aria-label 値 / コメント / テスト記述名 | After 系のみ（Before 残骸 0 件） |
| 定数キー（`DETAIL_OPTIONS` 等）/ 型名 / testid | 不変で正（許容。変更しない） |

## 4. 挙動不変の総合確認（全行共通）

| 確認軸 | 手段 |
| --- | --- |
| 機能不変 | Phase 7 の focused vitest 全件再実行で全 PASS（`vitest run --root=. --config=vitest.config.ts apps/web/src/features/admin/attendance/__tests__`） |
| DOM contract 不変 | testid / role / aria キーを grep で確認・維持 |
| token 不変 | Phase 9 token-audit（HEX ゼロ）+ `verify-design-tokens` gate |
| 視覚差分 | Phase 11 screenshot で「文言日本語化の意図した変化のみ」 |
| API/D1/shared 不変 | `git diff --name-only` に `apps/api` / `packages/shared` が現れない（AC-7） |
