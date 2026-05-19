# Phase 4: テストファースト設計 / 契約テスト

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 |
| 区分 | テスト設計（red baseline 作成、Phase 5 で green 化） |
| 想定所要 | 0.5 人日 |

## 目的

Phase 3 契約に対する vitest テストを先に整備し、Phase 5 実装が green になる red baseline を作る。`*.spec.tsx` 命名（`*.test.tsx` 禁止: CLAUDE.md 不変条件 8）。

## 追加テストファイル

| ファイル | フレームワーク | 主目的 |
| --- | --- | --- |
| `apps/web/src/features/admin/components/_dashboard/StatusDistribution.spec.tsx` | vitest + @testing-library/react | render 分岐 / SVG 描画 / a11y / token 引当 |

## テストケース（TC-CHART-NN）

| ID | 対象 | 入力 | 期待 |
| --- | --- | --- | --- |
| TC-CHART-01 | placeholder | `slices === undefined` | `<p role="status">分布データは現在集計対象外です</p>` が render される。SVG は存在しない |
| TC-CHART-02 | placeholder | `slices === []` | 同上 |
| TC-CHART-03 | chart render | `[{status:"public",count:12},{status:"member_only",count:8},{status:"hidden",count:3}]` | `[data-testid="status-distribution-chart"]` が 1 つ存在し、`role="img"` を持つ |
| TC-CHART-04 | bar 数 | 同上 | `[data-testid="status-bar"]` が 3 つ存在し、それぞれ `data-status="public" / "member_only" / "hidden"` を持つ |
| TC-CHART-05 | bar 高さ比例 | 同上 | public bar の `height` 属性 > member_only > hidden bar |
| TC-CHART-06 | label | 同上 | "公開" / "会員限定" / "非公開" の text 要素が存在 |
| TC-CHART-07 | count 表示 | 同上 | "12" / "8" / "3" の text 要素が存在 |
| TC-CHART-08 | aria-label | 同上 | `aria-label` が "公開ステータス分布: 公開 12, 会員限定 8, 非公開 3" を含む |
| TC-CHART-09 | token 引当 | 同上 | 各 `<rect>` の `fill` 属性が `var(--ubm-color-ok)` / `var(--ubm-color-info)` / `var(--ubm-color-warn)` のいずれかである |
| TC-CHART-10 | HEX 直書き禁止 | render 結果 HTML | `/#[0-9a-fA-F]{6}/` に match しない |
| TC-CHART-11 | tooltip | 各 bar | `<title>` 子要素を持ち、内容が "公開: 12" 等である |
| TC-CHART-12 | 0 除算回避 | `[{status:"public",count:0},{status:"member_only",count:0},{status:"hidden",count:0}]` | render が throw しない / 各 bar の `height` が `0` または有限値 |
| TC-CHART-13 | 部分入力 | `[{status:"public",count:5}]` | bar 1 個のみ描画され、その他 status は描画されない |
| TC-CHART-14 | props 不変 | TypeScript signature | `StatusDistributionProps.slices` 型が `ReadonlyArray<StatusSlice> \| undefined` のまま |

## テスト雛形

```typescript
// apps/web/src/features/admin/components/_dashboard/StatusDistribution.spec.tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusDistribution } from "./StatusDistribution";
import type { StatusSlice } from "../../../../lib/admin/admin-dashboard-ui";

const sampleSlices: ReadonlyArray<StatusSlice> = [
  { status: "public", count: 12 },
  { status: "member_only", count: 8 },
  { status: "hidden", count: 3 },
];

describe("StatusDistribution", () => {
  it("TC-CHART-01: renders placeholder when slices is undefined", () => {
    render(<StatusDistribution slices={undefined} />);
    expect(screen.getByRole("status")).toHaveTextContent("分布データは現在集計対象外です");
    expect(screen.queryByTestId("status-distribution-chart")).toBeNull();
  });

  it("TC-CHART-03: renders SVG chart when slices populated", () => {
    render(<StatusDistribution slices={sampleSlices} />);
    const svg = screen.getByTestId("status-distribution-chart");
    expect(svg.getAttribute("role")).toBe("img");
  });

  it("TC-CHART-08: aria-label summarises slice counts", () => {
    render(<StatusDistribution slices={sampleSlices} />);
    const svg = screen.getByTestId("status-distribution-chart");
    expect(svg.getAttribute("aria-label")).toContain("公開 12");
    expect(svg.getAttribute("aria-label")).toContain("会員限定 8");
    expect(svg.getAttribute("aria-label")).toContain("非公開 3");
  });

  it("TC-CHART-09: rect fill uses OKLch token vars", () => {
    const { container } = render(<StatusDistribution slices={sampleSlices} />);
    const rects = container.querySelectorAll('[data-testid="status-bar"] rect');
    rects.forEach(rect => {
      const fill = rect.getAttribute("fill") ?? "";
      expect(fill).toMatch(/var\(--ubm-color-(ok|info|warn)\)/);
    });
  });

  it("TC-CHART-10: no HEX colors in markup", () => {
    const { container } = render(<StatusDistribution slices={sampleSlices} />);
    expect(container.innerHTML).not.toMatch(/#[0-9a-fA-F]{6}\b/);
  });

  // TC-CHART-02, 04, 05, 06, 07, 11, 12, 13 も同様に記述
});
```

## grep gate（CI gate と整合）

- `apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx` の追加部分に `#[0-9a-fA-F]{6}` リテラルが含まれないこと。
- `bg-\[#` / `text-\[#` / `fill="#` リテラルが含まれないこと。

## 実行タスク

- Phase 4: focused Vitest で placeholder と chart render の契約を固定する。

## 参照資料

- - `phase-01.md`
- - `phase-02.md`
- - `phase-03.md`

## 成果物

- - `apps/web/src/features/admin/components/_dashboard/StatusDistribution.spec.tsx` を作成する。

## 統合テスト連携

- - `pnpm --filter @ubm-hyogo/web test -- --run apps/web/src/features/admin/components/_dashboard/StatusDistribution.spec.tsx` に接続する。

## 完了条件

- [ ] `StatusDistribution.spec.tsx` が新規作成され、TC-CHART-01〜14 が定義されている
- [ ] Phase 5 実装前に red（fail）になることを確認している
- [ ] テストは `pnpm test apps/web --run -- StatusDistribution.spec.tsx` で実行可能

## 依存Phase trace

- Phase 1 / phase-01.md
- Phase 2 / phase-02.md
- Phase 3 / phase-03.md
