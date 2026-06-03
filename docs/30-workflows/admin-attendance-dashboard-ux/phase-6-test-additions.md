# Phase 6: テスト拡充

## メタ情報

- task_id: `admin-attendance-dashboard-ux`
- 前提: Phase 1（AC-1..AC-9）/ Phase 2（CSS・ラベル設計）/ Phase 4（テスト計画・ZL/ZC/KP・grep gate）/ Phase 5（実装 Green）
- 本 Phase の責務: Phase 4 のテストケース（ZL-1..5 / ZC-1..6 / KP-1..5）を実 spec コードとして確定し、回帰 guard・fail path を補完する。新規 2 spec の骨子（import / render / assert）と既存 2 spec の更新差分を確定する

## 目的

Phase 4 で計画したテストを、`@testing-library/react` + jsdom + vitest の実コードへ落とし込む。
AC-2（バー楕円解消）・AC-3（ラベル / 凡例）・AC-4（KPI hint）を jsdom で機械検証できる状態にし、
CSS 崩れ（AC-1）/ 見方ガイド（AC-5）は class 付与の事実のみ DOM で確認、実描画は Phase 11 視覚に委ねる。
すべて `*.spec.ts(x)` 命名（不変条件 #8: `*.test.*` 禁止）で co-location（`__tests__/`）配置する。

## 実行タスク

### 1. テストファイル一覧と種別

| ファイル | 種別 | 対応 AC | Phase 4 ケース |
| --- | --- | --- | --- |
| `apps/web/src/features/admin/attendance/__tests__/format-attendance.spec.ts` | 更新 | AC-3 | ZL-1..5 |
| `apps/web/src/features/admin/attendance/__tests__/AttendanceZoneDistributionChart.spec.tsx` | 新規 | AC-2 / AC-3 / AC-5 | ZC-1..6 |
| `apps/web/src/features/admin/attendance/__tests__/KpiPanel.spec.tsx` | 更新 | AC-4 | KP-1..5 |

> `AttendanceTrendChart.spec.tsx` / `buildExportUrl.spec.ts` は本タスクで変更しない（回帰確認のみ）。

### 2. format-attendance.spec.ts の更新差分（ZL-1..5・AC-3）

既存 `ZONE_LABEL covers known zones` ケース（現行 L35-38: 旧値 `toBeDefined` のみ）を新値の厳密一致へ更新し、`ZONE_HELP` の export を検証するケースを追加する。`formatRate` / `formatDelta` / `presetToPeriod` の既存ケース（現行 L10-33）は変更しない。

Before（現行 L1-7 import + L35-38 のケース）:

```ts
import { describe, it, expect } from "vitest";
import {
  formatRate,
  formatDelta,
  presetToPeriod,
  ZONE_LABEL,
} from "../lib/format-attendance";
// …
  it("ZONE_LABEL covers known zones", () => {
    expect(ZONE_LABEL["0→1"]).toBeDefined();
    expect(ZONE_LABEL.unknown).toBeDefined();
  });
```

After（import に `ZONE_HELP` 追加・新値の厳密一致 + ZONE_HELP 検証へ差し替え）:

```ts
import { describe, it, expect } from "vitest";
import {
  formatRate,
  formatDelta,
  presetToPeriod,
  ZONE_LABEL,
  ZONE_HELP,
} from "../lib/format-attendance";
// …（formatRate / formatDelta / presetToPeriod の既存 4 ケースは不変）

  it("ZONE_LABEL uses attendance-count labels (ZL-1..4)", () => {
    expect(ZONE_LABEL["0→1"]).toBe("0 回（未出席）");   // ZL-1
    expect(ZONE_LABEL["1→10"]).toBe("1〜9 回");          // ZL-2
    expect(ZONE_LABEL["10→100"]).toBe("10〜99 回");      // ZL-3
    expect(ZONE_LABEL.unknown).toBe("100 回以上");        // ZL-4
  });

  it("ZONE_HELP is a non-empty string (ZL-5)", () => {
    expect(typeof ZONE_HELP).toBe("string");
    expect(ZONE_HELP.length).toBeGreaterThan(0);
  });
```

> 回帰 guard: `ZONE_LABEL` の 4 キー網羅は `Record<AttendanceZone, string>` 型で typecheck が保証する。spec では値の厳密一致のみ確認する。

### 3. AttendanceZoneDistributionChart.spec.tsx の新規骨子（ZC-1..6・AC-2/3/5）

`@ubm-hyogo/shared` の `AttendanceZoneDistribution` 型を import し、テーブル型データを直書きで render する。`vi.mock` は不要（純表示コンポーネント）。`AttendanceTrendChart.spec.tsx` と同じ `cleanup` / `afterEach` パターンを踏襲する。

骨子（import / data / render / assert）:

```tsx
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { AttendanceZoneDistribution } from "@ubm-hyogo/shared";
import { AttendanceZoneDistributionChart } from "../components/AttendanceZoneDistributionChart";
import { ZONE_HELP } from "../lib/format-attendance";

afterEach(() => cleanup());

const sampleData: AttendanceZoneDistribution = {
  rows: [
    { zone: "0→1", attendeeCount: 5, rate: 0 },
    { zone: "1→10", attendeeCount: 10, rate: 0.01 },
    { zone: "10→100", attendeeCount: 30, rate: 0.6 },
    { zone: "unknown", attendeeCount: 2, rate: 0.04 },
  ],
};

describe("AttendanceZoneDistributionChart", () => {
  it("renders 0% bar fill rect with width '0' (ZC-1)", () => {
    const { container } = render(<AttendanceZoneDistributionChart data={sampleData} />);
    // 各 row の 2 番目 <rect>（fill）が幅 = rate*100。rate=0 行は width "0"。
    const fills = Array.from(container.querySelectorAll(".attendance-zone-bar"))
      .map((svg) => svg.querySelectorAll("rect")[1]); // [0]=背景, [1]=fill
    expect(fills[0]?.getAttribute("width")).toBe("0");
  });

  it("low-rate bar fill is rate*100, not floored to 2 (ZC-2)", () => {
    const { container } = render(<AttendanceZoneDistributionChart data={sampleData} />);
    const fills = Array.from(container.querySelectorAll(".attendance-zone-bar"))
      .map((svg) => svg.querySelectorAll("rect")[1]);
    // rate=0.01 → 1（旧 Math.max(2,…) なら "2" になっていた）
    expect(fills[1]?.getAttribute("width")).toBe("1");
  });

  it("renders ZONE_HELP legend caption (ZC-3)", () => {
    render(<AttendanceZoneDistributionChart data={sampleData} />);
    expect(screen.getByText(ZONE_HELP)).toBeTruthy();
  });

  it("renders count-based zone label '0 回（未出席）' (ZC-4)", () => {
    render(<AttendanceZoneDistributionChart data={sampleData} />);
    expect(screen.getByText("0 回（未出席）")).toBeTruthy();
  });

  it("renders empty state when rows are empty (ZC-5)", () => {
    render(<AttendanceZoneDistributionChart data={{ rows: [] }} />);
    expect(screen.getByTestId("attendance-zone-empty")).toBeTruthy();
  });

  it("renders distribution wrapper for non-empty data (ZC-6)", () => {
    render(<AttendanceZoneDistributionChart data={sampleData} />);
    expect(screen.getByTestId("attendance-zone-distribution")).toBeTruthy();
  });
});
```

> ZC-1 / ZC-2 は SVG `<rect>` の `width` 属性を文字列で比較する（React は `width={1}` を属性 `"1"` として描画。`width={0}` は `"0"`）。`querySelectorAll("rect")[1]` で各バーの fill rect（[0] は背景 rect）を取得する。
> ZC-3 は `screen.getByText(ZONE_HELP)`（実定数を import して文言ドリフトを防ぐ）。ZC-4 は回数表記ラベルの DOM 描画を確認。
> `AttendanceZoneDistribution` / `AttendanceZone` 型は `@ubm-hyogo/shared` から取得し、`rate` の数値が実描画幅に一致することを保証する。

### 4. KpiPanel.spec.tsx の更新差分（KP-1..5・AC-4）

既存 spec（現行 L16-43: 3 ケース）は変更せず、`describe("KpiPanel")` 内に KP-1..5 を **追記**する。`baseOverview` fixture（現行 L8-14）を再利用する。

追記する 2 ケース（KP-1/KP-2）と既存維持の確認（KP-3/4/5）:

```tsx
  it("attendee count card no longer shows 'unique' (KP-1)", () => {
    render(<KpiPanel overview={baseOverview} attendeeCount={120} />);
    expect(screen.getByTestId("attendance-kpi-attendees").textContent).not.toContain("unique");
  });

  it("attendee count card shows cumulative ('延べ') wording (KP-2)", () => {
    render(<KpiPanel overview={baseOverview} attendeeCount={120} />);
    expect(screen.getByTestId("attendance-kpi-attendees").textContent).toContain("延べ");
  });

  it("rate card has a non-empty hint (KP-3)", () => {
    render(<KpiPanel overview={baseOverview} attendeeCount={120} />);
    const text = screen.getByTestId("attendance-kpi-rate").textContent ?? "";
    expect(text.length).toBeGreaterThan("全体出席率42.0%".length); // label+value 以外に hint が存在
  });

  it("avg card hint mentions 'セッション' (KP-4)", () => {
    render(<KpiPanel overview={baseOverview} attendeeCount={120} />);
    expect(screen.getByTestId("attendance-kpi-avg").textContent).toContain("セッション");
  });

  it("sessions card hint mentions '開催' (KP-5)", () => {
    render(<KpiPanel overview={baseOverview} attendeeCount={120} />);
    expect(screen.getByTestId("attendance-kpi-sessions").textContent).toContain("開催");
  });
```

> KP-1 は否定 assert（`not.toContain("unique")`）で旧 hint の残存を検出する fail path。KP-2 は新 hint（`"全セッションの出席記録の合計（延べ）"` に含まれる `"延べ"`）の存在確認。
> KP-3 は label+value 以外に hint が描画されることを length で確認する（hint 欠落の回帰 guard）。KP-4/KP-5 は Phase 5 で hint 文言を更新しても `"セッション"` / `"開催"` を含む契約を維持する確認。
> 既存 3 ケース（rate/attendeeCount/avg/sessions 描画・`—` delta・ゼロ除算）は不変（回帰保護）。

### 5. 追加の回帰 guard / fail path

| guard | 対象 spec | 内容 | 目的 |
| --- | --- | --- | --- |
| ZONE_LABEL 厳密一致 | format-attendance | ZL-1..4 を `toBe` で固定 | 文言ドリフト時に即 fail |
| ZONE_HELP import 比較 | AttendanceZoneDistributionChart | ZC-3 で実定数を `getByText` | コンポーネントと定数の不一致検出 |
| `unique` 否定 assert | KpiPanel | KP-1 `not.toContain` | 旧ラベル復活の回帰検出 |
| 空状態 testid | AttendanceZoneDistributionChart | ZC-5 `rows: []` | 空配列 fail path |
| 既存ケース不変 | 3 spec すべて | 旧ケースを温存 | 既存契約の破壊検出 |

> Top10 空状態 class（`attendance-trend-empty`）は Phase 8 §ステップ 2 で付与するが、`AttendanceTop10Ranking` は本タスクのテスト対象外（Phase 4 §2 で対象外明記）。既存 `attendance-top10-empty` testid は不変のため新規 spec は追加しない。

### 6. focused 実行コマンド

```bash
# worktree 直後は依存・esbuild 整合を先に確認
mise exec -- pnpm install
mise exec -- pnpm verify:vitest-runtime

# attendance __tests__ をまとめて focused run
mise exec -- pnpm exec vitest run \
  --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/attendance/__tests__

# 個別実行
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/attendance/__tests__/format-attendance.spec.ts
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/attendance/__tests__/AttendanceZoneDistributionChart.spec.tsx
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/attendance/__tests__/KpiPanel.spec.tsx
```

> 本リポジトリの vitest 設定はルート `vitest.config.ts` に集約されている（`vitest.config.ts` は不在）。`include` glob（`apps/**/__tests__/**/*.spec.{ts,tsx}`）で attendance spec が収集される。
> Vitest / esbuild runtime トラブル時は `pnpm verify:vitest-runtime` を実行し、`docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/runbook.md` を参照する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| テスト計画（Red） | `docs/30-workflows/admin-attendance-dashboard-ux/phase-4-test-plan.md` | ZL/ZC/KP ケース定義・テストデータ・期待 Red |
| 実装（Green） | `docs/30-workflows/admin-attendance-dashboard-ux/phase-5-implementation.md` | 各 spec が検証する実コード差分 |
| 設計正本 | `docs/30-workflows/admin-attendance-dashboard-ux/phase-2-design.md` | `ZONE_LABEL` / `ZONE_HELP` 値・KPI hint 文言 |
| 既存 spec（更新） | `apps/web/src/features/admin/attendance/__tests__/format-attendance.spec.ts` | ZL-1..5 反映先 |
| 既存 spec（更新） | `apps/web/src/features/admin/attendance/__tests__/KpiPanel.spec.tsx` | KP-1..5 追記先 |
| 既存 spec（参照） | `apps/web/src/features/admin/attendance/__tests__/AttendanceTrendChart.spec.tsx` | RTL/jsdom テストスタイルの先例 |
| 対象コンポーネント | `apps/web/src/features/admin/attendance/components/AttendanceZoneDistributionChart.tsx` | 新規 spec の render 対象 |
| カバレッジ基準 | `.claude/skills/task-specification-creator/references/coverage-standards.md` | 80% 閾値・実測値記載基準（Phase 7 連携） |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| design-tokens | `.claude/skills/aiworkflow-requirements/references/design-tokens.md` | OKLch トークン正本・HEX 禁止不変条件 |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | admin ナビ / 画面構成の正本 |

## 成果物

| 成果物 | 種別 | 内容 |
| --- | --- | --- |
| `apps/web/src/features/admin/attendance/__tests__/format-attendance.spec.ts` | 更新 | ZL-1..5（`ZONE_LABEL` 新値厳密一致・`ZONE_HELP` export） |
| `apps/web/src/features/admin/attendance/__tests__/AttendanceZoneDistributionChart.spec.tsx` | 新規 | ZC-1..6（バー幅 0/1・凡例・ラベル・空状態・ラッパー） |
| `apps/web/src/features/admin/attendance/__tests__/KpiPanel.spec.tsx` | 更新 | KP-1..5（`unique` 非含有・延べ・hint 存在） |

## 統合テスト連携

- Phase 5 実装後、本 Phase の全ケースが Green へ転じる（Phase 4 §6 の Red 一覧が解消）。
- Phase 7 で本 Phase が触れた lib / components のカバレッジ（branch/line）を測定する。CSS は jsdom 非カバレッジのため Phase 11 視覚で担保する。
- Phase 9 QA で focused vitest（4 spec）/ grep gate / `verify:design-tokens` を再実行し全 PASS を確認する。

## 完了条件

1. `format-attendance.spec.ts` に ZL-1..5（`ZONE_LABEL` 新値 4 件の `toBe` + `ZONE_HELP` 非空）が実装され、既存 4 ケースが不変である。
2. `AttendanceZoneDistributionChart.spec.tsx` が新規作成され、ZC-1..6（width "0" / "1"・凡例・ラベル・空状態・ラッパー）が実装されている。
3. `KpiPanel.spec.tsx` に KP-1..5 が追記され、既存 3 ケースが不変である。
4. すべて `*.spec.ts(x)` 命名（不変条件 #8）で `__tests__/` に co-location 配置されている。
5. focused vitest（attendance `__tests__`）が全 PASS で、Phase 4 の Red が解消されている。
