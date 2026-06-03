# Phase 8: リファクタリング

## メタ情報

- task_id: `admin-attendance-dashboard-ux`
- 前提: Phase 1（要件・AC）/ Phase 2（設計）/ Phase 3（設計レビュー PASS）/ Phase 4〜7（実装・テスト）
- 本 Phase の責務: 実装後の重複解消・命名整理・SRP 観点の整理を行い、コードベースの保守性を高める。新機能追加は行わない

## リファクタリング方針

本タスクの変更対象は `apps/web/src/features/admin/attendance/` および `apps/web/src/styles/globals.css` に閉じており、範囲が限定的である。Phase 2 設計から「最小差分原則」を採用し、既存クラス名・data-testid・DOM 構造を原則維持しているため、大規模なリファクタリングは発生しない。以下に **対象となる整理観点** を列挙し、採否と根拠を明記する。

## 実行タスク

### タスク 1: CSS 共通スタイル抽出の可否判定

`.attendance-zone-bar` と `.attendance-top10-bar` の共通プロパティを確認し、共通 mixin 化または共通クラス化の採否を判定する。

| プロパティ | `.attendance-zone-bar` | `.attendance-top10-bar` | 共通か |
| --- | --- | --- | --- |
| `inline-size` | `100%` | `100%` | ✅ 同一 |
| `block-size` | `0.5rem` | `0.5rem` | ✅ 同一 |
| `display` | `block` | `block` | ✅ 同一 |
| `border-radius` | `var(--ubm-radius-sm)` | `var(--ubm-radius-sm)` | ✅ 同一 |
| `overflow` | `hidden` | `hidden` | ✅ 同一 |
| `grid-column` | なし | `1 / -1`（grid 文脈専用） | ❌ 異なる |

**判定**: `grid-column` の違いがあるため完全な共通クラスへの抽出は不適。ただし `inline-size / block-size / display / border-radius / overflow` の 5 プロパティは `@layer components` 内でコメント「共通 SVG バー基底」として `.attendance-zone-bar, .attendance-top10-bar` にまとめて宣言し、`grid-column` のみ `.attendance-top10-bar` 単体で追加宣言する **グループセレクタ方式**を採用する。

**採否**: **採用（グループセレクタ方式）**。行数削減と DRY 性向上。CSS layer 内なのでセレクタ優先度は不変。

### タスク 2: `ZONE_HELP` / `ZONE_LABEL` の単一責務確認

`format-attendance.ts` は「フォーマット関数」と「表示用定数」の 2 つの責務を持つ。

| 現状の責務 | 内容 | SRP 観点 |
| --- | --- | --- |
| フォーマット関数 | `formatRate` / `formatDelta` / `presetToPeriod` | 純関数・変換ロジック |
| 表示用定数 | `ZONE_LABEL` / `ZONE_HELP` / `PERIOD_PRESETS` / `SELECTABLE_ZONES` | 定数・設定値 |

**判定**: 責務が 2 つ存在するが、いずれも「出席分析の表示フォーマット・表示文言」という同一ドメインに属する。ファイルを分割すると import パスが増え、既存テスト（`format-attendance.spec.ts`）のモジュール参照も変わる。本タスクのスコープ内では **分割しない（現状のまま）**。

> 将来的にファイルが 100 行超になった場合は `attendance-labels.ts` / `attendance-formatters.ts` への分割を検討する未タスク候補とする（CONST_007: 本サイクルスコープ外）。

**採否**: **否（現状維持）**。

### タスク 3: `KpiPanel` の `Card` 共通化確認

`KpiPanel.tsx` 内の `Card` 関数コンポーネントは local に定義されている。

| 観点 | 確認 |
| --- | --- |
| 他コンポーネントからの再利用 | `KpiPanel.tsx` の外から `Card` を import している箇所が `apps/web/src/features/admin/attendance/` 配下に存在するか | `grep -rn "from.*Card" apps/web/src/features/admin/attendance` で確認。現状は KpiPanel 単体のみ使用 |
| props interface の汎用性 | `{ label, value, hint, testId }` は KPI 表示に特化した props 設計 |

**判定**: 再利用箇所が KpiPanel のみであるため、shared component として `apps/web/src/components/admin/` へ昇格させる必要はない（CLAUDE.md 不変条件 #9 も踏まえ、admin form input でない本コンポーネントを強制昇格する根拠もない）。KpiPanel スコープ内の local コンポーネントとして維持する。

**採否**: **否（現状維持）**。

### タスク 4: 空状態テキストのアクセシビリティ整合確認

空状態を表示する箇所は以下の 3 箇所が該当する。

| コンポーネント | 現状のマークアップ | 整理内容 |
| --- | --- | --- |
| `AttendanceZoneDistributionChart.tsx` | `<div className="attendance-zone-empty">` | CSS 定義を追加するのみ（DOM 変更なし）。`data-testid="attendance-zone-empty"` は維持 |
| `AttendanceTop10Ranking.tsx` | `<p data-testid="attendance-top10-empty">` | CSS class を `attendance-trend-empty`（Phase 2 設計の空状態共有クラス）へ追加。`<p>` タグ維持 |
| `AttendanceTrendChart`（既存 spec あり） | 既存の空状態スタイルがあれば維持 | 非変更（既存テスト保護） |

**採否**: **採用**。`AttendanceTop10Ranking.tsx` の `<p>` に `className="attendance-trend-empty"` を付与し、スタイル付き空状態に統一する。DOM 構造（`<p>` タグ・testid）は不変。

## 実行手順

### ステップ 1: CSS グループセレクタへの整理（globals.css）

`@layer components` 内の `.attendance-zone-bar` と `.attendance-top10-bar` の宣言を以下のように整理する:

```css
/* --- SVG バー共通基底（zone / top10 両用） --- */
.attendance-zone-bar,
.attendance-top10-bar {
  inline-size: 100%;
  block-size: 0.5rem;
  display: block;
  border-radius: var(--ubm-radius-sm);
  overflow: hidden;
}

/* --- zone-bar 個別 --- */
/* (grid-column は不要のため追加宣言なし) */

/* --- top10-bar 個別 --- */
.attendance-top10-bar {
  grid-column: 1 / -1;
}
```

### ステップ 2: 空状態クラスの追加（AttendanceTop10Ranking.tsx）

```tsx
// Before
<p data-testid="attendance-top10-empty">ランキングデータがありません</p>

// After
<p className="attendance-trend-empty" data-testid="attendance-top10-empty">
  ランキングデータがありません
</p>
```

### ステップ 3: リファクタ後の回帰確認

```bash
# 型チェック（import パスの破壊がないことを確認）
mise exec -- pnpm typecheck

# リント
mise exec -- pnpm lint

# focused vitest（リファクタ対象の spec を重点確認）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/attendance/__tests__
```

## 参照資料

| 種別 | Path | 用途 |
| --- | --- | --- |
| CSS 設計正本 | `docs/30-workflows/admin-attendance-dashboard-ux/phase-2-design.md` | CSS ブロック定義・グループセレクタ設計根拠 |
| 変更対象 CSS | `apps/web/src/styles/globals.css` | `@layer components` 末尾の `=== attendance dashboard ===` ブロック |
| 変更対象コンポーネント | `apps/web/src/features/admin/attendance/components/AttendanceTop10Ranking.tsx` | 空状態クラス追加 |
| 空状態定義 | `docs/30-workflows/admin-attendance-dashboard-ux/phase-2-design.md`（`.attendance-zone-empty` / `.attendance-trend-empty` 節） | 空状態共有クラス根拠 |
| 既存テスト | `apps/web/src/features/admin/attendance/__tests__/AttendanceTrendChart.spec.tsx` | リファクタ影響確認（非変更） |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| design-tokens | `.claude/skills/aiworkflow-requirements/references/` 内 design tokens / UI 仕様 | OKLch トークン正本・HEX 禁止不変条件 |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | admin ナビ / 画面構成の正本 |

## 成果物

| 成果物 | 種別 | 変更内容 |
| --- | --- | --- |
| `apps/web/src/styles/globals.css` | 編集 | SVG バー共通基底をグループセレクタ方式に整理（機能不変・DRY 化） |
| `apps/web/src/features/admin/attendance/components/AttendanceTop10Ranking.tsx` | 編集 | 空状態 `<p>` に `className="attendance-trend-empty"` を追加 |

## 統合テスト連携

- Phase 9 QA で `focused vitest` を実行し、リファクタによる回帰がないことを確認する。
- CSS グループセレクタ整理は DOM 変更を伴わないため、snapshot・DOM アサート系テストに影響しない。
- `AttendanceTop10Ranking.tsx` の空状態 class 追加は `data-testid` 不変のため、既存 `attendance-top10-empty` の testid ベース確認に影響しない。

## 完了条件

1. CSS グループセレクタ整理（`.attendance-zone-bar, .attendance-top10-bar` 共通基底）が `globals.css` に反映されている。
2. `AttendanceTop10Ranking.tsx` の空状態 `<p>` に `className="attendance-trend-empty"` が付与されている。
3. `pnpm typecheck` / `pnpm lint` / focused vitest が全 green である（リファクタによる回帰なし）。
4. `ZONE_HELP` / `ZONE_LABEL` の分割・`Card` の昇格は採否判定を本文に記録し、「否（現状維持）」が確定している。
