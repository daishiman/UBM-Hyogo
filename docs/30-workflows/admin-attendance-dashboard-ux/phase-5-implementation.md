# Phase 5: 実装（TDD Green）

## メタ情報

- task_id: `admin-attendance-dashboard-ux`
- 前提: Phase 1（要件・AC-1..AC-9）/ Phase 2（CSS ブロック・ラベル設計・変更 10 ファイル確定）/ Phase 3（設計レビュー PASS）/ Phase 4（テスト計画・TDD Red 確定）
- 本 Phase の責務: Phase 4 で Red 化したテストを green へ転じる実コード変更（CSS 追加・定数更新・コンポーネント局所修正）を、Before→After の具体差分として実装可能粒度で確定する

## 目的

Phase 4 のテスト（ZL-1..5 / ZC-1..6 / KP-1..5）と grep gate（G-1..G-3）を **green** にするための実コード変更を、変更 10 ファイルそれぞれについて「現行コードに一致した Before」と「適用後の After」で示す。
本 Phase は **TDD の Green フェーズ**であり、Phase 4 の Red（`ZONE_LABEL` 旧値・`Math.max(2, …)`・`unique` hint・`ZONE_HELP` 不在）を実装で解消する。
API（`apps/api`）/ D1 schema / Google Form schema / endpoint surface / fetch URL は一切変更しない（AC-7・不変条件 #1 #5）。

## 実行タスク

### 1. 実装順序と各ステップの検証

依存方向（CSS → 定数 → コンポーネント → テスト）に沿って実装し、各ステップ後に検証コマンドを走らせる。
CSS と定数を先に置くことで、コンポーネント修正時に参照先（`.attendance-*` クラス・`ZONE_HELP`）が既に存在する状態を作る。

| 手順 | 対象 | 変更概要 | ステップ後の検証 |
| --- | --- | --- | --- |
| 1 | `apps/web/src/styles/globals.css` | `@layer components` 末尾に `=== attendance dashboard ===` ブロックを追加（AC-1/2/5） | grep gate G-1 / `pnpm verify:tokens` |
| 2 | `apps/web/src/features/admin/attendance/lib/format-attendance.ts` | `ZONE_LABEL` を回数表記へ・`ZONE_HELP` を新規 export（AC-3） | `pnpm typecheck` / `format-attendance.spec.ts`（ZL-1..5） |
| 3 | `apps/web/src/features/admin/attendance/components/AttendanceZoneDistributionChart.tsx` | バー幅 `Math.max(2,…)`→`Math.max(0,…)`・凡例 `<p className="attendance-zone-legend">` 追加（AC-2/3） | `AttendanceZoneDistributionChart.spec.tsx`（ZC-1..6） |
| 4 | `apps/web/src/features/admin/attendance/components/AttendanceTop10Ranking.tsx` | 空状態 `<p>` に `className="attendance-trend-empty"`（CSS 高さ固定で楕円解消・AC-2） | focused vitest 回帰 |
| 5 | `apps/web/src/features/admin/attendance/components/KpiPanel.tsx` | 「期間内出席者数」hint を延べ表記へ・`unique` 撤去・4 KPI に用途 hint（AC-4） | `KpiPanel.spec.tsx`（KP-1..5） |
| 6 | `apps/web/src/features/admin/attendance/components/AttendanceFilterBar.tsx` | `<legend>区画</legend>`→`<legend>出席回数帯</legend>`（AC-3） | `pnpm typecheck` |
| 7 | `apps/web/src/features/admin/attendance/components/AttendanceAnalyticsPage.tsx` | 冒頭 `attendance-page-guide`・各 `<h2>` 直後 `attendance-section-intro`（AC-5） | `pnpm typecheck` / `pnpm lint` |
| 8 | テスト 3 ファイル（Phase 6 で実装） | ZL/ZC/KP ケース反映 | focused vitest 全 PASS |

> 各ステップ後の最小検証コマンド（worktree 直後は事前に `mise exec -- pnpm install` / `mise exec -- pnpm verify:vitest-runtime` を 1 回実施）:
> ```bash
> mise exec -- pnpm typecheck
> mise exec -- pnpm lint
> mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
>   apps/web/src/features/admin/attendance/__tests__
> ```
> 注: 本リポジトリの vitest 設定はルート `vitest.config.ts` に集約されている（`vitest.config.ts` は存在しない）。focused 実行は `--config=vitest.config.ts` を用い、`include` glob（`apps/**/__tests__/**/*.spec.{ts,tsx}`）で attendance spec が収集される。

### 2. globals.css への CSS ブロック追加（手順 1・AC-1/2/5/6）

**配置位置**: `apps/web/src/styles/globals.css` の `@layer components { … }` 内、末尾の
`/* === parallel-09 G9-7 focus-visible / reduced motion === */` ブロック（現行 L1993 付近）の **直前**。
既存 `.attendance-status-pill`（L663-700）と同じセマンティック component class 方式を踏襲する。
色は `var(--ubm-color-*)` 経由のみ（HEX / oklch 直書き禁止・AC-6）。

Before（L1991-1993 付近・挿入位置の目印）:

```css
  [data-component="tag-picker"] button[aria-disabled="true"] {
    opacity: 0.45;
    cursor: not-allowed;
  }

  /* === parallel-09 G9-7 focus-visible / reduced motion === */
```

After（`tag-picker` ブロックと `focus-visible` コメントの間に Phase 2 の CSS ブロックを挿入）:

```css
  [data-component="tag-picker"] button[aria-disabled="true"] {
    opacity: 0.45;
    cursor: not-allowed;
  }

  /* === attendance dashboard (admin-attendance-dashboard-ux) === */
  /* 出典: 既存 .attendance-* クラスは TSX 側で参照済みだが globals.css に未定義だった崩れの是正。
     色は token 経由のみ。Tailwind utility と衝突しない component class 名前空間。 */

  .attendance-analytics-page {
    color: var(--ubm-color-text-primary);
  }

  /* --- 見方ガイド / セクション説明 --- */
  .attendance-section-intro { /* …Phase 2 §CSS 設計のとおり… */ }
  .attendance-page-guide { /* … */ }

  /* --- フィルタバー / KPI grid / charts grid / trend / zone / tables / top10 / absentee --- */
  /* …Phase 2 §「CSS 設計」のブロック全文（L41-325）を逐語で配置… */

  /* === /attendance dashboard === */

  /* === parallel-09 G9-7 focus-visible / reduced motion === */
```

> CSS の本文は **Phase 2 §「CSS 設計（globals.css `@layer components` 末尾追加・copy-paste 可能）」のブロック全文（`/* === attendance dashboard … === */` から `/* === /attendance dashboard === */` まで）を逐語コピー**する。本書では重複記載を避け、配置位置のみを確定する。
> Phase 8 リファクタを同サイクルで適用する場合は、`.attendance-zone-bar` / `.attendance-top10-bar` を Phase 8 §ステップ 1 の「SVG バー共通基底」グループセレクタ方式で配置してよい（機能不変）。
> 挿入後に `verify:design-tokens` と grep gate G-1 を実行し、HEX / 生 oklch が 0 件であることを確認する。

### 3. format-attendance.ts の定数更新（手順 2・AC-3）

Before（現行 L15-20）:

```ts
export const ZONE_LABEL: Record<AttendanceZone, string> = {
  "0→1": "0→1 区画",
  "1→10": "1→10 区画",
  "10→100": "10→100 区画",
  unknown: "未分類",
};
```

After（回数表記へ。境界ロジック `zoneFromCount`（API 側）は不変。`ZONE_HELP` を新規 export）:

```ts
export const ZONE_LABEL: Record<AttendanceZone, string> = {
  "0→1": "0 回（未出席）",
  "1→10": "1〜9 回",
  "10→100": "10〜99 回",
  unknown: "100 回以上",
};

// 区画分布セクションに表示する凡例キャプション（Phase 2 §ラベル設計）。
export const ZONE_HELP =
  "各メンバーの累計出席回数で分類した人数分布です。バーは各回数帯に属するメンバーの割合を示します。";
```

> `ZONE_LABEL` の `Record<AttendanceZone, string>` 型は維持し、4 キー（`"0→1"` / `"1→10"` / `"10→100"` / `unknown`）を網羅する。
> `ZONE_HELP` は文字列リテラルの新規 export（ZL-5 が `typeof ZONE_HELP === "string"` かつ `length > 0` を検証）。
> 検証: `mise exec -- pnpm typecheck` → `format-attendance.spec.ts`（ZL-1..5）が green。

### 4. AttendanceZoneDistributionChart.tsx の修正（手順 3・AC-2/3）

Before（現行 L1-49）の要点 2 箇所:

```tsx
import type { AttendanceZoneDistribution } from "@ubm-hyogo/shared";
import { ZONE_LABEL, formatRate } from "../lib/format-attendance";
// …
  return (
    <div
      className="attendance-zone-distribution"
      role="group"
      aria-label="区画別出席分布"
      data-testid="attendance-zone-distribution"
    >
      <ul>
        {data.rows.map((row) => (
          <li key={row.zone} className="attendance-zone-row">
            <span className="attendance-zone-label">{ZONE_LABEL[row.zone]}</span>
            <svg className="attendance-zone-bar" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true">
              <rect width="100" height="8" rx="4" fill="var(--ubm-color-border-default)" />
              <rect
                width={Math.max(2, row.rate * 100)}
                height="8"
                rx="4"
                fill="var(--ubm-color-accent)"
              />
            </svg>
```

After（(a) 凡例キャプションを `attendance-zone-distribution` 直下の先頭に描画・(b) fill rect 幅を `Math.max(0, …)` へ是正）:

```tsx
import type { AttendanceZoneDistribution } from "@ubm-hyogo/shared";
import { ZONE_LABEL, ZONE_HELP, formatRate } from "../lib/format-attendance";
// …
  return (
    <div
      className="attendance-zone-distribution"
      role="group"
      aria-label="区画別出席分布"
      data-testid="attendance-zone-distribution"
    >
      <p className="attendance-zone-legend">{ZONE_HELP}</p>
      <ul>
        {data.rows.map((row) => (
          <li key={row.zone} className="attendance-zone-row">
            <span className="attendance-zone-label">{ZONE_LABEL[row.zone]}</span>
            <svg className="attendance-zone-bar" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true">
              <rect width="100" height="8" rx="4" fill="var(--ubm-color-border-default)" />
              <rect
                width={Math.max(0, row.rate * 100)}
                height="8"
                rx="4"
                fill="var(--ubm-color-accent)"
              />
            </svg>
```

> 変更は 3 点のみ: (1) import に `ZONE_HELP` を追加、(2) `<ul>` 直前に `<p className="attendance-zone-legend">{ZONE_HELP}</p>` を追加、(3) fill rect の `width={Math.max(2, row.rate * 100)}` → `Math.max(0, row.rate * 100)`。
> 空状態（`data.rows.length === 0`）の `<div className="attendance-zone-empty" data-testid="attendance-zone-empty">` は不変（ZC-5 が testid で検証）。`viewBox` / `preserveAspectRatio="none"` は維持し、楕円潰れは CSS の `block-size: 0.5rem`（手順 2 の globals.css）で根本対処する。
> 検証: `AttendanceZoneDistributionChart.spec.tsx`（ZC-1 width="0" / ZC-2 width="1" / ZC-3 ZONE_HELP 描画 / ZC-4 ラベル / ZC-5 空状態 / ZC-6 ラッパー）が green。

### 5. AttendanceTop10Ranking.tsx の修正（手順 4・AC-2 / Phase 8 連携）

Before（現行 L10-12）:

```tsx
  if (top.length === 0) {
    return <p data-testid="attendance-top10-empty">ランキングデータがありません</p>;
  }
```

After（空状態 `<p>` にスタイル付き class を付与・DOM 構造と testid は不変）:

```tsx
  if (top.length === 0) {
    return (
      <p className="attendance-trend-empty" data-testid="attendance-top10-empty">
        ランキングデータがありません
      </p>
    );
  }
```

> バー楕円の解消は CSS（`.attendance-top10-bar { block-size: 0.5rem }`・手順 2）で行うため、`<svg>` / fill rect（`width={(row.attendedCount / maxCount) * 100}`・既に 0 許容）は **TSX 変更不要**。
> 本変更は Phase 8 §ステップ 2 と同一（空状態クラス追加）。同サイクルで Phase 8 を適用する場合は本手順で吸収する。`data-testid="attendance-top10-empty"` は維持し、既存 testid ベース確認に影響しない。

### 6. KpiPanel.tsx の修正（手順 5・AC-4）

Before（現行 L31-54）:

```tsx
      <Card
        label="全体出席率"
        value={formatRate(overview.overallRate)}
        hint={`前期間比 ${formatDelta(overview.overallRate, overview.previousPeriodRate)}`}
        testId="attendance-kpi-rate"
      />
      <Card
        label="期間内出席者数"
        value={String(attendeeCount)}
        hint="期間内 unique 出席者"
        testId="attendance-kpi-attendees"
      />
      <Card
        label="平均出席数"
        value={avgPerSession}
        hint="セッション平均"
        testId="attendance-kpi-avg"
      />
      <Card
        label="セッション数"
        value={String(overview.totalSessions)}
        hint="期間内開催"
        testId="attendance-kpi-sessions"
      />
```

After（「期間内出席者数」hint を延べ表記へ・`unique` 撤去・4 KPI すべてに用途が分かる hint を保証）:

```tsx
      <Card
        label="全体出席率"
        value={formatRate(overview.overallRate)}
        hint={`前期間比 ${formatDelta(overview.overallRate, overview.previousPeriodRate)}`}
        testId="attendance-kpi-rate"
      />
      <Card
        label="期間内出席者数"
        value={String(attendeeCount)}
        hint="全セッションの出席記録の合計（延べ）"
        testId="attendance-kpi-attendees"
      />
      <Card
        label="平均出席数"
        value={avgPerSession}
        hint="1 セッションあたりの平均出席数"
        testId="attendance-kpi-avg"
      />
      <Card
        label="セッション数"
        value={String(overview.totalSessions)}
        hint="期間内に開催したセッション数"
        testId="attendance-kpi-sessions"
      />
```

> 変更は hint 文言のみ（`Card` の props interface・`value`・`testId`・DOM 構造は不変）。
> - `attendance-kpi-attendees`: `"期間内 unique 出席者"` → `"全セッションの出席記録の合計（延べ）"`（KP-1: `"unique"` 非含有・KP-2: `"延べ"` 含有）。
> - `attendance-kpi-rate`: 既存の `前期間比 …` hint を維持（KP-3: textContent が label+value 以外に非空 hint を持つ）。
> - `attendance-kpi-avg`: `"セッション平均"` → `"1 セッションあたりの平均出席数"`（KP-4: `"セッション"` 含有を維持）。
> - `attendance-kpi-sessions`: `"期間内開催"` → `"期間内に開催したセッション数"`（KP-5: `"開催"` 含有を維持）。
> 全 4 Card が `hint` を渡すため、`{hint ? … : null}` は全カードで真となり用途説明が描画される（AC-4）。
> 検証: `KpiPanel.spec.tsx`（KP-1..5・既存 3 ケースは不変）が green。

### 7. AttendanceFilterBar.tsx の修正（手順 6・AC-3）

Before（現行 L41-42）:

```tsx
      <fieldset className="attendance-zone-filter">
        <legend>区画</legend>
```

After（用語を「出席回数帯」へ統一・zone の query key（`"0→1"` 等）は不変）:

```tsx
      <fieldset className="attendance-zone-filter">
        <legend>出席回数帯</legend>
```

> 変更は legend テキストのみ。チェックボックスの `data-testid`（`attendance-zone-${zone}`）・`SELECTABLE_ZONES`・`ZONE_LABEL[zone]` 参照・`toggleZone` の挙動・URL query key はすべて不変（state/挙動非破壊）。
> 期間 fieldset の `<legend>期間</legend>` は変更しない。
> 検証: `grep -n "出席回数帯" apps/web/src/features/admin/attendance/components/AttendanceFilterBar.tsx` がヒット（Phase 9 AC-3 gate）。

### 8. AttendanceAnalyticsPage.tsx の修正（手順 7・AC-5）

Before（現行 L30-46 の要点・冒頭ラッパーと最初の見出し）:

```tsx
  return (
    <div data-testid="attendance-analytics-page" className="attendance-analytics-page flex flex-col gap-4">
      <AttendanceFilterBar initial={filterState} />

      {bundle.overview.ok ? (
        <KpiPanel overview={bundle.overview.data} attendeeCount={attendeeCount} />
      ) : (
        // …
      )}

      <div className="attendance-charts-grid">
        <div>
          <h2>出席トレンド</h2>
          {bundle.trend.ok ? (
```

After（(a) 冒頭に見方ガイド・(b) 各 `<h2>` 直後に 1 行説明を追加）:

```tsx
  return (
    <div data-testid="attendance-analytics-page" className="attendance-analytics-page flex flex-col gap-4">
      <p className="attendance-page-guide" data-testid="attendance-page-guide">
        期間・出席回数帯で絞り込み、全体出席率と出席者数の推移、回数帯ごとの人数分布、上位出席者、要フォローアップ会員を確認できます。
      </p>

      <AttendanceFilterBar initial={filterState} />

      {bundle.overview.ok ? (
        <KpiPanel overview={bundle.overview.data} attendeeCount={attendeeCount} />
      ) : (
        // …
      )}

      <div className="attendance-charts-grid">
        <div>
          <h2>出席トレンド</h2>
          <p className="attendance-section-intro">期間ごとの出席者数（延べ）の推移です。</p>
          {bundle.trend.ok ? (
```

> 各 `<h2>` 直後に `<p className="attendance-section-intro">` を 1 行追加する（対象見出し: 出席トレンド / 区画別分布 / セッション別出席状況 / 会員別出席率 / 出席ランキング TOP 10 / 要フォローアップ）。文言例:
>
> | 見出し | section-intro 文言（例） |
> | --- | --- |
> | 出席トレンド | 期間ごとの出席者数（延べ）の推移です。 |
> | 区画別分布 | 累計出席回数の帯ごとに会員数の分布を示します。 |
> | セッション別出席状況 | 各セッションの出席者数と出席率の一覧です。 |
> | 会員別出席率 | 会員ごとの出席回数と出席率の一覧です。 |
> | 出席ランキング TOP 10 | 出席回数が多い上位 10 名です。 |
> | 要フォローアップ | 一定期間欠席が続く会員の一覧です。 |
>
> データ取得（`fetchAttendanceAnalyticsBundle`）・条件分岐・既存コンポーネントの呼び出しは不変。表示要素（`<p>`）の追加のみ。
> `attendance-page-guide` / `attendance-section-intro` の CSS は手順 2 の globals.css で定義済み。

### 9. 実装後の一括検証（Green 確認）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/attendance/__tests__
# token gate
grep -nE '(oklch\(|#[0-9a-fA-F]{3,8})' apps/web/src/styles/globals.css \
  | grep -v '^\s*/\*' | grep -v -- '--ubm-color-' && echo "[FAIL]" || echo "[PASS]"
mise exec -- pnpm verify:tokens
# API 非変更
git diff --name-only -- apps/api | grep . && echo "[FAIL]" || echo "[PASS]"
```

**期待**: typecheck / lint exit 0、attendance 配下 spec 全 PASS、token gate PASS、`apps/api` diff 空。
これにより Phase 4 の Red（ZL-1..5 / ZC-1..4 / KP-1..2）がすべて Green へ転じる。

## 参照資料

| 種別 | Path | 用途 |
| --- | --- | --- |
| CSS / ラベル設計正本 | `docs/30-workflows/admin-attendance-dashboard-ux/phase-2-design.md` | CSS ブロック全文・`ZONE_LABEL` / `ZONE_HELP` 設計・変更 10 ファイル |
| テスト計画（Red） | `docs/30-workflows/admin-attendance-dashboard-ux/phase-4-test-plan.md` | green 化対象ケース（ZL/ZC/KP）・grep gate |
| リファクタ | `docs/30-workflows/admin-attendance-dashboard-ux/phase-8-refactor.md` | グループセレクタ・`attendance-trend-empty` 空状態統一 |
| CSS 正本 | `apps/web/src/styles/globals.css` | `@layer components` 末尾（`focus-visible` ブロック直前）への挿入位置 |
| ラベル定数 | `apps/web/src/features/admin/attendance/lib/format-attendance.ts` | `ZONE_LABEL` 更新・`ZONE_HELP` 追加 |
| 区画分布 | `apps/web/src/features/admin/attendance/components/AttendanceZoneDistributionChart.tsx` | バー幅是正・凡例描画 |
| Top10 | `apps/web/src/features/admin/attendance/components/AttendanceTop10Ranking.tsx` | 空状態クラス付与 |
| KPI | `apps/web/src/features/admin/attendance/components/KpiPanel.tsx` | hint 是正 |
| フィルタ | `apps/web/src/features/admin/attendance/components/AttendanceFilterBar.tsx` | legend rename |
| メインコンテナ | `apps/web/src/features/admin/attendance/components/AttendanceAnalyticsPage.tsx` | 見方ガイド・section-intro |
| vitest 設定 | `vitest.config.ts`（ルート） | focused 実行の `--config` 指定先 |

### システム仕様（aiworkflow-requirements）

> 実装前に以下のシステム仕様を確認し、既存設計との整合性を確保する。

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| design-tokens | `.claude/skills/aiworkflow-requirements/references/design-tokens.md` | OKLch トークン正本・HEX 禁止不変条件（`var(--ubm-color-*)` 経由のみ） |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | admin ナビ / 画面構成の正本 |

## 成果物

| 成果物 | 種別 | 変更内容 |
| --- | --- | --- |
| `apps/web/src/styles/globals.css` | 編集 | `@layer components` 末尾に `.attendance-*` レイアウト CSS（Phase 2 ブロック）を追加（AC-1/2/5/6） |
| `apps/web/src/features/admin/attendance/lib/format-attendance.ts` | 編集 | `ZONE_LABEL` 回数表記化・`ZONE_HELP` 新規 export（AC-3） |
| `apps/web/src/features/admin/attendance/components/AttendanceZoneDistributionChart.tsx` | 編集 | バー幅 `Math.max(0,…)`・`ZONE_HELP` 凡例描画（AC-2/3） |
| `apps/web/src/features/admin/attendance/components/AttendanceTop10Ranking.tsx` | 編集 | 空状態 `<p>` に `attendance-trend-empty`（AC-2 / Phase 8） |
| `apps/web/src/features/admin/attendance/components/KpiPanel.tsx` | 編集 | 4 KPI hint 是正・`unique` 撤去・延べ表記（AC-4） |
| `apps/web/src/features/admin/attendance/components/AttendanceFilterBar.tsx` | 編集 | legend「区画」→「出席回数帯」（AC-3） |
| `apps/web/src/features/admin/attendance/components/AttendanceAnalyticsPage.tsx` | 編集 | 見方ガイド・各セクション section-intro（AC-5） |

## 統合テスト連携

- Phase 6 で各 spec（`format-attendance.spec.ts` / `AttendanceZoneDistributionChart.spec.tsx` / `KpiPanel.spec.tsx`）を実コードとして追加・更新し、本 Phase の実装が Green であることを機械確認する。
- Phase 7 で本 Phase の変更ファイル（lib / components）の branch/line カバレッジを測定する。CSS（globals.css）は jsdom 非カバレッジのため Phase 11 視覚で担保する。
- Phase 9 QA で grep gate（G-1..G-3）・`verify:design-tokens`・`apps/api` diff 空を再実行する。
- Phase 11（user-gated）で AC-1（レイアウト復旧）/ AC-5（見方ガイド・空状態）を staging 実機で視覚確認する。

## 完了条件

1. 変更 7 ソースファイル（globals.css / format-attendance.ts / 5 コンポーネント）に Before→After どおりの差分が適用され、`ZONE_LABEL` 新値・`ZONE_HELP` export・`Math.max(0,…)`・延べ hint・「出席回数帯」legend・見方ガイドが揃っている。
2. `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` が exit 0。
3. focused vitest（attendance `__tests__`）で Phase 4 の Red（ZL-1..5 / ZC-1..4 / KP-1..2）が Green へ転じる。
4. grep gate G-1（globals.css 色直書きなし）/ `verify:design-tokens` green、`git diff --name-only -- apps/api` が空（AC-6/AC-7）。
5. CSS 本文は Phase 2 §「CSS 設計」ブロック全文を逐語配置し、配置位置が `@layer components` 末尾（`focus-visible` ブロック直前）であることが確定している。
