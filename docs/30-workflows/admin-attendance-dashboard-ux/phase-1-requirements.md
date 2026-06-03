# Phase 1: 要件定義

## メタ情報

- task_id: `admin-attendance-dashboard-ux`
- taskType: `implementation`
- visualEvidence: `VISUAL`（出席ダッシュボードの見た目・レイアウトが変わる）
- implementation_mode: `edit`（既存コンポーネント / globals.css を編集。新規ファイルはテストのみ）
- spec_classification: `implementation_spec`
- 実装区分: **[実装区分: 実装仕様書]** — コード変更を伴う（CONST_004 デフォルト）
- workflow_state: `implemented_local_runtime_pending`（apps/web 実装・focused vitest は完了。staging 視覚証跡 / PR は user-gated）

## 実装区分の判定根拠（CONST_004）

ユーザー依頼は「UI/UX が崩れている・用途が分からない・見方が分からない／数式や機能に問題があれば改善」。
これは **CSS 崩れの修正・表示ロジック・ラベル是正・説明テキスト追加** を伴い、
「動作させる・改善する・修正する」目的がコード変更なしには達成不能。よって **実装仕様書** とする。

## P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
| --- | --- | --- |
| current branch / dev に本改善が実装済みか | No（`globals.css` に `.attendance-*` レイアウト CSS が不在） | 通常の実装 Phase とする |
| 出席ダッシュボードのコンポーネントは存在するか | Yes（`apps/web/src/features/admin/attendance/` 一式が稼働中） | 既存編集（`implementation_mode: edit`） |
| API endpoint は揃っているか | Yes（`apps/api/src/routes/admin/dashboard.ts` の 8 endpoint が稼働） | API 非変更（不変条件 #1 #5 厳守） |

## 背景（スクリーンショットから確認された現象）

staging `/(admin)/admin/dashboard/attendance`（「出席分析 / 出席ダッシュボード」）で以下の UI/UX 崩れが発生:

1. **レイアウト総崩れ**: KPI（全体出席率・期間内出席者数・平均出席数・セッション数）、フィルタバー
   （期間ボタン・区画チェックボックス・CSVエクスポート）、各セクション見出しが**素のブロック積み上げ**で表示。
   カード化・グリッド整列・余白が一切効いていない。
2. **区画別分布バー / 出席ランキングバーが巨大な楕円に潰れる**: 0% / 低い値のバーが横長楕円のブロブとして表示。
3. **「区画（0→1 区画 / 1→10 区画 / 10→100 区画）」の意味が不明**: 用語・境界とも非直感的で「見方が分からない」。
4. **KPI ラベルの不整合**: 「期間内出席者数」の補足が「unique 出席者」だが実値は延べ出席数で、定義とラベルが食い違う。
5. **空状態が素テキスト**: 「トレンドデータがありません」等がスタイルなしで、壊れ／用途不明感を助長。

## 根本原因（コード調査で確定）

| 現象 | 根本原因 | 該当箇所 |
| --- | --- | --- |
| レイアウト総崩れ | コンポーネントは `.attendance-kpi-grid` / `.attendance-kpi-card` / `.attendance-filter-bar` / `.attendance-period-filter` / `.attendance-zone-filter` / `.attendance-charts-grid` / `.attendance-zone-distribution` / `.attendance-zone-row` / `.attendance-top10` / `.attendance-session-table` / `.attendance-member-table` / `.attendance-absentee-alert` 等のセマンティッククラスを使うが、**`globals.css` にこれらの CSS ルールが一切定義されていない**（定義済みは `.attendance-status-pill` 系のみ） | `apps/web/src/styles/globals.css`（`@layer components` に未配線） |
| バーが楕円に潰れる | `.attendance-zone-bar` / `.attendance-top10-bar` の `<svg>` に **CSS 寸法指定がなく** replaced 要素デフォルト（≈300×150px）で描画 → `viewBox="0 0 100 8"` + `preserveAspectRatio="none"` で縦に引き伸ばされ、`rx="4"` の角丸が楕円化。さらに区画バーは `width={Math.max(2, row.rate * 100)}` で 0% でも 2 単位幅の角丸が残る | `AttendanceZoneDistributionChart.tsx:27-40` / `AttendanceTop10Ranking.tsx:22-35` |
| 区画の意味不明 | `ZONE_LABEL` が `"0→1 区画"` 等で、`zoneFromCount`（0 回→`0→1`, 1〜9 回→`1→10`, 10〜99 回→`10→100`）の出席回数帯であることが UI から読み取れない。凡例も説明もない | `format-attendance.ts:15-20`（label）/ `attendance-analytics.ts:48-53`（境界・**API 側・本タスク非変更**） |
| KPI ラベル不整合 | `attendeeCount` = `bySession` の `attendeeCount` 合計（= 延べ出席数）だが hint が「期間内 unique 出席者」 | `KpiPanel.tsx:37-42` |

## 要件（スコープ＝apps/web のみ・不変条件 #1 #5 厳守）

出席ダッシュボードを「直感的に意味と見方が分かる」状態へ是正する。**API（apps/api）/ D1 schema / Google Form schema / endpoint surface は一切変更しない**。
データ shape が UI 期待と乖離する箇所は UI 側の表示・ラベル・補助テキストで吸収する（CLAUDE.md「UI 側に adapter 層」方針）。

### 是正の 4 本柱

1. **レイアウト復旧（最重要）**: `.attendance-*` レイアウトクラス群に `@layer components` 末尾追加で CSS を定義し、
   KPI のカードグリッド / フィルタバー / 2 カラムチャートグリッド / 区画分布 / Top10 / テーブル / フォローアップを
   整列・カード化・適切な余白で表示する。色は `var(--ubm-color-*)` 経由のみ（HEX 直書き / `bg-[#xxx]` 禁止）。
2. **バー潰れ修正**: 区画分布バー・Top10 バーの `<svg>` に CSS で `width:100%; height` を固定し、
   `preserveAspectRatio` と幅計算を見直して 0% は 0 幅、低値でも楕円化しない横棒として描画する。
3. **「区画」→「出席回数帯」言い換え＋凡例**: 用語を「出席回数帯」に改め、ラベルを現行境界に忠実な回数表記
   （`0 回（未出席）` / `1〜9 回` / `10〜99 回` / `100 回以上`）にする。区画分布セクションに
   「出席回数帯とは（各メンバーの累計出席回数で分類）」の凡例キャプションを追加。**境界ロジック（`zoneFromCount`）は変更しない**。
4. **「見方」の明示と KPI 是正**: ダッシュボード冒頭と各セクションに 1 行の見方ガイドを置き、
   KPI の不整合ラベル（unique → 延べ）を実値に整合させ、各 KPI に用途が分かる短い説明を付す。空状態をスタイル付きに。

## Acceptance Criteria

| ID | 条件 | 検証 Phase |
| --- | --- | --- |
| AC-1 | `globals.css` の `@layer components` 末尾に `.attendance-*` レイアウト CSS が追加され、KPI がカードグリッド、フィルタバーが横並び整列、チャートグリッドが 2 カラム（狭幅で 1 カラム）で表示される | Phase 4/5/9/11 |
| AC-2 | `.attendance-zone-bar` / `.attendance-top10-bar` が CSS で `width:100%` かつ固定高さ（例 `height: 0.5rem`）の横棒として描画され、0% バーが楕円化しない。区画バーの `Math.max(2, …)` を 0 許容へ是正 | Phase 5/6/9/11 |
| AC-3 | `ZONE_LABEL` が回数表記（`0 回（未出席）` / `1〜9 回` / `10〜99 回` / `100 回以上`）に更新され、フィルタ legend が「区画」→「出席回数帯」になり、区画分布セクションに凡例キャプションが表示される | Phase 5/6/9/11 |
| AC-4 | KPI「期間内出席者数」のラベル/補足が実値（延べ出席数）と整合し、4 KPI すべてに用途が分かる説明が付く | Phase 5/6/9/11 |
| AC-5 | ダッシュボード冒頭の見方ガイド・各セクションの 1 行説明・スタイル付き空状態が追加される | Phase 5/9/11 |
| AC-6 | 色は `var(--ubm-color-*)` 経由のみ。`apps/web/src` 配下に HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` の新規追加なし。`pnpm verify:tokens` green | Phase 6/7/9 |
| AC-7 | API（`apps/api`）/ D1 migration / Google Form schema / endpoint surface / fetch URL が **無変更**（不変条件 #1 #5）。`apps/api` の git diff 空 | Phase 9 |
| AC-8 | `pnpm typecheck && pnpm lint && focused vitest` が green。既存 spec 更新 + 新規 spec が AC-2/3/4 を検証 | Phase 9/10 |
| AC-9 | 出席回数帯の**境界そのものの是正**・**出席率/出席者数の定義見直し**（数式の妥当性）は別タスク仕様書 `unassigned-task-specs/admin-attendance-analytics-calc-correction.md`（apps/api）に分離し、理由・実施場所が明記されている | Phase 12 |

## スコープ境界（CONST_007: 1 サイクル完結 + ユーザー指示による分離）

- **本サイクルで完結**: 上記 AC-1..AC-8（すべて `apps/web` の UI/UX・表示ロジック・ラベル・CSS・テスト）。1 つの実装サイクル（03.実装.md）で完了可能。
- **別タスクに分離（ユーザー Q1 = 「両方を別タスクに分離」指示）**: `apps/api/src/repository/attendance-analytics.ts` の
  - 出席回数帯の境界設計（`0→1 / 1→10 / 10→100` という区切り自体の妥当性）
  - 全体出席率の定義（`attendCount / (totalSessions × totalMembers)`）と「延べ vs unique」の集計是正
  これらは計算意味論（純関数の挙動）を変えるため回帰リスクがあり、ユーザー指示により**別タスク**として `unassigned-task-specs/` に Issue-ready 仕様で切り出す（CONST_007 例外条件: ユーザー明示の分離指示 + 実施場所明記）。
  本タスクの UI ラベルは**現行境界に忠実**に振る（境界を変えずに正確に説明する）ため、両タスクは独立して安全に実装できる。

## 既存コードベースの命名規則

| 対象 | 規則 | 実例 |
| --- | --- | --- |
| feature ディレクトリ | `apps/web/src/features/admin/<feature>/` | `attendance/components` `attendance/lib` `attendance/hooks` |
| component ファイル | PascalCase | `KpiPanel.tsx` / `AttendanceZoneDistributionChart.tsx` |
| test ファイル | co-location `*.spec.ts(x)`（不変条件 #8: `*.test.*` 禁止） | `__tests__/format-attendance.spec.ts` |
| CSS セマンティッククラス | `attendance-<part>` kebab | `.attendance-kpi-card` / `.attendance-zone-row` |
| デザイントークン | `--ubm-color-*` / `--ubm-space-*` / `--ubm-radius-*` | `var(--ubm-color-accent)` |

## 参照資料

| 種別 | Path | 用途 |
| --- | --- | --- |
| ページ本体 | `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` | SSR エントリ |
| メインコンテナ | `apps/web/src/features/admin/attendance/components/AttendanceAnalyticsPage.tsx` | 編集対象（見方ガイド / 空状態） |
| KPI | `apps/web/src/features/admin/attendance/components/KpiPanel.tsx` | 編集対象（ラベル是正・説明） |
| フィルタ | `apps/web/src/features/admin/attendance/components/AttendanceFilterBar.tsx` | 編集対象（legend rename） |
| 区画分布 | `apps/web/src/features/admin/attendance/components/AttendanceZoneDistributionChart.tsx` | 編集対象（バー修正・凡例） |
| Top10 | `apps/web/src/features/admin/attendance/components/AttendanceTop10Ranking.tsx` | 編集対象（バー修正） |
| ラベル定数 | `apps/web/src/features/admin/attendance/lib/format-attendance.ts` | 編集対象（`ZONE_LABEL`） |
| CSS 正本 | `apps/web/src/styles/globals.css` / `apps/web/src/styles/tokens.css` | 編集対象（globals）/ 参照（tokens） |
| 区画境界（API・非変更） | `apps/api/src/repository/attendance-analytics.ts:48-53` | 凡例の正確な文言根拠 |
| 既存 test | `apps/web/src/features/admin/attendance/__tests__/format-attendance.spec.ts` / `AttendanceTrendChart.spec.tsx` | 更新 / 追加対象 |

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| design-tokens | `.claude/skills/aiworkflow-requirements/references/` 内 design tokens / UI 仕様 | OKLch トークン正本・HEX 禁止不変条件 |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | admin ナビ / 画面構成の正本 |

> 注: 参照ファイル名は Phase 2 で `aiworkflow-requirements` の resource-map から確定する。

## 完了条件

AC-1..AC-9 が Phase 2 以降へ trace され、`artifacts.json` に `taskType` / `visualEvidence` / gates が記録されている。
本タスクは UI/UX（apps/web）に閉じ、計算ロジック是正は別タスク仕様書へ分離済みであること。
