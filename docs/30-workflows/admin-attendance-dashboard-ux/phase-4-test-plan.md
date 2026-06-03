# Phase 4: テスト計画（TDD Red）

> 本 Phase は「出席ダッシュボード UI/UX 是正」の **テスト計画（Red）**。
> 実装着手前に、CSS 追加・ラベル是正・KPI 修正・凡例追加を検証する
> unit / component test の期待挙動を確定する。実コード変更は Phase 5 で行う。

## メタ情報

- task_id: `admin-attendance-dashboard-ux`
- 前提: Phase 1（AC-1..AC-9）/ Phase 2（CSS 設計・ラベル設計・変更 10 ファイル確定）/ Phase 3（設計レビュー PASS）
- 本 Phase の責務: AC-1..AC-8 それぞれのテスト戦略・対象ファイル・具体コマンド・grep gate を確定する

## 目的

Phase 5 実装前にテスト仕様を確定し、実装後に全ケースが green へ転じることを Phase 6/9 で追跡できる状態を作る。
CSS 崩れ（AC-1）は DOM class 存在チェックと Phase 11 視覚で担保し、
バー楕円（AC-2）・ラベル（AC-3）・KPI（AC-4）は focused vitest で機械的に検証する方針を採る。

## 実行タスク

### 1. テスト戦略概要

| AC | 主な検証手段 | 理由 |
| --- | --- | --- |
| AC-1 レイアウト復旧 | Phase 11 視覚 + DOM class 存在確認 | CSS セレクタの「効き」は jsdom では確認できない。クラス付与の事実は DOM で確認し、実際の描画は Phase 11 staging で確認する |
| AC-2 バー楕円解消 | `AttendanceZoneDistributionChart.spec.tsx`（新規）でバー幅 0 を確認 | `Math.max(0, …)` の是正は純粋に数値ロジックなので jsdom で検証可 |
| AC-3 ラベル是正・凡例 | `format-attendance.spec.ts`（更新）+ `AttendanceZoneDistributionChart.spec.tsx`（新規） | `ZONE_LABEL` 定数値と DOM 描画文言の両方を確認 |
| AC-4 KPI ラベル是正 | `KpiPanel.spec.tsx`（既存・更新）| 「unique」文言の非存在と延べ表記を DOM で確認 |
| AC-5 見方ガイド | Phase 11 視覚 | `<p className="attendance-page-guide">` の class 付与は DOM で確認。視覚確認は Phase 11 |
| AC-6 token 厳守 | `pnpm verify:tokens` + grep gate | CSS ファイル全行スキャン |
| AC-7 API 非変更 | `git diff --name-only -- apps/api` 空 | 非変更は git で機械確認 |
| AC-8 typecheck/lint/vitest | `pnpm typecheck && pnpm lint` + focused vitest | 全ファイル変更後に必須通過 |

### 2. テスト対象ファイル一覧

| ファイル | 種別 | 対応 AC |
| --- | --- | --- |
| `apps/web/src/features/admin/attendance/__tests__/format-attendance.spec.ts` | 更新 | AC-3 |
| `apps/web/src/features/admin/attendance/__tests__/AttendanceZoneDistributionChart.spec.tsx` | 新規 | AC-2 / AC-3 |
| `apps/web/src/features/admin/attendance/__tests__/KpiPanel.spec.tsx` | 更新 | AC-4 |

> `AttendanceTrendChart.spec.tsx` / `buildExportUrl.spec.ts` は本タスクで変更しないため対象外。

### 3. テストケース表

#### 3.1 `format-attendance.spec.ts`（更新）

既存 `ZONE_LABEL covers known zones` ケースを新値へ更新する。

| # | ケース | 期待値 | 対応 AC |
| --- | --- | --- | --- |
| ZL-1 | `ZONE_LABEL["0→1"]` | `"0 回（未出席）"` | AC-3 |
| ZL-2 | `ZONE_LABEL["1→10"]` | `"1〜9 回"` | AC-3 |
| ZL-3 | `ZONE_LABEL["10→100"]` | `"10〜99 回"` | AC-3 |
| ZL-4 | `ZONE_LABEL["unknown"]` | `"100 回以上"` | AC-3 |
| ZL-5 | `ZONE_HELP` が export されており文字列 | `typeof ZONE_HELP === "string"` かつ `ZONE_HELP.length > 0` | AC-3 |

> `formatRate` / `formatDelta` / `presetToPeriod` の既存ケース（ZL-1..4 以外）は変更しない。

#### 3.2 `AttendanceZoneDistributionChart.spec.tsx`（新規）

React Testing Library + jsdom + `@testing-library/jest-dom` 環境。
`AttendanceZone` 型は `@ubm-hyogo/shared` から import する。

| # | ケース | 期待値 | 対応 AC |
| --- | --- | --- | --- |
| ZC-1 | 0% 行のバー fill rect の `width` 属性が `"0"` | `row.rate = 0` のデータで `<svg class="attendance-zone-bar">` 内の 2 番目 `<rect>` の `width` 属性が `"0"` | AC-2 |
| ZC-2 | 低率行のバー fill rect の `width` 属性が `"2"` 以上にならない（旧 `Math.max(2,…)` でない） | `row.rate = 0.01` のデータで fill rect `width` が `"1"` になる（`0.01 * 100 = 1`、旧ロジックなら `"2"` になっていた） | AC-2 |
| ZC-3 | `ZONE_HELP` 文言が DOM に存在する | `screen.getByText(ZONE_HELP)` が存在 | AC-3 |
| ZC-4 | `ZONE_LABEL["0→1"]` = `"0 回（未出席）"` が行ラベルとして描画される | `screen.getByText("0 回（未出席）")` が存在 | AC-3 |
| ZC-5 | 空データ時に `data-testid="attendance-zone-empty"` が表示される | `rows = []` で `screen.getByTestId("attendance-zone-empty")` が存在 | AC-5 |
| ZC-6 | `data-testid="attendance-zone-distribution"` ラッパーが存在する | 正常データで `screen.getByTestId("attendance-zone-distribution")` が存在 | AC-1 |

**テストデータ例**（spec 内に直書きするテーブル型データ）:

```ts
const sampleData: AttendanceZoneDistribution = {
  rows: [
    { zone: "0→1", attendeeCount: 5, rate: 0 },
    { zone: "1→10", attendeeCount: 10, rate: 0.01 },
    { zone: "10→100", attendeeCount: 30, rate: 0.6 },
    { zone: "unknown", attendeeCount: 2, rate: 0.04 },
  ],
};
```

> `AttendanceZoneDistribution` 型は `@ubm-hyogo/shared` から import する。
> `vi.mock` は不要（純粋な表示コンポーネント）。

#### 3.3 `KpiPanel.spec.tsx`（更新）

既存 spec は 3 ケース（rate/attendeeCount/avg/sessions 描画・delta `—`・ゼロ除算）。
以下のケースを **追記** する（既存 3 ケースは変更しない）。

| # | ケース | 期待値 | 対応 AC |
| --- | --- | --- | --- |
| KP-1 | `attendance-kpi-attendees` カードに `"unique"` 文字列が含まれない | `screen.getByTestId("attendance-kpi-attendees").textContent` が `"unique"` を含まない | AC-4 |
| KP-2 | 延べ出席数の説明テキストが描画される | `screen.getByTestId("attendance-kpi-attendees").textContent` が `"延べ"` を含む | AC-4 |
| KP-3 | 「全体出席率」カードに説明テキストが描画される | `screen.getByTestId("attendance-kpi-rate").textContent` が空でない（label + value 以外に hint が存在） | AC-4 |
| KP-4 | 「平均出席数」カードに説明テキストが描画される | `screen.getByTestId("attendance-kpi-avg").textContent` が `"セッション"` を含む（既存維持） | AC-4 |
| KP-5 | 「セッション数」カードに説明テキストが描画される | `screen.getByTestId("attendance-kpi-sessions").textContent` が `"開催"` を含む（既存維持） | AC-4 |

> 既存ケース「renders 4 KPI cards with rate, attendee count, avg, sessions」「shows '—' delta when previousPeriodRate is null」「handles zero sessions without division by zero」は変更しない。

### 4. grep gate（AC-6・AC-7）

これらは unit test ではなく QA/CI ステップとして Phase 9 でも再実行する。

| # | チェック | コマンド | 期待 |
| --- | --- | --- | --- |
| G-1 | `globals.css` に HEX 直書きなし | `grep -nE '(oklch\|#[0-9a-fA-F]{3,8})' apps/web/src/styles/globals.css \| grep -v '^\s*/\*' \| grep -v -- '--ubm-color-'` | ヒット 0 |
| G-2 | attendance 配下の TSX に arbitrary color なし | `grep -rnE '(bg\|text\|border)-\[#' apps/web/src/features/admin/attendance` | ヒット 0 |
| G-3 | `apps/api` 無変更 | `git diff --name-only -- apps/api \| grep .` | ヒット 0（exit code 1 = PASS） |

> G-1 は追加 CSS ブロックに対して実行する（既存行が旧来 HEX を持つ場合は追加分のみ確認する）。
> 実運用では `grep -n` の出力行数で確認する。

### 5. `verify:design-tokens` gate（AC-6）

```bash
mise exec -- pnpm verify:tokens
```

globals.css 追加後に必須実行する。green = PASS。

### 6. TDD Red 期待結果（実装前の fail 想定）

Phase 5 実装前にテストを更新した状態で実行すると、以下が **fail（Red）** する想定。

| テストケース | Red の理由 |
| --- | --- |
| ZL-1..4 ZONE_LABEL 新値 | 現行 `ZONE_LABEL["0→1"]` は `"0→1 区画"` であり新値 `"0 回（未出席）"` と不一致 |
| ZL-5 ZONE_HELP export | 現行 `format-attendance.ts` に `ZONE_HELP` が存在しない |
| ZC-1 バー fill rect width `"0"` | 現行コードは `Math.max(2, row.rate * 100)` のため 0% でも `"2"` になる |
| ZC-2 fill rect width `"1"` | 同上、`0.01 * 100 = 1` のはずが `Math.max(2, 1) = 2` になる |
| ZC-3 ZONE_HELP 文言描画 | 現行コンポーネントに `ZONE_HELP` 描画なし |
| ZC-4 `"0 回（未出席）"` 描画 | 現行は `"0→1 区画"` |
| KP-1 `"unique"` 非存在 | 現行 hint が `"期間内 unique 出席者"` |
| KP-2 `"延べ"` 描画 | 現行に `"延べ"` テキストなし |

> Phase 5 実装完了後にすべて green に転じることを Phase 6/9 で確認する。

### 7. focused 実行コマンド

```bash
# 依存・esbuild 整合を先に確認（worktree 直後は必須）
mise exec -- pnpm install
mise exec -- pnpm verify:vitest-runtime

# focused run（全件 run は避ける）
mise exec -- pnpm exec vitest run \
  --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/attendance/__tests__
```

個別実行例:

```bash
mise exec -- pnpm exec vitest run \
  --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/attendance/__tests__/format-attendance.spec.ts

mise exec -- pnpm exec vitest run \
  --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/attendance/__tests__/AttendanceZoneDistributionChart.spec.tsx

mise exec -- pnpm exec vitest run \
  --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/attendance/__tests__/KpiPanel.spec.tsx
```

> Vitest / esbuild runtime トラブル時は `pnpm verify:vitest-runtime` で 3 verify を実行し、
> `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/runbook.md` を参照する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 設計確定値 | `docs/30-workflows/admin-attendance-dashboard-ux/phase-2-design.md` | CSS ブロック・ラベル設計・変更 10 ファイル |
| 設計レビュー | `docs/30-workflows/admin-attendance-dashboard-ux/phase-3-design-review.md` | 設計判断の正本 |
| ラベル定数 | `apps/web/src/features/admin/attendance/lib/format-attendance.ts` | 現行 `ZONE_LABEL` |
| ZoneChart | `apps/web/src/features/admin/attendance/components/AttendanceZoneDistributionChart.tsx` | `Math.max(2, …)` の現行コード |
| KpiPanel | `apps/web/src/features/admin/attendance/components/KpiPanel.tsx` | 現行 `"期間内 unique 出席者"` hint |
| 既存 spec | `apps/web/src/features/admin/attendance/__tests__/format-attendance.spec.ts` | 更新対象 |
| 既存 spec | `apps/web/src/features/admin/attendance/__tests__/KpiPanel.spec.tsx` | 更新対象 |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| design-tokens | `.claude/skills/aiworkflow-requirements/references/design-tokens.md` | OKLch トークン正本・HEX 禁止不変条件 |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | admin ナビ / 画面構成の正本 |

## 成果物

- `apps/web/src/features/admin/attendance/__tests__/format-attendance.spec.ts`（ZL-1..5 追記）
- `apps/web/src/features/admin/attendance/__tests__/AttendanceZoneDistributionChart.spec.tsx`（新規・ZC-1..6）
- `apps/web/src/features/admin/attendance/__tests__/KpiPanel.spec.tsx`（KP-1..5 追記）

## 統合テスト連携

- Phase 6 で fail path・回帰 guard を追加し、本 Phase のケースを補完する。
- Phase 9（QA）で grep gate（G-1..G-3）/ `verify:design-tokens` を再実行し全 green を確認する。
- Phase 11（視覚確認）で AC-1（レイアウト復旧）/ AC-5（見方ガイド・空状態）を staging 実機で確認する。

## 完了条件

- テストケース表（§3.1..3.3）が AC-2/3/4 へ trace されている。
- Red 期待結果（§6）が確定し、Phase 5 実装で green へ転じる対象が明示されている。
- focused 実行コマンド（§7）と grep gate（§4）が Phase 9 で再実行可能な形で確定している。
- CSS 崩れ系（AC-1）が「DOM class 存在 + Phase 11 視覚」で担保する旨が明記されている。
