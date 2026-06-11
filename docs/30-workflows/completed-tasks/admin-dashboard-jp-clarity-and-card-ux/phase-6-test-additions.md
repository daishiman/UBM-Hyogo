# Phase 6: テスト追加

- task_id: `admin-dashboard-jp-clarity-and-card-ux`
- 前提: Phase 1（要件・AC-1..AC-10）/ Phase 2（設計・glossary / C1-C4 Before/After）/ Phase 3（設計レビュー PASS）/ Phase 4（テスト計画）/ Phase 5（実装 Green）
- 本 Phase の責務: Phase 4 で計画した各テストを `@testing-library/react` + jsdom + vitest の実 spec コードへ確定し、回帰 guard / fail path / negative assert を補完する。

## 目的

英語ラベル・技術用語の日本語化（AC-1/2/3/6）とカード型 UI 再設計（AC-4/5）を jsdom で機械検証できる状態にする。
- `dashboardGlossary` の純関数（accessor + fallback 分岐）を line/branch 単位で検証する。
- 各コンポーネントの「日本語化済み・技術語不在・テーブル不在・uppercase 不在」を **positive + negative の両 assert** で固定する。
- 既存テスト契約（aria-label「公開ステータス分布: …」/ HEX 禁止 / `/admin/audit` リンク / axe violations 0）を維持しつつ、構造系 assertion（testid / DOM 形状）のみ更新する。
- CSS が効いた実描画（はみ出し・横長解消の最終確認）は jsdom では評価できないため Phase 11（staging スクリーンショット・user-gated）に委ねる。

すべて `*.spec.ts(x)` 命名（不変条件 #8: `*.test.*` 禁止）で co-location 配置する。

## 成果物

| 成果物 | 種別 | 配置 | 対応 AC | 内容 |
| --- | --- | --- | --- | --- |
| `apps/web/src/lib/admin/__tests__/dashboardGlossary.spec.ts` | 新規 | `lib/admin/__tests__/` | AC-6 | GL-1..7（KPI/STATUS ラベル一致・accessor 既知一致・fallback raw 保持） |
| `apps/web/src/features/admin/components/__tests__/KpiGrid.spec.tsx` | 更新 | `components/__tests__/` | AC-1 | KG-1..4（日本語 4 ラベル・uppercase 不在・英語不在・testid 4 枚） |
| `apps/web/src/features/admin/components/_dashboard/__tests__/SchemaAlertCard.spec.tsx` | 新規 | `_dashboard/__tests__/` | AC-2 | SA-1..4（平易日本語・技術語不在・`/admin/schema` リンク・`role="alert"`） |
| `apps/web/src/features/admin/components/_dashboard/__tests__/ZoneDistribution.spec.tsx` | 更新 | `_dashboard/__tests__/` | AC-3 | 既存 4 ケース不変 + ZD-5（`DISTRIBUTION` 不在・`会員分布` 描画） |
| `apps/web/src/features/admin/components/_dashboard/StatusDistribution.spec.tsx` | 更新 | `_dashboard/` | AC-5 / AC-9 | 縦棒 SVG 前提を横バーリストへ更新・aria-label 契約維持 |
| `apps/web/src/features/admin/components/__tests__/RecentActionsTable.spec.tsx` | 更新 | `components/__tests__/` | AC-4 / AC-9 | テーブル前提をカードリストへ更新・glossary 日本語化・axe 維持 |

> 既存 spec は `StatusDistribution.spec.tsx`（コンポーネントと同階層）と `RecentActionsTable.spec.tsx`（`components/__tests__/`）に存在する。新規 spec は対象コンポーネントに最も近い `__tests__/` へ配置する（既存 `ZoneDistribution.spec.tsx` と同様）。

## AC ⇄ テスト trace matrix

| AC | 内容 | spec / ケース | 検証点 |
| --- | --- | --- | --- |
| AC-1 | KPI 4 枚日本語化・uppercase 撤廃 | KpiGrid.spec KG-1..4 | 4 日本語ラベル描画 / `uppercase` class 不在 / `Total members` 等英語不在 / testid 4 枚 |
| AC-2 | SchemaAlertCard の技術語排除 | SchemaAlertCard.spec SA-1..4 | 平易日本語描画 / `スキーマ`・`alias`・`schema` 不在 / `/admin/schema` リンク / `role="alert"` |
| AC-3 | ZoneDistribution eyebrow 日本語化 | ZoneDistribution.spec ZD-5 | `会員分布` 描画 / `DISTRIBUTION` 不在 |
| AC-4 | 直近のアクションのカード化・日本語化・truncation | RecentActionsTable.spec RAT-01..06 | `recent-action-item` 件数 / `<table>` 不在 / glossary 日本語アクション・対象 / `truncate` class / 監査ログリンク |
| AC-5 | 公開ステータスのコンパクト横バー化・600px SVG 廃止 | StatusDistribution.spec SD-01..08 | `status-distribution-list` / 横バー `viewBox="0 0 100 8"` / `VIEWBOX.width=600` 由来マークアップ不在 |
| AC-6 | dashboardGlossary SSOT 新設・fallback | dashboardGlossary.spec GL-1..7 | KPI/STATUS ラベル一致 / accessor 既知一致 / 未登録 raw 保持 |
| AC-7 | HEX 直書き 0 件 | 全 spec の `not.toMatch(/#[0-9a-fA-F]{6}/)` + Phase 9 `verify:tokens` | spec 内 markup HEX 不在（gate は Phase 9） |
| AC-8 | apps/api 非変更 | Phase 9 `git diff --name-only -- apps/api` | 本 Phase 対象外（Phase 9 gate） |
| AC-9 | 既存テスト契約維持しつつ新構造へ更新 | StatusDistribution.spec / RecentActionsTable.spec / ZoneDistribution.spec | aria-label「公開ステータス分布: …」維持 / `/admin/audit` リンク維持 / axe 0 維持 |
| AC-10 | focused vitest PASS | 本 §「focused 実行コマンド」 | 7 spec 全 PASS（実測: 7 files / 77 tests） |

## 統合テスト連携

- Phase 5 実装後、本 Phase の全ケースが Green へ転じる（Phase 4 の Red 一覧が解消）。
- Phase 7 で本 Phase が触れた lib（`dashboardGlossary.ts`）/ 5 コンポーネントの branch/line カバレッジを個別計測する。CSS は jsdom 非カバレッジのため Phase 11 視覚で担保する。
- Phase 9 QA で focused vitest（7 spec）/ `verify:tokens`（HEX 検出）/ `git diff --name-only -- apps/api`（API 非変更）を再実行し全 PASS を確認する。
- jsdom は CSS を評価しないため、`truncate`（`text-overflow:ellipsis`）の実効・横バーの実描画幅・600px 横長の解消は class / 属性付与の事実のみ DOM で確認し、最終的な見た目は Phase 11 staging スクリーンショット（実装後・user-gated）で確認する。

## 実装する具体的 assert

### 1. dashboardGlossary.spec.ts（GL-1..7・AC-6）

`apps/web/src/lib/admin/dashboardGlossary.ts` の export を import し、純関数として検証する（render 不要）。`describeAuditAction` / `describeTargetType` / `describeTarget` の fallback 分岐を漏れなく踏む。

```ts
import { describe, it, expect } from "vitest";
import {
  DASHBOARD_KPI_LABELS,
  MEMBER_STATUS_LABELS,
  describeAuditAction,
  describeTargetType,
  describeTarget,
} from "../dashboardGlossary";

describe("dashboardGlossary", () => {
  it("GL-1: KPI ラベルが日本語で固定されている", () => {
    expect(DASHBOARD_KPI_LABELS.totalMembers).toBe("会員総数");
    expect(DASHBOARD_KPI_LABELS.publicMembers).toBe("サイト公開中");
    expect(DASHBOARD_KPI_LABELS.untaggedMembers).toBe("タグ未設定");
    expect(DASHBOARD_KPI_LABELS.unresolvedSchema).toBe("要対応のフォーム項目");
  });

  it("GL-2: 公開ステータスラベルが日本語で固定されている", () => {
    expect(MEMBER_STATUS_LABELS.public).toBe("公開");
    expect(MEMBER_STATUS_LABELS.member_only).toBe("会員限定");
    expect(MEMBER_STATUS_LABELS.hidden).toBe("非公開");
  });

  it("GL-3: 既知の action code を日本語へ変換する", () => {
    expect(describeAuditAction("admin.member.status_updated")).toBe("会員の公開状態を変更");
    expect(describeAuditAction("member.status_updated")).toBe("会員の公開状態を変更");
    expect(describeAuditAction("attendance.add")).toBe("出席を記録");
    expect(describeAuditAction("admin.tag.queue_dlq_moved")).toBe("タグ付けキューを保留へ移動");
  });

  it("GL-4: 未登録 action code は raw 文字列を握り潰さず返す（fallback ?? code）", () => {
    expect(describeAuditAction("totally.unknown.code")).toBe("totally.unknown.code");
    expect(describeAuditAction("")).toBe("");
  });

  it("GL-5: 既知の targetType を日本語へ変換する", () => {
    expect(describeTargetType("member")).toBe("会員");
    expect(describeTargetType("meeting")).toBe("開催回");
    expect(describeTargetType("schema")).toBe("フォーム項目");
  });

  it("GL-6: 未登録 targetType は raw 値を返す（fallback ?? type）", () => {
    expect(describeTargetType("unknown_type")).toBe("unknown_type");
  });

  it("GL-7: describeTarget は targetId 有無で両分岐を返す（targetId ? : ）", () => {
    expect(describeTarget("member", "MEM-001")).toBe("会員 MEM-001");
    expect(describeTarget("member", null)).toBe("会員");
    expect(describeTarget("unknown", null)).toBe("unknown"); // fallback + null
  });
});
```

> **fail path / fallback branch 観点**: GL-4 / GL-6 は未登録キーで `?? code` / `?? type` の右辺へ落ちることを確認する fail path。GL-7 は `targetId ? `${label} ${targetId}` : label` の三項の両分岐（truthy / null）を踏む。これにより Phase 7 で fallback の branch coverage を 100% にする。
> **情報を握り潰さない契約（[WEEKGRD-02]）**: 未登録コードを `""` や `"不明"` に潰さず raw を返すことを GL-4 / GL-6 で固定し、API のコード体系拡張時にも情報欠落しないことを保証する。

### 2. KpiGrid.spec.tsx（KG-1..4・AC-1）

`KpiGrid` を render し、4 ラベルの日本語描画・uppercase 撤廃・英語不在を確認する。`totals` は `AdminDashboardView` の totals shape に合わせた直書き fixture。

```tsx
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { KpiGrid } from "../KpiGrid";

afterEach(() => cleanup());

const totals = {
  totalMembers: 42,
  publicMembers: 30,
  untaggedMembers: 3,
  unresolvedSchema: 1,
};

describe("KpiGrid", () => {
  it("KG-1: KPI 4 枚が日本語ラベルで描画される", () => {
    render(<KpiGrid totals={totals} />);
    expect(screen.getByText("会員総数")).toBeTruthy();
    expect(screen.getByText("サイト公開中")).toBeTruthy();
    expect(screen.getByText("タグ未設定")).toBeTruthy();
    expect(screen.getByText("要対応のフォーム項目")).toBeTruthy();
  });

  it("KG-2: 英語ラベルが DOM に存在しない（negative）", () => {
    const { container } = render(<KpiGrid totals={totals} />);
    const text = container.textContent ?? "";
    expect(text).not.toContain("Total members");
    expect(text).not.toContain("Public");
    expect(text).not.toMatch(/members/i);
  });

  it("KG-3: uppercase 装飾クラスが残っていない（negative）", () => {
    const { container } = render(<KpiGrid totals={totals} />);
    expect(container.querySelector('[class*="uppercase"]')).toBeNull();
  });

  it("KG-4: KPI カード 4 枚の testid が揃っている", () => {
    render(<KpiGrid totals={totals} />);
    expect(screen.getByTestId("admin-kpi-card-total")).toBeTruthy();
    expect(screen.getByTestId("admin-kpi-card-public")).toBeTruthy();
    expect(screen.getByTestId("admin-kpi-card-untagged")).toBeTruthy();
    expect(screen.getByTestId("admin-kpi-card-schema")).toBeTruthy();
  });
});
```

> **negative assert**: KG-2 は旧英語ラベル（`Total members` 等）の残存を検出する fail path。`/members/i` の汎用否定で英語化の再混入も拾う。KG-3 は `class*="uppercase"` を `querySelector` で探し、KpiCard の `uppercase tracking-wide` 撤廃の回帰 guard とする。
> KpiCard 単体は本タスクで label 行の class のみ変更（tone トークン・数値フォーマット不変）のため、KpiCard 専用 spec は新設せず KpiGrid 経由で検証する（過剰なテスト面の分裂を避ける）。

### 3. SchemaAlertCard.spec.tsx（SA-1..4・AC-2）

count > 0 で alert が描画される前提で、平易日本語と技術語不在を確認する。

```tsx
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SchemaAlertCard } from "../SchemaAlertCard";

afterEach(() => cleanup());

describe("SchemaAlertCard", () => {
  it("SA-1: 件数つき平易日本語の見出しを描画する", () => {
    render(<SchemaAlertCard count={2} />);
    expect(screen.getByText(/要対応のフォーム項目: 2 件/)).toBeTruthy();
  });

  it("SA-2: 技術語（スキーマ / alias / schema）が DOM に存在しない（negative）", () => {
    const { container } = render(<SchemaAlertCard count={2} />);
    const text = container.textContent ?? "";
    expect(text).not.toContain("スキーマ");
    expect(text).not.toMatch(/alias/i);
    expect(text).not.toMatch(/schema/i); // 表示テキストに技術語 schema が出ない（href は別途確認）
  });

  it("SA-3: 対応づけ画面リンク /admin/schema を維持する（回帰 guard）", () => {
    render(<SchemaAlertCard count={2} />);
    const link = screen.getByRole("link", { name: /フォーム項目の対応づけを開く/ });
    expect(link.getAttribute("href")).toBe("/admin/schema");
  });

  it("SA-4: role=\"alert\" を維持する（回帰 guard）", () => {
    render(<SchemaAlertCard count={2} />);
    expect(screen.getByRole("alert")).toBeTruthy();
  });
});
```

> **negative assert の境界**: SA-2 は表示テキスト（`container.textContent`）に対する否定であり、リンク href の `/admin/schema`（URL は API ルートで変更不可）は `textContent` に含まれないため衝突しない。`/schema/i` 否定はあくまで可視文言から技術語を排除する契約。href の維持は SA-3 で別途固定する。
> count=0 で非表示分岐がある場合は Phase 5 実装に合わせて空表示ケースを追記する（Phase 7 の branch coverage 対象）。

### 4. ZoneDistribution.spec.tsx（既存 4 ケース不変 + ZD-5・AC-3）

既存 4 ケース（role=img / li 構造 / placeholder / HEX 不在）は不変のまま、eyebrow 日本語化の ZD-5 を追記する。

```tsx
  it("ZD-5: eyebrow が日本語（会員分布）で DISTRIBUTION が残っていない", () => {
    const { container } = render(<ZoneDistribution slices={slices} />);
    const text = container.textContent ?? "";
    expect(text).toContain("会員分布");
    expect(text).not.toContain("DISTRIBUTION"); // negative: 英語大文字 eyebrow の残存検出
  });
```

> 既存テストは `role="img"` の name を `/zone 別人数/i` で取得している。本タスクは eyebrow（`DISTRIBUTION`）のみ日本語化し aria-label / `h-section` は不変のため、既存 4 ケースは変更しない。ZD-5 のみ追記する。

### 5. StatusDistribution.spec.tsx（SD-01..08・AC-5 / AC-9 更新）

縦棒 SVG（600px / `data-testid="status-distribution-chart"`）前提を、横バーリスト（`data-testid="status-distribution-list"`・`viewBox="0 0 100 8"`）前提へ更新する。**aria-label 契約「公開ステータス分布: …」は維持**する。

| ケース | 維持/更新 | assert |
| --- | --- | --- |
| SD-01 | 維持 | `slices=undefined` で `role="status"` placeholder「分布データは現在集計対象外です」/ list 不在 |
| SD-02 | 維持 | `slices=[]` で placeholder / list 不在 |
| SD-03 | 更新 | `slices=3` で `data-testid="status-distribution-list"` に `role="img"` と aria-label「公開ステータス分布: 公開 12, 会員限定 8, 非公開 3」 |
| SD-04 | 更新 | `status-bar` が 3 件・`data-status` が `["public","member_only","hidden"]` 順（既存契約維持） |
| SD-05 | 更新 | 各バー `<svg viewBox="0 0 100 8">` を持ち、count が大きいほど fill `<rect>` の `width` が大きい（比例） |
| SD-06 | 更新 | fill が `var(--ubm-color-ok|info|warn)` のトークン参照・`innerHTML` に `#[0-9a-fA-F]{6}` 不在（HEX 禁止維持） |
| SD-07 | 維持 | 全件 count=0 で例外を投げず、各 fill width が `"0"` |
| SD-08 | 更新 | 部分データ（`[{public,5}]`）で list 1 件・aria-label「公開ステータス分布: 公開 5」 |

更新ケースの骨子（SD-03 / SD-05 / negative）:

```tsx
  it("SD-03: 横バーリストが role=img と aria-label を持つ（AC-9 契約維持）", () => {
    render(<StatusDistribution slices={sampleSlices} />);
    const list = screen.getByTestId("status-distribution-list");
    expect(list.getAttribute("role")).toBe("img");
    expect(list.getAttribute("aria-label")).toBe("公開ステータス分布: 公開 12, 会員限定 8, 非公開 3");
  });

  it("SD-05: count に比例した横バー幅・600px 固定 SVG が廃止されている（negative）", () => {
    const { container } = render(<StatusDistribution slices={sampleSlices} />);
    const svgs = Array.from(container.querySelectorAll('[data-testid="status-bar"] svg'));
    // 横バーは viewBox="0 0 100 8" コンパクト。600px 固定 viewBox は存在しない
    expect(svgs.every((s) => s.getAttribute("viewBox") === "0 0 100 8")).toBe(true);
    expect(container.innerHTML).not.toContain("0 0 600 200");
    const fillWidths = svgs.map((s) => Number(s.querySelectorAll("rect")[1]?.getAttribute("width") ?? 0));
    expect(fillWidths[0]).toBeGreaterThan(fillWidths[1]); // public(12) > member_only(8)
    expect(fillWidths[1]).toBeGreaterThan(fillWidths[2]); // member_only(8) > hidden(3)
  });

  it("SD-06: バー色はトークンのみで HEX 直書きが無い（回帰 guard）", () => {
    const { container } = render(<StatusDistribution slices={sampleSlices} />);
    const fills = Array.from(container.querySelectorAll('[data-testid="status-bar"] svg rect'))
      .map((r) => r.getAttribute("fill") ?? "")
      .filter((f) => f.startsWith("var("));
    expect(fills).toContain("var(--ubm-color-ok)");
    expect(fills).toContain("var(--ubm-color-info)");
    expect(fills).toContain("var(--ubm-color-warn)");
    expect(container.innerHTML).not.toMatch(/#[0-9a-fA-F]{6}\b/);
  });
```

> **負の構造 assert**: SD-05 は旧 viewBox `0 0 600 200`（`VIEWBOX.width=600`/`height=200`）の不在を `innerHTML` で確認し、縦棒 SVG 廃止の回帰 guard とする。
> **AC-9 契約維持**: aria-label「公開ステータス分布: …」は `buildAriaLabel` をそのまま維持し `<svg>` から `<ul role="img">` へ付与先のみ移す。testid は `status-distribution-chart` → `status-distribution-list` へ更新する（Phase 3 リスク表に記載済み）。
> SD-07（全件 0）は `total>0 ? … : 0` の分岐で width `"0"` を返し例外を投げないことを確認する fail path。

### 6. RecentActionsTable.spec.tsx（RAT-01..06・AC-4 / AC-9 更新）

テーブル（`tbody tr`）前提を、カードリスト（`<ul>`/`<li data-testid="recent-action-item">`）前提へ更新する。**監査ログリンク `/admin/audit` と axe violations 0 は維持**する。

```tsx
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { axe } from "jest-axe";
import { RecentActionsTable } from "../_dashboard/RecentActionsTable";

afterEach(() => cleanup());

const makeItems = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    auditId: `a${i}`,
    actorEmail: "admin@example.com",
    action: "admin.member.status_updated",
    targetType: "member",
    targetId: `MEM-${i}-0123456789abcdef0123456789abcdef`, // 長い ID（truncation 対象）
    createdAt: "2026-05-10T00:00:00.000Z",
  }));

describe("RecentActionsTable", () => {
  it("RAT-01: items=[] で empty メッセージ（回帰 guard）", () => {
    render(<RecentActionsTable items={[]} />);
    expect(screen.getByText("直近 7 日のアクションはありません")).toBeTruthy();
    expect(screen.getByRole("status")).toBeTruthy();
  });

  it("RAT-02: items 5 件でカードリスト 5 件（テーブル廃止・AC-4）", () => {
    render(<RecentActionsTable items={makeItems(5)} />);
    expect(screen.getAllByTestId("recent-action-item")).toHaveLength(5);
  });

  it("RAT-03: <table>/<tbody> が DOM に存在しない（negative・テーブル廃止）", () => {
    const { container } = render(<RecentActionsTable items={makeItems(5)} />);
    expect(container.querySelector("table")).toBeNull();
    expect(container.querySelector("tbody")).toBeNull();
  });

  it("RAT-04: action / targetType が日本語化される（glossary 経由・AC-4）", () => {
    render(<RecentActionsTable items={makeItems(1)} />);
    expect(screen.getByText("会員の公開状態を変更")).toBeTruthy(); // describeAuditAction
    expect(screen.getByText(/対象: 会員/)).toBeTruthy(); // describeTarget → 会員 + ID
  });

  it("RAT-05: 対象行が truncate class でカード内に収まる", () => {
    const { container } = render(<RecentActionsTable items={makeItems(1)} />);
    // 対象行（描画上は <p> など）に truncate class が付与されている
    expect(container.querySelector('[class*="truncate"]')).toBeTruthy();
  });

  it("RAT-06: 監査ログリンク /admin/audit を維持する（回帰 guard）", () => {
    render(<RecentActionsTable items={[]} />);
    const link = screen.getByRole("link", { name: /監査ログを開く/ });
    expect(link.getAttribute("href")).toBe("/admin/audit");
  });

  it("a11y violations 0（回帰 guard）", async () => {
    const { container } = render(<RecentActionsTable items={makeItems(3)} />);
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
```

> **テーブル不在 negative**: RAT-03 は `<table>` / `<tbody>` の不在を確認し、旧 4 列 table の復活を検出する fail path（既存 RAT-02 の `tbody tr` 件数 assert を `recent-action-item` 件数へ置換）。
> **日本語化 assert**: RAT-04 は `action="admin.member.status_updated"` → 「会員の公開状態を変更」、`targetType="member"` → 「対象: 会員 …」を確認し、glossary 経由の表示変換を固定する。raw コード `admin.member.status_updated` が可視テキストに出ていないことも `expect(container.textContent).not.toContain("admin.member.status_updated")` で補強できる。
> **AC-9 契約維持**: 監査ログリンク `/admin/audit`（RAT-06）と axe 0 違反は不変。empty 時 `role="status"` も維持（RAT-01）。

## 既存テスト契約維持の回帰 guard 一覧

| guard | 対象 spec / ケース | 内容 | 目的 |
| --- | --- | --- | --- |
| aria-label「公開ステータス分布: …」 | StatusDistribution SD-03 / SD-08 | `buildAriaLabel` の出力を `<ul role="img">` で維持 | スクリーンリーダー契約の維持（AC-9） |
| HEX 禁止 `#[0-9a-fA-F]{6}` | StatusDistribution SD-06 / ZoneDistribution ZD-4 | `innerHTML` に 6 桁 HEX 不在 | OKLch トークン正本（AC-7） |
| `/admin/audit` リンク | RecentActionsTable RAT-06 | href 完全一致 | 監査ログ導線の維持（AC-9） |
| `/admin/schema` リンク | SchemaAlertCard SA-3 | href 完全一致 | 対応づけ画面導線の維持 |
| axe violations 0 | RecentActionsTable a11y | `axe(container)` violations 0 | アクセシビリティ無回帰（AC-9） |
| `role="alert"` | SchemaAlertCard SA-4 | alert ロール維持 | 警告セマンティクスの維持 |
| empty `role="status"` | RecentActionsTable RAT-01 / StatusDistribution SD-01 | placeholder の status ロール維持 | 空状態セマンティクスの維持 |

## negative assert（技術語・テーブル・uppercase の不在）設計

| negative 観点 | spec / ケース | assert | 検出する回帰 |
| --- | --- | --- | --- |
| テーブルが使われていない | RecentActionsTable RAT-03 | `container.querySelector("table")` / `"tbody"` が `null` | 4 列 table の復活 |
| uppercase クラスが無い | KpiGrid KG-3 | `querySelector('[class*="uppercase"]')` が `null` | KpiCard の `uppercase` 装飾の残存 |
| 英語（Total members 等）不在 | KpiGrid KG-2 | `textContent` に `Total members` 等不在 / `/members/i` 不在 | KPI 英語ラベルの再混入 |
| 技術語 DISTRIBUTION 不在 | ZoneDistribution ZD-5 | `textContent` に `DISTRIBUTION` 不在 | 英語大文字 eyebrow の残存 |
| 技術語 スキーマ/alias/schema 不在 | SchemaAlertCard SA-2 | `textContent` に `スキーマ` / `/alias/i` / `/schema/i` 不在 | 技術用語の再混入 |
| 600px 固定 SVG 不在 | StatusDistribution SD-05 | `innerHTML` に `0 0 600 200` 不在 | 縦棒 SVG の復活 |
| raw action code 不在（可視） | RecentActionsTable RAT-04（補強） | `textContent` に `admin.member.status_updated` 不在 | glossary 変換漏れ |

> negative assert は「正しく日本語化/カード化されていれば必ず不在になる文字列・class・属性」を対象にする。`textContent` ベースは href（`/admin/schema`）など URL を拾わないため、文言からの技術語排除と導線 URL 維持が両立する。

## focused 実行コマンド

```bash
# worktree 直後は依存・esbuild 整合を先に確認
mise exec -- pnpm install
mise exec -- pnpm verify:vitest-runtime

# 本タスクの 7 spec をまとめて focused run
mise exec -- pnpm exec vitest run \
  --root=. --config=vitest.config.ts \
  apps/web/src/lib/admin/__tests__/dashboardGlossary.spec.ts \
  apps/web/src/features/admin/components/__tests__/KpiGrid.spec.tsx \
  apps/web/src/features/admin/components/_dashboard/__tests__/SchemaAlertCard.spec.tsx \
  apps/web/src/features/admin/components/_dashboard/__tests__/ZoneDistribution.spec.tsx \
  apps/web/src/features/admin/components/_dashboard/StatusDistribution.spec.tsx \
  apps/web/src/features/admin/components/__tests__/RecentActionsTable.spec.tsx \
  apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx

# ディレクトリ単位（_dashboard 一括 + RecentActionsTable + AuditLogPanel）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/components/_dashboard \
  apps/web/src/features/admin/components/__tests__/RecentActionsTable.spec.tsx \
  apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx \
  apps/web/src/lib/admin/__tests__/dashboardGlossary.spec.ts
```

> 本リポジトリの vitest 設定はルート `vitest.config.ts` に集約されている。`include` glob（`apps/**/src/**/__tests__/**/*.spec.{ts,tsx}` および同階層 `*.spec.{ts,tsx}`）で対象 spec が収集される。
> Vitest / esbuild runtime トラブル時は `pnpm verify:vitest-runtime` を実行し、`docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/runbook.md` を参照する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 要件・AC | `docs/30-workflows/completed-tasks/admin-dashboard-jp-clarity-and-card-ux/phase-1-requirements.md` | AC-1..AC-10・glossary 対象コード一覧 |
| 設計正本 | `docs/30-workflows/completed-tasks/admin-dashboard-jp-clarity-and-card-ux/phase-2-design.md` | glossary 完全コード・C1-C4 Before/After・新 DOM 構造 |
| 設計レビュー | `docs/30-workflows/completed-tasks/admin-dashboard-jp-clarity-and-card-ux/phase-3-design-review.md` | testid 変更リスクと spec 更新方針 |
| 既存 spec（更新） | `apps/web/src/features/admin/components/_dashboard/StatusDistribution.spec.tsx` | aria-label / HEX 契約の更新先 |
| 既存 spec（更新） | `apps/web/src/features/admin/components/__tests__/RecentActionsTable.spec.tsx` | テーブル → カードリストの更新先 |
| 既存 spec（更新） | `apps/web/src/features/admin/components/_dashboard/__tests__/ZoneDistribution.spec.tsx` | eyebrow ZD-5 追記先・HEX 禁止の先例 |
| カバレッジ基準 | `.claude/skills/task-specification-creator/references/coverage-standards.md` | 80% 閾値・個別計測（Phase 7 連携） |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| design-tokens | `.claude/skills/aiworkflow-requirements/references/design-tokens.md` | OKLch トークン正本・HEX 禁止不変条件 |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | admin ナビ / 画面構成の正本 |

## 完了条件

- [ ] `dashboardGlossary.spec.ts` が新規作成され、GL-1..7（KPI/STATUS ラベル一致・accessor 既知一致・fallback raw 保持・targetId 両分岐）が実装されている。
- [x] `KpiGrid.spec.tsx` が既存 spec 更新として、KG-1..4（日本語 4 ラベル・英語不在・uppercase 不在・testid 4 枚）を実装している。
- [ ] `SchemaAlertCard.spec.tsx` が新規作成され、SA-1..4（平易日本語・技術語不在・`/admin/schema` リンク・`role="alert"`）が実装されている。
- [ ] `ZoneDistribution.spec.tsx` に ZD-5（`会員分布` 描画・`DISTRIBUTION` 不在）が追記され、既存 4 ケースが不変である。
- [ ] `StatusDistribution.spec.tsx` が SD-01..08 へ更新され、aria-label「公開ステータス分布: …」維持・`status-distribution-list` 移行・600px SVG 不在・HEX 禁止維持が固定されている。
- [ ] `RecentActionsTable.spec.tsx` が RAT-01..06 へ更新され、カードリスト化・`<table>` 不在・glossary 日本語化・truncate・`/admin/audit` リンク・axe 0 が固定されている。
- [ ] negative assert（テーブル不在 / uppercase 不在 / 英語・技術語不在 / 600px SVG 不在）が各 spec に設計されている。
- [ ] AC-1..AC-10 と各テストの trace matrix が確定している。
- [ ] すべて `*.spec.ts(x)` 命名（不変条件 #8）で co-location 配置されている。
- [x] focused vitest（7 spec）が全 PASS で Phase 4 の Red が解消されている（実測: 7 files / 77 tests）。
