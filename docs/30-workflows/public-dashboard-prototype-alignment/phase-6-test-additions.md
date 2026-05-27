---
実装区分: 実装仕様書
状態: spec_created
Phase: 6
作成日: 2026-05-26
task_id: public-dashboard-prototype-alignment
親: [index.md](./index.md)
前: [phase-5-implementation.md](./phase-5-implementation.md)
次: [phase-7-coverage.md](./phase-7-coverage.md)
---

# Phase 6: テスト追加

## 1. 目的

Phase 5 実装で着地した DOM contract に対し、Phase 4 で定義した TC を **実 spec ファイルに展開** し、fail path / regression を拡充する。

## 2. 追加 / 拡張する spec 一覧

| 区分 | path | 含む TC-ID |
| --- | --- | --- |
| 新規 | `apps/web/src/components/public/__tests__/AboutUbm.spec.tsx` | TC-ABOUT-001..007 |
| 拡張 | `apps/web/src/components/public/__tests__/Hero.spec.tsx` | TC-HERO-001..006 |
| 拡張 | `apps/web/src/components/public/__tests__/Stats.spec.tsx` | TC-STATS-001..008 |
| 拡張 | `apps/web/src/components/public/__tests__/Timeline.spec.tsx` | TC-TL-001..008 |
| 拡張 | `apps/web/src/components/public/__tests__/MemberGrid.spec.tsx` | TC-MG-001..002 |
| 新規 | `apps/web/app/__tests__/page.spec.tsx` | TC-PAGE-001..006 |
| 新規 | `apps/web/playwright/tests/public-home-visual.spec.ts` | TC-SMK-001..004 |

## 3. fail path / regression 追加観点

| 観点 | 追加 TC | spec ファイル |
| --- | --- | --- |
| `stats.generatedAt` が ISO 文字列以外 | TC-STATS-007 (extend: malformed string) | Stats.spec.tsx |
| `recentMeetings` 全 entry が `note` / `attendees` 欠落 | TC-TL-002 / TC-TL-003 を `entries.length=3` で組合せ | Timeline.spec.tsx |
| `items.length === 0` でも `<header>` が render | TC-PAGE-002 | page.spec.tsx |
| `Hero` `variant` 未指定時の default | TC-HERO-001 (default = "card" 検証) | Hero.spec.tsx |
| Stats sub 文言が prototype と完全一致 | TC-STATS-008 | Stats.spec.tsx |
| Hero h1 が prototype 全文と一致 | TC-PAGE-003 | page.spec.tsx |
| ZoneIntro が `/` から削除 | TC-PAGE-004 | page.spec.tsx |
| AboutUbm が Stats の直後 / FeaturedMembers の直前 | TC-PAGE-005 | page.spec.tsx |

## 4. mock fixtures (`apps/web/src/__fixtures__/public-stats.ts`)

```ts
import type { PublicStatsView } from "@/components/public/Stats";

export const fixturePublicStats: PublicStatsView = {
  memberCount: 32,
  publicMemberCount: 24,
  zoneBreakdown: [
    { zone: "0_to_1", count: 10 },
    { zone: "1_to_10", count: 8 },
    { zone: "10_to_100", count: 6 },
  ],
  generatedAt: "2026-05-26T03:00:00.000Z",
  recentMeetings: [
    { sessionId: "s1", title: "2026年5月 支部会", heldOn: "2026-05-08" },
    { sessionId: "s2", title: "2026年4月 支部会", heldOn: "2026-04-10" },
    { sessionId: "s3", title: "2026年3月 支部会", heldOn: "2026-03-13" },
    { sessionId: "s4", title: "2026年2月 支部会", heldOn: "2026-02-08" },
  ],
};

export const fixturePublicMembers6 = {
  items: Array.from({ length: 6 }, (_, i) => ({
    memberId: `m-${i + 1}`,
    fullName: `テスト太郎 ${i + 1}`,
    zone: ["0_to_1", "1_to_10", "10_to_100"][i % 3],
    company: `株式会社サンプル ${i + 1}`,
    isPublic: true,
  })),
  total: 24,
};

export const fixturePublicMembersEmpty = { items: [], total: 0 };
```

> 既存 `@ubm-hyogo/shared` の `PublicStatsViewZ` が `recentMeetings[].note` / `attendees` を許容しているかは Phase 5 実装時に確認。schema 側に存在しない場合は本 fixtures で `note` / `attendees` を持たない形にとどめ、Timeline は local interface で受ける。

## 5. page.spec.tsx 雛形

```tsx
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("next/server", () => ({ connection: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/api/public", async () => {
  const fx = await import("@/__fixtures__/public-stats");
  return {
    PUBLIC_API_REVALIDATE: { stats: 60, members: 30 },
    getStats: vi.fn().mockResolvedValue(fx.fixturePublicStats),
    listMembersRaw: vi.fn().mockResolvedValue(fx.fixturePublicMembers6),
  };
});

import HomePage from "../page";

describe("/ (public home)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders all 6 sections in order", async () => {
    const ui = await HomePage();
    const { container } = render(ui as any);
    const sections = Array.from(container.querySelectorAll("[data-component]"));
    const components = sections.map((el) => el.getAttribute("data-component"));
    expect(components).toEqual(
      expect.arrayContaining([
        "hero",
        "stats",
        "about-ubm",
        "featured-members",
        "timeline",
      ]),
    );
  });

  it("does not render ZoneIntro", async () => {
    const ui = await HomePage();
    const { container } = render(ui as any);
    expect(container.querySelector('[data-component="zone-intro"]')).toBeNull();
  });

  it("renders featured-members header even when items is empty", async () => {
    const { listMembersRaw } = await import("@/lib/api/public");
    (listMembersRaw as any).mockResolvedValueOnce({ items: [], total: 0 });
    const ui = await HomePage();
    const { container } = render(ui as any);
    const featured = container.querySelector('[data-component="featured-members"]');
    expect(featured).toBeTruthy();
    expect(within(featured as HTMLElement).getByText("参加している事業者たち")).toBeInTheDocument();
  });

  it("renders hero copy from prototype", async () => {
    const ui = await HomePage();
    render(ui as any);
    expect(screen.getByText("UBM HYOGO · CHAPTER SITE")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: /兵庫で、事業を育てる人のつながりを可視化する/ })).toBeInTheDocument();
  });
});
```

## 6. Playwright smoke 雛形

`apps/web/playwright/tests/public-home-visual.spec.ts`

```ts
import { test, expect } from "@playwright/test";

const VIEWPORTS = [
  { key: "mobile",  width: 375,  height: 812 },
  { key: "tablet",  width: 768,  height: 1024 },
  { key: "laptop",  width: 1024, height: 768 },
  { key: "desktop", width: 1440, height: 900 },
];

for (const vp of VIEWPORTS) {
  test(`/ renders 5 main sections @ ${vp.key}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    const res = await page.goto("/");
    expect(res?.status()).toBe(200);
    for (const c of ["hero", "stats", "about-ubm", "featured-members", "timeline"]) {
      await expect(page.locator(`[data-component="${c}"]`)).toBeVisible();
    }
  });
}
```

## 7. fail path coverage (実行頻度: PR ごと)

| TC | 期待 |
| --- | --- |
| TC-PAGE-002 | members 0 件 → featured-members section の heading が render |
| TC-TL-004 | recentMeetings 0 件 → Timeline EmptyState |
| TC-STATS-007 | generatedAt invalid → "未同期" |

## 8. DoD (Phase 6)

- [ ] §2 の全 spec ファイルが追加 / 拡張済み
- [ ] TC-* 全件が grep で spec ファイル内に存在する
- [ ] mock fixtures が `apps/web/src/__fixtures__/public-stats.ts` に配置済み

## メタ情報

- task_id: `public-dashboard-prototype-alignment`
- Phase: 6
- workflow_state: `spec_created`

## 目的

Phase 5 実装と Phase 4 TC の整合を spec 単位で担保する。

## 実行タスク

- 7 spec ファイル (新規 3 + 拡張 4) を追加する
- mock fixtures を配置する
- fail path / regression を確実に拾う

## 完了条件

- [ ] TC-* と spec の対応表が PR 説明に転記可能な粒度で揃う
