---
実装区分: 実装仕様書
状態: spec_created
Phase: 5
作成日: 2026-05-26
task_id: public-dashboard-prototype-alignment
親: [index.md](./index.md)
前: [phase-4-test-plan.md](./phase-4-test-plan.md)
次: [phase-6-test-additions.md](./phase-6-test-additions.md)
---

# Phase 5: 実装手順

## 0. 適用範囲

本 Phase は、Phase 2 の設計に従い `apps/web` 配下の公開トップ領域に以下を導入する手順を定義する。

- 新規 component `apps/web/src/components/public/AboutUbm.tsx`
- 既存 5 component (`Hero` / `Stats` / `Timeline` / `MemberGrid` 周辺) の改修
- `apps/web/app/page.tsx` の section 配線改修
- `apps/web/src/styles/legacy-public.css` への style 追加

副作用 (DB / 外部 API / Cloudflare resource) は一切伴わない。

## 1. 実装順序 (6 Lane)

| Lane | 概要 | 完了条件 |
| --- | --- | --- |
| **L-A** | `AboutUbm.tsx` + spec | TC-ABOUT-001..007 PASS |
| **L-B** | `Hero.tsx` 改修 + spec 拡張 | TC-HERO-001..006 PASS |
| **L-C** | `Stats.tsx` 改修 + spec 拡張 | TC-STATS-001..008 PASS |
| **L-D** | `Timeline.tsx` 改修 + spec 拡張 | TC-TL-001..008 PASS |
| **L-E** | `legacy-public.css` 追加 | `verify-design-tokens` PASS |
| **L-F** | `app/page.tsx` 配線 + `page.spec.tsx` + Playwright smoke | TC-PAGE-001..006 / TC-SMK-001..004 PASS |

L-A〜D は **並列実行可** (component 単位で独立)。L-E は L-A〜D の DOM 確定後。L-F は L-A〜E 完了後。

## 2. Lane A: `AboutUbm.tsx` 実装

`apps/web/src/components/public/AboutUbm.tsx`

```tsx
import type { ReactNode } from "react";

export interface AboutUbmProps {
  aboutCopy?: ReactNode;
  showZones?: boolean;
}

interface ZoneRow {
  zone: "0_to_1" | "1_to_10" | "10_to_100";
  chip: string;
  label: string;
  desc: string;
}

const ZONE_ROWS: ZoneRow[] = [
  { zone: "0_to_1", chip: "0→1", label: "立ち上げフェーズ", desc: "着想と初期検証" },
  { zone: "1_to_10", chip: "1→10", label: "拡大フェーズ", desc: "仕組み化と再現性" },
  { zone: "10_to_100", chip: "10→100", label: "組織化フェーズ", desc: "組織と事業の複線化" },
];

export function AboutUbm({ aboutCopy, showZones = true }: AboutUbmProps = {}) {
  return (
    <section data-component="about-ubm" data-role="grid-2">
      <article data-role="about-card">
        <p data-role="eyebrow">ABOUT</p>
        <h2 data-role="section-heading">事業支援コミュニティ「UBM」</h2>
        {aboutCopy ?? (
          <>
            <p data-role="copy">
              UBM（Unlimited Business Members）は、事業フェーズに応じた3つの区画——
              <b>0→1</b>（立ち上げ）・<b>1→10</b>（拡大）・<b>10→100</b>（組織化）——
              に分かれて、メンバー同士が学び合うコミュニティです。
            </p>
            <p data-role="copy">
              兵庫支部会は、地域に根ざした事業者が月一で集まる場。
              本サイトでは、その「どんな人がいるのか」を可視化しています。
            </p>
          </>
        )}
      </article>
      {showZones ? (
        <article data-role="zones-card">
          <p data-role="eyebrow">THREE ZONES</p>
          <h2 data-role="section-heading">UBM区画</h2>
          <ul data-role="zone-rows">
            {ZONE_ROWS.map((z) => (
              <li key={z.zone} data-zone={z.zone} data-role="zone-row">
                <span data-role="chip">{z.chip}</span>
                <span data-role="label">{z.label}</span>
                <span data-role="desc">{z.desc}</span>
              </li>
            ))}
          </ul>
        </article>
      ) : null}
    </section>
  );
}
```

実装方針:
- 全 zone-row の chip 色は `legacy-public.css` 側で `[data-zone="0_to_1"] [data-role="chip"]` 等の selector で OKLch token を適用 (`var(--ubm-color-zone-{a,b,c})`)。
- `aboutCopy` slot は default 文言の override 用。slot 未指定時は default を render。

## 3. Lane B: `Hero.tsx` 改修

`apps/web/src/components/public/Hero.tsx`

```tsx
export interface HeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  variant?: "card" | "panel";
}

export function Hero({
  eyebrow,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  variant = "card",
}: HeroProps) {
  return (
    <section data-component="hero" data-variant={variant}>
      {variant === "card" ? (
        <div data-role="accent" aria-hidden="true" />
      ) : null}
      <div data-role="body">
        {eyebrow ? <p data-role="eyebrow">{eyebrow}</p> : null}
        <h1 data-role={variant === "card" ? "title-serif" : undefined}>{title}</h1>
        {subtitle ? <p data-role="subtitle">{subtitle}</p> : null}
        <div data-role="cta">
          {primaryCta ? (
            <a href={primaryCta.href} data-variant="primary">{primaryCta.label}</a>
          ) : null}
          {secondaryCta ? (
            <a href={secondaryCta.href} data-variant="secondary">{secondaryCta.label}</a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
```

実装方針:
- `variant` default は `"card"` (新)。既存 `panel` を呼び出す場所が無いか grep で確認 (`apps/web/app/page.tsx` 以外は呼び出し無しを期待)。
- HEX 禁止。`style={{ backgroundImage: "linear-gradient(...)" }}` の inline style は撤去し、CSS 側 `[data-component="hero"][data-variant="card"]` で OKLch token 経由に置換。

## 4. Lane C: `Stats.tsx` 改修

`apps/web/src/components/public/Stats.tsx`

```tsx
import type { z } from "zod";
import { PublicStatsViewZ } from "@ubm-hyogo/shared";

export type PublicStatsView = z.infer<typeof PublicStatsViewZ>;

export interface StatsProps {
  stats: PublicStatsView;
}

const MEETINGS_PER_YEAR = 12; // CONST: 月次定例 × 12
const ACTIVE_ZONE_COUNT = 3;  // CONST: 0→1 / 1→10 / 10→100

function lastSyncLabel(stats: PublicStatsView): string {
  const ts = stats.generatedAt;
  if (!ts) return "未同期";
  try {
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return "未同期";
    return d.toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });
  } catch {
    return "未同期";
  }
}

export function Stats({ stats }: StatsProps) {
  return (
    <section data-component="stats" aria-labelledby="stats-heading">
      <h2 id="stats-heading" className="sr-only">サポート指標</h2>
      <ul data-role="stat-grid">
        <li data-stat="members">
          <span data-role="label">Members</span>
          <span data-role="value">{stats.publicMemberCount}</span>
          <span data-role="sub">公開中のメンバー</span>
        </li>
        <li data-stat="zones">
          <span data-role="label">Zones</span>
          <span data-role="value">{ACTIVE_ZONE_COUNT}</span>
          <span data-role="sub">0→1 / 1→10 / 10→100</span>
        </li>
        <li data-stat="meetings">
          <span data-role="label">Meetings / yr</span>
          <span data-role="value">{MEETINGS_PER_YEAR}</span>
          <span data-role="sub">毎月の支部会</span>
        </li>
        <li data-stat="sync">
          <span data-role="label">Last sync</span>
          <span data-role="value">{lastSyncLabel(stats)}</span>
          <span data-role="sub">
            <span data-role="badge-sync">
              <span data-role="dot" aria-hidden="true" />Forms 同期中
            </span>
          </span>
        </li>
      </ul>
    </section>
  );
}
```

実装方針:
- `MEETINGS_PER_YEAR=12` / `ACTIVE_ZONE_COUNT=3` は同ファイル内 const。`apps/web/src/lib/constants/landing.ts` 新設は今回は採用しない (1 component 内に閉じ、可読性優先)。
- 旧 `data-stat="total"` / `data-stat="public"` を `data-stat="members"` に統合 (`memberCount` から `publicMemberCount` のみへ)。

## 5. Lane D: `Timeline.tsx` 改修

`apps/web/src/components/public/Timeline.tsx`

```tsx
import { EmptyState } from "../feedback/EmptyState";

export interface TimelineEntry {
  sessionId: string;
  title: string;
  heldOn: string; // ISO date "YYYY-MM-DD" or full ISO
  note?: string;
  attendees?: number;
}

export interface TimelineProps {
  entries: TimelineEntry[];
  cadenceLabel?: string;
}

export function yyyyMm(iso: string): string {
  return iso.slice(0, 7);
}

export function dd(iso: string): string {
  return iso.slice(8, 10);
}

export function Timeline({ entries, cadenceLabel = "毎月第2木曜開催" }: TimelineProps) {
  return (
    <section data-component="timeline">
      <header data-role="header">
        <div>
          <p data-role="eyebrow">RECENT MEETINGS</p>
          <h2 data-role="section-heading">最近の支部会</h2>
        </div>
        <span data-role="chip-cadence">
          <span data-role="dot" aria-hidden="true" />{cadenceLabel}
        </span>
      </header>
      {entries.length === 0 ? (
        <EmptyState
          title="まだ支部会の記録がありません"
          description="開催後に最新の支部会情報を掲載します。"
        />
      ) : (
        <ol data-role="tl-rows">
          {entries.map((e) => (
            <li key={e.sessionId} data-role="tl-row">
              <div data-role="tl-date">
                <span data-role="tl-y">{yyyyMm(e.heldOn)}</span>
                <span data-role="tl-d">{dd(e.heldOn)}</span>
              </div>
              <div data-role="tl-body">
                <p data-role="tl-label">{e.title}</p>
                {e.note ? <p data-role="tl-note">{e.note}</p> : null}
              </div>
              {typeof e.attendees === "number" ? (
                <p data-role="tl-attendees">{e.attendees}名参加</p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
```

実装方針:
- `note` / `attendees` は optional。API response (`stats.recentMeetings[]`) に存在しない場合は型 (`@ubm-hyogo/shared`) を変更せず、`TimelineEntry` を **local interface** として定義し、`app/page.tsx` 側で `entries` をマップする際に existing field のみ pass し note/attendees は undefined (= shape ミスマッチ無し)。
- `yyyyMm` / `dd` は test 用に export (TC-TL-007/008)。

## 6. Lane E: `legacy-public.css` 追加

`apps/web/src/styles/legacy-public.css` の末尾に以下を append:

```css
/* ===== public-dashboard-prototype-alignment ===== */

/* Hero (card variant) */
[data-component="hero"][data-variant="card"] {
  position: relative;
  overflow: hidden;
  background: var(--ubm-color-panel);
  border-radius: 28px;
  padding: 56px 48px;
}
[data-component="hero"][data-variant="card"] [data-role="accent"] {
  position: absolute;
  top: -40px;
  right: -40px;
  width: 320px;
  height: 320px;
  pointer-events: none;
  background: radial-gradient(
    circle,
    color-mix(in oklch, var(--ubm-color-accent) 14%, transparent),
    transparent 70%
  );
}
[data-component="hero"][data-variant="card"] [data-role="body"] {
  position: relative;
  max-width: 720px;
}
[data-component="hero"][data-variant="card"] [data-role="title-serif"] {
  font-family: var(--ubm-font-serif, ui-serif, Georgia, serif);
  font-size: 54px;
  line-height: 1.1;
  letter-spacing: -0.03em;
  font-weight: 600;
  margin: 0;
}

/* Stats sub line */
[data-component="stats"] [data-role="stat-grid"] {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--ubm-spacing-grid, 16px);
}
@media (max-width: 1024px) {
  [data-component="stats"] [data-role="stat-grid"] { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  [data-component="stats"] [data-role="stat-grid"] { grid-template-columns: 1fr; }
}
[data-component="stats"] [data-role="sub"] {
  display: block;
  font-size: 13px;
  margin-top: 4px;
  color: var(--ubm-color-text-muted, currentColor);
}
[data-role="badge-sync"] {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border-radius: 999px;
  background: color-mix(in oklch, var(--ubm-color-accent) 12%, transparent);
  color: var(--ubm-color-accent);
}
[data-role="badge-sync"] [data-role="dot"] {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--ubm-color-accent);
}

/* About */
[data-component="about-ubm"][data-role="grid-2"] {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--ubm-spacing-section, 24px);
}
@media (max-width: 768px) {
  [data-component="about-ubm"][data-role="grid-2"] { grid-template-columns: 1fr; }
}
[data-component="about-ubm"] [data-role="zone-row"] {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid var(--ubm-color-border, currentColor);
}
[data-component="about-ubm"] [data-role="chip"] {
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}
[data-component="about-ubm"] [data-zone="0_to_1"] [data-role="chip"]   { background: var(--ubm-color-zone-a); color: var(--ubm-color-panel); }
[data-component="about-ubm"] [data-zone="1_to_10"] [data-role="chip"]  { background: var(--ubm-color-zone-b); color: var(--ubm-color-panel); }
[data-component="about-ubm"] [data-zone="10_to_100"] [data-role="chip"]{ background: var(--ubm-color-zone-c); color: var(--ubm-color-panel); }

/* Featured */
[data-component="featured-members"] [data-role="header"] {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 16px;
}
[data-component="featured-members"] [data-role="cta-link"] {
  font-size: 14px;
  color: var(--ubm-color-accent);
}

/* Timeline tl-row */
[data-component="timeline"] [data-role="header"] {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 16px;
}
[data-component="timeline"] [data-role="chip-cadence"] {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  border-radius: 999px;
  background: color-mix(in oklch, var(--ubm-color-accent) 12%, transparent);
  color: var(--ubm-color-accent);
  font-size: 12px;
}
[data-component="timeline"] [data-role="tl-rows"] { list-style: none; padding: 0; margin: 0; }
[data-component="timeline"] [data-role="tl-row"] {
  display: grid;
  grid-template-columns: 96px 1fr auto;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid var(--ubm-color-border, currentColor);
}
```

実装方針:
- token 不存在の保険として fallback (`var(--x, defaultValue)`) を併用。`tokens.css` 側に未定義 token があれば Phase 9 で追加。
- HEX 直書きは 0 件。すべて OKLch token + `color-mix(in oklch, ...)`。

## 7. Lane F: `app/page.tsx` 配線

`apps/web/app/page.tsx`

```tsx
import type { Metadata } from "next";
import { connection } from "next/server";

import { buildPageMetadata } from "@/lib/seo/site-metadata";

import { AboutUbm } from "../src/components/public/AboutUbm";
import { CallToActionCTA } from "../src/components/public/CallToActionCTA";
import { EmptyState } from "../src/components/feedback/EmptyState";
import { Hero } from "../src/components/public/Hero";
import { MemberGrid } from "../src/components/public/MemberGrid";
import { PublicFooter } from "../src/components/public/PublicFooter";
import { PublicHeader } from "../src/components/public/PublicHeader";
import { Stats } from "../src/components/public/Stats";
import { Timeline } from "../src/components/public/Timeline";
import {
  PUBLIC_API_REVALIDATE,
  getStats,
  listMembersRaw,
} from "../src/lib/api/public";
import { FORM_RESPONDER_URL } from "../src/lib/constants/form";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "ホーム",
    description: "UBM 兵庫支部会の活動紹介、メンバーディレクトリ、参加案内",
    path: "/",
  });
}

export default async function HomePage() {
  await connection();
  const [stats, members] = await Promise.all([
    getStats({ revalidate: PUBLIC_API_REVALIDATE.stats }),
    listMembersRaw("limit=6&sort=recent", { revalidate: PUBLIC_API_REVALIDATE.members }),
  ]);

  // Timeline entries: API shape を local TimelineEntry にマップ (note/attendees は undefined のまま)
  const timelineEntries = stats.recentMeetings.map((m) => ({
    sessionId: m.sessionId,
    title: m.title,
    heldOn: m.heldOn,
    // note/attendees は API に無いため未設定 (graceful fallback)
  }));

  return (
    <>
      <PublicHeader />
      <main data-page="home" data-route="public" data-section-rhythm="comfortable">
        <Hero
          variant="card"
          eyebrow="UBM HYOGO · CHAPTER SITE"
          title="兵庫で、事業を育てる人のつながりを可視化する。"
          subtitle="UBM兵庫支部会メンバーサイトは、Googleフォームから集めた支部会メンバーの自己紹介情報を、公開情報と会員限定情報に分けて整理・公開するサイトです。"
          primaryCta={{ label: "メンバー一覧を見る", href: "/members" }}
          secondaryCta={{ label: "会員ログイン", href: "/login" }}
        />
        <Stats stats={stats} />
        <AboutUbm />
        <section data-component="featured-members">
          <header data-role="header">
            <div>
              <p data-role="eyebrow">FEATURED MEMBERS</p>
              <h2 data-role="section-heading">参加している事業者たち</h2>
            </div>
            <a href="/members" data-role="cta-link">全員見る →</a>
          </header>
          {members.items.length > 0 ? (
            <MemberGrid items={members.items} density="comfy" />
          ) : (
            <EmptyState
              title="まだ公開メンバーがいません"
              description="Google Form 回答後、自動で反映されます。"
            />
          )}
        </section>
        <Timeline entries={timelineEntries} />
        <CallToActionCTA responderUrl={FORM_RESPONDER_URL} />
      </main>
      <PublicFooter />
    </>
  );
}
```

実装方針:
- `ZoneIntro` import は削除する。`apps/web/src/components/public/ZoneIntro.tsx` ファイル自体は残す。
- `timelineEntries` 変換で `note` / `attendees` を omit。

## 8. spec 雛形 (`AboutUbm.spec.tsx`)

`apps/web/src/components/public/__tests__/AboutUbm.spec.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AboutUbm } from "../AboutUbm";

describe("AboutUbm", () => {
  it("renders about-ubm root with grid-2 role", () => {
    const { container } = render(<AboutUbm />);
    expect(container.querySelector('[data-component="about-ubm"][data-role="grid-2"]')).toBeTruthy();
  });

  it("renders ABOUT eyebrow and section heading", () => {
    render(<AboutUbm />);
    expect(screen.getByText("ABOUT")).toBeInTheDocument();
    expect(screen.getByText("事業支援コミュニティ「UBM」")).toBeInTheDocument();
  });

  it("renders THREE ZONES with 3 rows", () => {
    const { container } = render(<AboutUbm />);
    expect(container.querySelectorAll('[data-role="zone-row"]').length).toBe(3);
    expect(container.querySelector('[data-zone="0_to_1"]')).toBeTruthy();
    expect(container.querySelector('[data-zone="1_to_10"]')).toBeTruthy();
    expect(container.querySelector('[data-zone="10_to_100"]')).toBeTruthy();
  });

  it("hides zones when showZones=false", () => {
    const { container } = render(<AboutUbm showZones={false} />);
    expect(container.querySelector('[data-role="zones-card"]')).toBeNull();
  });

  it("overrides about copy when aboutCopy is provided", () => {
    render(<AboutUbm aboutCopy={<p>カスタム説明</p>} />);
    expect(screen.getByText("カスタム説明")).toBeInTheDocument();
  });
});
```

その他 spec (`Hero.spec.tsx`, `Stats.spec.tsx`, `Timeline.spec.tsx`, `MemberGrid.spec.tsx`, `app/__tests__/page.spec.tsx`) は Phase 6 で TC 表に基づき拡張する。

## 9. Files to change (overview)

| 区分 | path |
| --- | --- |
| 新規 | `apps/web/src/components/public/AboutUbm.tsx` |
| 新規 | `apps/web/src/components/public/__tests__/AboutUbm.spec.tsx` |
| 新規 | `apps/web/src/__fixtures__/public-stats.ts` (mock fixtures) |
| 新規 | `apps/web/app/__tests__/page.spec.tsx` |
| 新規 | `apps/web/playwright/tests/public-home-visual.spec.ts` |
| 修正 | `apps/web/app/page.tsx` |
| 修正 | `apps/web/src/components/public/Hero.tsx` |
| 修正 | `apps/web/src/components/public/Stats.tsx` |
| 修正 | `apps/web/src/components/public/Timeline.tsx` |
| 修正 | `apps/web/src/components/public/__tests__/Hero.spec.tsx` (拡張) |
| 修正 | `apps/web/src/components/public/__tests__/Stats.spec.tsx` (拡張) |
| 修正 | `apps/web/src/components/public/__tests__/Timeline.spec.tsx` (拡張) |
| 修正 | `apps/web/src/components/public/__tests__/MemberGrid.spec.tsx` (拡張) |
| 修正 | `apps/web/src/styles/legacy-public.css` (append) |

## 10. DoD (Phase 5)

- [ ] L-A〜F の実装が完了し、TC-* 表が全 PASS
- [ ] HEX 直書き 0 件 (`grep -RE "#[0-9a-fA-F]{3,6}\b" apps/web/src/components/public apps/web/src/styles/legacy-public.css`)
- [ ] `pnpm --filter @ubm-hyogo/web exec vitest run apps/web/src/components/public/__tests__/ apps/web/app/__tests__/page.spec.tsx` PASS
- [ ] `pnpm typecheck` / `pnpm lint` PASS

## メタ情報

- task_id: `public-dashboard-prototype-alignment`
- Phase: 5
- workflow_state: `spec_created`

## 目的

Phase 2 設計を実コードへ落とし込み、Phase 4 で定義した TC を満たす実装手順を提示する。

## 実行タスク

- L-A〜F の 6 Lane を順序通り実装する
- HEX 直書き / API 拡張 / D1 直アクセスを発生させない

## 参照資料

- `phase-2-design.md`
- `phase-4-test-plan.md`
- `docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx` L4-152

## 完了条件

- [ ] §9 Files to change の全ファイルが実装または更新される
- [ ] HEX 直書きなし
- [ ] vitest / typecheck / lint 全 PASS
