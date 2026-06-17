# Phase 8 リファクタリング — 重複文言の単一化・命名一貫性確認

> 本タスクは新規ロジックを持たない文字列リネーム（R/S/J/U）中心のため、リファクタの主眼は**構造変更ではなく「同一概念の日本語を 1 表現へ単一化し、Before 文字列の残骸を除去する」**ことにある。DOM 構造・testid・role・aria キー・定数キー・型は一切変更しない（AC-4/AC-7/AC-8）。

## 1. 重複文言の単一化方針（concept → 1 表現）

リネーム後に**同一概念が複数表現へ分岐する**と、非エンジニアの読み手に「別の指標か」と誤解させる。以下 3 概念をファイル横断で唯一表記に統一する。

| 概念 | 唯一の正表記（After） | 影響ファイル / 箇所 | 単一化の要点 |
| --- | --- | --- | --- |
| 開催 1 回 = session | **開催回** | `KpiPanel.tsx`（開催回数 / 1回の開催あたり）/ `AttendanceDetailTabs.tsx`（開催回ごと）/ `SessionAttendanceTable.tsx`（開催回のデータ）/ `AttendanceTrendChart.tsx`（開催 N 回）/ `AttendanceAnalyticsPage.tsx`（開催回数）/ `AttendanceAbsenteeAlert.tsx`（N 回つづけて欠席） | 「開催数」「開催回数」「開催回ごと」「N 回」は語幹を **開催回** に統一。`セッション`/`回`の混在を残さない（S-01〜S-10 の After 群が同一語幹であること） |
| trend = 推移 | **出席の移り変わり** | `AttendanceAnalyticsPage.tsx`（TREND ゾーン h2＝R-03）/ `AttendanceTrendChart.tsx`（aria-label＝J-01） | ゾーン見出し（h2）と内部チャートの aria-label を同一語へ揃える。「トレンド」カタカナを残骸として残さない |
| zone = 累計出席回数のバケット | **出席回数べつ**（人数の文脈） | `AttendanceAnalyticsPage.tsx`（TREND 内 h3＝R-06）/ `AttendanceZoneDistributionChart.tsx`（aria-label＝J-09・empty＝J-08） | 「出席回数帯別分布」「区画別分布」を **出席回数べつの人数** に統一。`AttendanceFilterBar.tsx` の legend は「累計の出席回数」（J-10）で文脈に応じて使い分けるが、いずれも「帯」「区画」を残さない |

## 2. 命名ドリフトを生まない方針（識別子は不変）

| 区分 | 扱い | 理由 |
| --- | --- | --- |
| コンポーネント名（PascalCase） | **不変** | `AttendanceAnalyticsPage` 等は API/import 契約。新規 component を作らない（AC-6） |
| 関数名（camelCase） | **不変** | `formatDelta` / `buildExportUrl` 等のシグネチャは変えない。`formatDelta` は戻り文字列の単位表記（`pt`→`ポイント`）のみ変更（J-07） |
| 定数キー | **不変** | `DETAIL_OPTIONS` / `PERIOD_PRESETS` / `ZONE_LABEL` 等のキーは英語のまま。**`label` 値のみ**日本語化する |
| CSS クラス（`.attendance-*`） | **原則不変** | U-03 は既存セレクタへの property 追加に留め、新規クラスを増やさない |
| testid / `data-*` / `href` / `role` / `aria-*` キー | **不変** | DOM contract（AC-8）。aria-label の**値**は J-04/J-09 等で意図的に日本語化するが、属性キーと役割は維持 |

> 本サイクルで**新規識別子（component / primitive / hook / util / CSS クラス）はゼロ**。リファクタは「既存の表示文字列・aria-label 値を単一表記へ揃える」操作に限定される（[FB-SDK-07-4] 命名ドリフト発生源を持たない）。

## 3. Before 文字列の残骸除去（機械洗い出し）

実装（Phase 5）でリネーム適用後、Before 文字列が**画面表示以外**（コメント / 定数の補足文 / テスト記述名 / aria-label 値）に残骸化していないかを grep で洗い出す。

```bash
grep -rnE "PRIMARY|TREND|DETAIL|TOP ?10|ADMIN / DASHBOARD|セッション|ユニーク|トレンド|区画|出席回数帯|CSVエクスポート" \
  apps/web/src/features/admin/attendance \
  apps/web/app/\(admin\)/admin/dashboard/attendance
```

| ヒット分類 | 扱い |
| --- | --- |
| 画面表示テキスト / aria-label 値 | リネーム済み（After）であること（残骸なら修正） |
| コメント / テスト記述名（`describe`/`it`） | After 系へ揃える（テスト名の表記揺れも単一化対象） |
| 定数キー（`DETAIL_OPTIONS` 等）/ 型名 / testid | **不変で正**（ヒットしても変更しない） |

> 期待: 画面表示・aria-label・コメント・テスト名のヒットが After 系のみ（Before 文字列の残骸 0 件）。定数キー由来のヒットは許容。

## 4. 軽微 CSS（U-03）の重複ルール削減

- 文言が長くなる箇所（`表計算ファイルで書き出す` 等）の折返し / はみ出し回避は、**既存 `.attendance-*` セレクタへの `white-space` / `gap` property 追加**に留め、同義の新規クラスを作らない。
- 追加・変更する全プロパティが `var(--ubm-color-*)` / `var(--ubm-space-*)` / `var(--ubm-radius-*)` 経由であること（HEX / 生 px 直書き禁止＝AC-5）。
- 重複ルール（同一セレクタの property 二重定義）を作らないことを Phase 9 token-audit の前提とする。

## 5. 挙動不変の総合確認（全行共通）

| 確認軸 | 手段 |
| --- | --- |
| 機能不変 | Phase 7 の focused vitest を全件再実行し全 PASS（`vitest run --root=. --config=vitest.config.ts apps/web/src/features/admin/attendance/__tests__`） |
| DOM contract 不変 | testid / role / aria キーを grep で確認・維持（aria-label 値の変更は意図的） |
| token 不変 | Phase 9 token-audit（HEX ゼロ）+ `verify-design-tokens` gate |
| 視覚差分 | Phase 11 screenshot で「文言日本語化の意図した変化のみ」を確認 |
| API/D1/shared 不変 | `git diff --name-only` に `apps/api` / `packages/shared` が現れない（AC-7） |
