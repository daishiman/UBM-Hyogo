# Phase 2: 設計

## メタ情報

- task_id: `admin-attendance-dashboard-ux`
- 前提: Phase 1（要件・AC・根本原因）
- 本 Phase の責務: 変更対象ファイル・関数/CSS シグネチャ・入出力・配置ルールを実装可能粒度で確定

## 設計原則（CLAUDE.md 不変条件 / prototype-driven CSS）

1. **色は token 経由のみ**: `globals.css` に HEX / OKLch 直書きせず `var(--ubm-color-*)` を参照（不変条件 #2、`verify-design-tokens` gate）。
2. **CSS は `@layer components` 末尾追加**: 既存 `.attendance-status-pill`（globals.css L663-700）と同じ「セマンティック component class」方式を踏襲。
   出席ダッシュボードのクラスは Tailwind utility ではなく `.attendance-*` 名前空間なので arbitrary class 禁則と衝突しない。
3. **新規 primitive を増やさない**: 既存トークン（`--ubm-color-*` / `--ubm-space-*` / `--ubm-radius-*` / `--ubm-shadow-*` / `--ubm-text-*`）のみ使用。新色トークンは追加しない。
4. **API 非変更**: `apps/api` / fetch URL / zod schema / `zoneFromCount` 境界は触らない。UI 側のラベル・補助テキストで意味を補う。
5. **最小差分**: 既存コンポーネントの class 名・data-testid・DOM 構造は原則維持し、CSS 定義の追加と局所的な TSX 修正に留める（既存テストの破壊を最小化）。

## 変更対象ファイル一覧

| # | パス | 種別 | 変更概要 |
| --- | --- | --- | --- |
| 1 | `apps/web/src/styles/globals.css` | 編集 | `@layer components` 末尾に `=== attendance dashboard ===` ブロックを追加。`.attendance-*` レイアウト/カード/バー/テーブル/空状態の CSS を定義（AC-1/2/5/6） |
| 2 | `apps/web/src/features/admin/attendance/components/AttendanceZoneDistributionChart.tsx` | 編集 | バー幅計算 `Math.max(2, …)` → `Math.max(0, …)`。凡例キャプション追加。`.attendance-zone-legend` 付与（AC-2/3） |
| 3 | `apps/web/src/features/admin/attendance/components/AttendanceTop10Ranking.tsx` | 編集 | バー描画は CSS 寸法固定で楕円解消（TSX は最小修正、必要なら 0 許容ガード）（AC-2） |
| 4 | `apps/web/src/features/admin/attendance/lib/format-attendance.ts` | 編集 | `ZONE_LABEL` を回数表記へ。`ZONE_HELP`（凡例文）定数を追加 export（AC-3） |
| 5 | `apps/web/src/features/admin/attendance/components/KpiPanel.tsx` | 編集 | 「期間内出席者数」ラベル/hint を延べ出席数へ整合。各 Card に用途説明（AC-4） |
| 6 | `apps/web/src/features/admin/attendance/components/AttendanceFilterBar.tsx` | 編集 | `<legend>区画</legend>` → `出席回数帯`。フィルタの 1 行説明追加（AC-3/5） |
| 7 | `apps/web/src/features/admin/attendance/components/AttendanceAnalyticsPage.tsx` | 編集 | 冒頭の見方ガイド・各セクション見出しに 1 行説明・空状態のスタイル付与（AC-5） |
| 8 | `apps/web/src/features/admin/attendance/__tests__/format-attendance.spec.ts` | 編集 | `ZONE_LABEL` 新値の検証へ更新（AC-3） |
| 9 | `apps/web/src/features/admin/attendance/__tests__/AttendanceZoneDistributionChart.spec.tsx` | 新規 | 0% バーが 0 幅、凡例キャプション描画を検証（AC-2/3） |
| 10 | `apps/web/src/features/admin/attendance/__tests__/KpiPanel.spec.tsx` | 更新（既存 spec） | KPI ラベル/説明の整合を検証（AC-4） |

> 区画ラベルは `AttendanceAbsenteeAlert.tsx` / その他でも `ZONE_LABEL` を参照するが、`format-attendance.ts` の定数更新で自動反映されるため個別編集は不要（参照のみ）。

## CSS 設計（globals.css `@layer components` 末尾追加・copy-paste 可能）

> 配置: `apps/web/src/styles/globals.css` の `@layer components { … }` 内、末尾の `focus-visible / reduced-motion` グローバル block の **前**。
> 既存ファイル構造スナップショット（実装時に行番号を再確認）: `@theme inline`(L12) / `@layer base`(L71) / `@layer components`(L124〜) / `.attendance-status-pill`(L663-700)。

```css
  /* === attendance dashboard (admin-attendance-dashboard-ux) === */
  /* 出典: 既存 .attendance-* クラスは TSX 側で参照済みだが globals.css に未定義だった崩れの是正。
     色は token 経由のみ。Tailwind utility と衝突しない component class 名前空間。 */

  .attendance-analytics-page {
    /* page.tsx 側で flex flex-col gap-4 済。ここでは追加余白のみ */
    color: var(--ubm-color-text-primary);
  }

  /* --- 見方ガイド / セクション説明 --- */
  .attendance-section-intro {
    margin: 0 0 var(--ubm-space-2);
    font-size: var(--ubm-text-sm);
    color: var(--ubm-color-text-secondary);
  }
  .attendance-page-guide {
    padding: var(--ubm-space-3) var(--ubm-space-4);
    border: 1px solid var(--ubm-color-border-default);
    border-radius: var(--ubm-radius-md);
    background: var(--ubm-color-surface-panel-2);
    font-size: var(--ubm-text-sm);
    color: var(--ubm-color-text-secondary);
  }

  /* --- フィルタバー --- */
  .attendance-filter-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: var(--ubm-space-4);
    padding: var(--ubm-space-4);
    border: 1px solid var(--ubm-color-border-default);
    border-radius: var(--ubm-radius-lg);
    background: var(--ubm-color-surface-panel);
    box-shadow: var(--ubm-shadow-xs);
  }
  .attendance-period-filter,
  .attendance-zone-filter {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--ubm-space-2);
    border: 0;
    margin: 0;
    padding: 0;
    min-inline-size: 0;
  }
  .attendance-period-filter legend,
  .attendance-zone-filter legend {
    float: left;            /* fieldset legend をインラインに寄せる */
    width: 100%;
    margin-bottom: var(--ubm-space-1);
    font-size: var(--ubm-text-xs);
    font-weight: 600;
    letter-spacing: var(--ubm-eyebrow-tracking);
    text-transform: uppercase;
    color: var(--ubm-color-text-muted);
  }
  .attendance-period-filter button {
    padding: var(--ubm-space-1) var(--ubm-space-3);
    border: 1px solid var(--ubm-color-border-strong);
    border-radius: var(--ubm-radius-sm);
    background: var(--ubm-color-surface-panel);
    color: var(--ubm-color-text-secondary);
    font-size: var(--ubm-text-sm);
    cursor: pointer;
    transition: background var(--ubm-dur-fast) var(--ubm-ease-standard),
                color var(--ubm-dur-fast) var(--ubm-ease-standard);
  }
  .attendance-period-filter button[data-active="true"] {
    background: var(--ubm-color-accent);
    border-color: var(--ubm-color-accent);
    color: var(--ubm-color-surface-panel);
  }
  .attendance-zone-filter label {
    display: inline-flex;
    align-items: center;
    gap: var(--ubm-space-1);
    padding: var(--ubm-space-1) var(--ubm-space-2);
    border: 1px solid var(--ubm-color-border-default);
    border-radius: var(--ubm-radius-sm);
    font-size: var(--ubm-text-sm);
    color: var(--ubm-color-text-secondary);
  }
  .attendance-export-link {
    margin-inline-start: auto;
    align-self: center;
    padding: var(--ubm-space-1) var(--ubm-space-3);
    border: 1px solid var(--ubm-color-border-strong);
    border-radius: var(--ubm-radius-sm);
    font-size: var(--ubm-text-sm);
    color: var(--ubm-color-accent-ink);
    text-decoration: none;
  }
  .attendance-export-link:hover { background: var(--ubm-color-accent-soft); }

  /* --- KPI grid --- */
  .attendance-kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
    gap: var(--ubm-space-4);
  }
  .attendance-kpi-card {
    display: flex;
    flex-direction: column;
    gap: var(--ubm-space-1);
    padding: var(--ubm-space-4);
    border: 1px solid var(--ubm-color-border-default);
    border-radius: var(--ubm-radius-lg);
    background: var(--ubm-color-surface-panel);
    box-shadow: var(--ubm-shadow-xs);
  }
  .attendance-kpi-label {
    font-size: var(--ubm-text-xs);
    font-weight: 600;
    letter-spacing: var(--ubm-eyebrow-tracking);
    text-transform: uppercase;
    color: var(--ubm-color-text-muted);
  }
  .attendance-kpi-value {
    font-size: var(--ubm-text-3xl);
    font-weight: 700;
    line-height: 1.1;
    color: var(--ubm-color-text-primary);
  }
  .attendance-kpi-hint {
    font-size: var(--ubm-text-sm);
    color: var(--ubm-color-text-secondary);
  }

  /* --- charts 2-col grid --- */
  .attendance-charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
    gap: var(--ubm-space-6);
  }
  .attendance-charts-grid > div {
    padding: var(--ubm-space-4);
    border: 1px solid var(--ubm-color-border-default);
    border-radius: var(--ubm-radius-lg);
    background: var(--ubm-color-surface-panel);
    box-shadow: var(--ubm-shadow-xs);
  }

  /* --- trend chart --- */
  .attendance-trend-chart { margin: 0; }
  .attendance-trend-chart svg { inline-size: 100%; block-size: auto; }
  .attendance-trend-chart figcaption {
    margin-top: var(--ubm-space-2);
    font-size: var(--ubm-text-xs);
    color: var(--ubm-color-text-muted);
  }

  /* --- zone distribution --- */
  .attendance-zone-legend {
    margin: 0 0 var(--ubm-space-3);
    font-size: var(--ubm-text-sm);
    color: var(--ubm-color-text-secondary);
  }
  .attendance-zone-distribution ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--ubm-space-3);
  }
  .attendance-zone-row {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--ubm-space-1);
  }
  .attendance-zone-label {
    font-size: var(--ubm-text-sm);
    font-weight: 600;
    color: var(--ubm-color-text-primary);
  }
  .attendance-zone-bar {
    inline-size: 100%;
    block-size: 0.5rem;     /* 8px 固定。SVG 楕円潰れの根本対処 */
    display: block;
    border-radius: var(--ubm-radius-sm);
    overflow: hidden;
  }
  .attendance-zone-count {
    font-size: var(--ubm-text-sm);
    color: var(--ubm-color-text-secondary);
  }
  .attendance-zone-empty,
  .attendance-trend-empty {
    padding: var(--ubm-space-4);
    font-size: var(--ubm-text-sm);
    color: var(--ubm-color-text-muted);
  }

  /* --- tables (session / member) --- */
  .attendance-session-table,
  .attendance-member-table {
    inline-size: 100%;
    border-collapse: collapse;
    font-size: var(--ubm-text-sm);
  }
  .attendance-session-table th,
  .attendance-member-table th {
    text-align: start;
    padding: var(--ubm-space-2) var(--ubm-space-3);
    border-bottom: 1px solid var(--ubm-color-border-strong);
    font-size: var(--ubm-text-xs);
    letter-spacing: var(--ubm-eyebrow-tracking);
    text-transform: uppercase;
    color: var(--ubm-color-text-muted);
  }
  .attendance-session-table td,
  .attendance-member-table td {
    padding: var(--ubm-space-2) var(--ubm-space-3);
    border-bottom: 1px solid var(--ubm-color-border-default);
    color: var(--ubm-color-text-primary);
  }

  /* --- top10 ranking --- */
  .attendance-top10 {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--ubm-space-3);
  }
  .attendance-top10 li {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    column-gap: var(--ubm-space-3);
    row-gap: var(--ubm-space-1);
  }
  .attendance-top10-rank {
    font-weight: 700;
    color: var(--ubm-color-accent-ink);
  }
  .attendance-top10-name {
    font-size: var(--ubm-text-sm);
    color: var(--ubm-color-text-primary);
  }
  .attendance-top10-bar {
    grid-column: 1 / -1;
    inline-size: 100%;
    block-size: 0.5rem;
    display: block;
    border-radius: var(--ubm-radius-sm);
    overflow: hidden;
  }
  .attendance-top10-count {
    grid-column: 1 / -1;
    font-size: var(--ubm-text-sm);
    color: var(--ubm-color-text-secondary);
  }

  /* --- absentee alert / follow-up --- */
  .attendance-absentee-alert {
    padding: var(--ubm-space-3) var(--ubm-space-4);
    border: 1px solid var(--ubm-color-warn-soft);
    border-radius: var(--ubm-radius-lg);
    background: var(--ubm-color-warn-soft);
  }
  .attendance-absentee-alert summary {
    font-weight: 600;
    color: var(--ubm-color-text-primary);
    cursor: pointer;
  }
  .attendance-absentee-alert ul {
    list-style: none;
    margin: var(--ubm-space-3) 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--ubm-space-2);
  }
  .attendance-absentee-alert li {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ubm-space-3);
    font-size: var(--ubm-text-sm);
    color: var(--ubm-color-text-secondary);
  }
  /* === /attendance dashboard === */
```

> SVG 楕円潰れの本質的対処は **`.attendance-zone-bar` / `.attendance-top10-bar` に `block-size: 0.5rem` を CSS で固定**すること。
> これにより replaced 要素デフォルト（≈150px 高）が解消し、`preserveAspectRatio="none"` でも縦に伸びない。
> TSX 側の `width={Math.max(2, …)}` は 0% を 0 幅にするため `Math.max(0, …)` に是正する（低値の角丸ブロブ防止）。
> `viewBox="0 0 100 8"` と `preserveAspectRatio="none"` は維持（横方向の比率はそのまま、縦は CSS 高さで固定）。

## ラベル設計（format-attendance.ts）

```ts
// 現行境界（apps/api zoneFromCount: count<=0→"0→1", <=9→"1→10", <=99→"10→100", else "unknown"）に
// 忠実な「累計出席回数帯」表記。境界そのものは変更しない（別タスクで再検討）。
export const ZONE_LABEL: Record<AttendanceZone, string> = {
  "0→1": "0 回（未出席）",
  "1→10": "1〜9 回",
  "10→100": "10〜99 回",
  unknown: "100 回以上",
};

// 凡例キャプション（区画分布セクションに表示）
export const ZONE_HELP =
  "各メンバーの累計出席回数で分類した人数分布です。バーは各回数帯に属するメンバーの割合を示します。";
```

> 既存テスト `format-attendance.spec.ts` は `ZONE_LABEL` の旧値を検証している場合があるため Phase 6 で新値へ更新する。

## コンポーネント変更設計（入出力・副作用）

| ファイル | 変更点 | 入出力・副作用 |
| --- | --- | --- |
| `AttendanceZoneDistributionChart.tsx` | (a) `<rect width={Math.max(0, row.rate * 100)} …>` へ。(b) `ZONE_HELP` を `<p className="attendance-zone-legend">` で先頭に描画。 | props 不変（純表示）。副作用なし。0% 時 fill rect は幅 0 |
| `AttendanceTop10Ranking.tsx` | CSS 高さ固定で楕円解消（TSX は基本維持。`width` は既に 0 許容なので変更不要、必要なら明示ガード） | props 不変。副作用なし |
| `KpiPanel.tsx` | 「期間内出席者数」label はそのまま、hint を `"全セッションの出席記録の合計（延べ）"` に。`Card` に `desc` 任意 prop を足し用途説明を表示可（または hint 拡充）。「unique」表記を撤去 | props 不変。表示テキストのみ |
| `AttendanceFilterBar.tsx` | `<legend>区画</legend>` → `<legend>出席回数帯</legend>`。フィルタ全体に `aria-describedby` で 1 行説明 | state/挙動不変。zone の query key（"0→1" 等）は不変 |
| `AttendanceAnalyticsPage.tsx` | 冒頭に `<p className="attendance-page-guide">` で見方ガイド。各 `<h2>` 直後に `<p className="attendance-section-intro">` で 1 行説明 | データ取得不変。表示要素追加のみ |

## アクセシビリティ

- 期間ボタンの選択状態は既存 `aria-pressed` / `data-active` を維持（CSS は `data-active="true"` を hook）。
- バーは `aria-hidden="true"` のまま装飾扱い。数値は隣接 `.attendance-zone-count` / `.attendance-top10-count` で読み上げ可。
- 見方ガイド・凡例は通常テキストで読み上げ対象。`reduced-motion` はボタン transition のみで影響軽微（既存グローバル `motion-reduce` に委ねる）。

## 検証コマンド（責務分離 grep gate）

```bash
# globals.css に色直書きが無いこと（token 参照のみ）
grep -nE '(oklch|#[0-9a-fA-F]{3,8})' apps/web/src/styles/globals.css \
  | grep -v '^\s*/\*' | grep -v -- '--ubm-color-' && echo "[FAIL]" || echo "[PASS]"
# 追加 TSX に arbitrary color が無いこと
grep -rnE '(bg|text|border)-\[#' apps/web/src/features/admin/attendance && echo "[FAIL]" || echo "[PASS]"
# apps/api 無変更
git diff --name-only -- apps/api | grep . && echo "[FAIL api touched]" || echo "[PASS api untouched]"
```

## 完了条件

変更対象 10 ファイルそれぞれに対し「何をどう変えるか」が確定し、CSS ブロックが copy-paste 可能な形で本書に含まれ、
AC-1..AC-9 が変更点へ 1:1 で trace されていること。
