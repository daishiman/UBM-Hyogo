---
spec_classification: implementation_spec
state: spec_created
phase: 2
phase_name: 設計
created_at: 2026-05-26
task_type: UI task
visual_category: VISUAL
implementation_mode: verify_existing
workflow: docs/30-workflows/public-dashboard-prototype-alignment/
depends_on: phase-1-requirements.md
---

# Phase 2: 設計

Phase 1 で固定した 6 GAP × 7 component (Hero / Stats / AboutUbm / ZoneIntro / MemberGrid wrapper / Timeline / page.tsx) の責務を、TypeScript インターフェース・data fallback・CSS layout まで落とし込む。

---

## 1. アーキテクチャ概要

### 1.1 server / client 境界

```
app/page.tsx                         [server]  fetch + section 配線
  └─ Hero                            [server]  pure presentation
  └─ Stats                           [server]  pure presentation (stat 4 枚)
  └─ AboutUbm                        [server]  pure presentation (2-card grid)
  └─ FeaturedMembersSection (inline) [server]  MemberGrid wrap + heading
        └─ MemberGrid                [server]  既存
  └─ Timeline                        [server]  pure presentation (graceful fallback)
  └─ CallToActionCTA                 [server]  既存
```

すべて server component。client component 化は本タスクでは不要 (sort / filter / drawer の interactive state なし)。

### 1.2 data flow

```
[Cloudflare D1]
   │  Workers binding
   ▼
[apps/api/src/routes/public/{stats,members}]
   │  HTTP JSON
   ▼
[apps/web/src/lib/api/public.ts]
   │  Promise.all in page.tsx
   ▼
[Stats / MemberGrid / Timeline]
```

新規 endpoint は無し。data shape の不足 (note / attendees / meetingsPerYear) は **UI 側 fallback**。

---

## 2. コンポーネント仕様

### 2.1 Hero (改修)

責務: card-on-canvas + radial accent + serif h1 + eyebrow + body + 2 CTA。

```ts
export interface HeroProps {
  /** 上部ラベル (例: "UBM HYOGO · CHAPTER SITE") */
  eyebrow?: string;
  /** 見出し (serif で render) */
  title: string;
  /** body コピー (subtitle より長文を想定) */
  subtitle?: string;
  /** 主要 CTA (例: メンバー一覧を見る) */
  primaryCta?: { label: string; href: string };
  /** 副 CTA (例: 会員ログイン) */
  secondaryCta?: { label: string; href: string };
  /** Hero variant。default: "card" (新)、"panel" は既存互換用 */
  variant?: "card" | "panel";
}

export function Hero(props: HeroProps): JSX.Element;
```

DOM:

```html
<section data-component="hero" data-variant="card">
  <div data-role="accent" aria-hidden="true"></div>
  <div data-role="body">
    <p data-role="eyebrow">UBM HYOGO · CHAPTER SITE</p>
    <h1 data-role="title-serif">兵庫で、事業を育てる人のつながりを可視化する。</h1>
    <p data-role="subtitle">UBM兵庫支部会メンバーサイトは...</p>
    <div data-role="cta">
      <a href="/members" data-variant="primary">メンバー一覧を見る</a>
      <a href="/login" data-variant="secondary">会員ログイン</a>
    </div>
  </div>
</section>
```

style: `legacy-public.css` で `[data-component="hero"][data-variant="card"]` selector を定義。radial accent は `background: radial-gradient(circle, color-mix(in oklch, var(--ubm-color-accent) 14%, transparent), transparent 70%)` (HEX 禁止)。

state ownership: なし (pure)。

### 2.2 Stats (改修)

責務: 4 stat grid。各 stat に `label` / `value` / `sub` 1 行。最終 stat (`sync`) は `sub` 内に `badge-sync` チップを置く。

```ts
export interface StatsProps {
  stats: PublicStatsView; // 既存
}

export function Stats(props: StatsProps): JSX.Element;
```

DOM:

```html
<section data-component="stats" aria-labelledby="stats-heading">
  <h2 id="stats-heading" class="sr-only">サポート指標</h2>
  <ul data-role="stat-grid">
    <li data-stat="members">
      <span data-role="label">Members</span>
      <span data-role="value">{publicMemberCount}</span>
      <span data-role="sub">公開中のメンバー</span>
    </li>
    <li data-stat="zones">
      <span data-role="label">Zones</span>
      <span data-role="value">3</span>
      <span data-role="sub">0→1 / 1→10 / 10→100</span>
    </li>
    <li data-stat="meetings">
      <span data-role="label">Meetings / yr</span>
      <span data-role="value">12</span>
      <span data-role="sub">毎月の支部会</span>
    </li>
    <li data-stat="sync">
      <span data-role="label">Last sync</span>
      <span data-role="value">{lastSyncLabel(stats)}</span>
      <span data-role="sub">
        <span data-role="badge-sync"><span data-role="dot" aria-hidden="true"/>Forms 同期中</span>
      </span>
    </li>
  </ul>
</section>
```

固定値: `Zones=3`, `Meetings/yr=12` は constants として component 内 (or `apps/web/src/lib/constants/landing.ts` 新設) に定義。

variable: `members` value は `stats.publicMemberCount` (プロトタイプ `visibleMembers.length` 相当) を採用。

### 2.3 AboutUbm (新規)

責務: About カード + Three Zones row-list の 2-card grid セクション。

```ts
import type { ReactNode } from "react";

export interface AboutUbmProps {
  /** About カードのコピーを差し替える場合に使う (デフォルトは prototype 文言) */
  aboutCopy?: ReactNode;
  /** Three Zones の表示を制御 (デフォルト true) */
  showZones?: boolean;
}

export function AboutUbm(props?: AboutUbmProps): JSX.Element;
```

DOM:

```html
<section data-component="about-ubm" data-role="grid-2">
  <article data-role="about-card">
    <p data-role="eyebrow">ABOUT</p>
    <h2 data-role="section-heading">事業支援コミュニティ「UBM」</h2>
    <p data-role="copy">
      UBM（Unlimited Business Members）は、事業フェーズに応じた3つの区画——
      <b>0→1</b>（立ち上げ）・<b>1→10</b>（拡大）・<b>10→100</b>（組織化）——
      に分かれて、メンバー同士が学び合うコミュニティです。
    </p>
    <p data-role="copy">
      兵庫支部会は、地域に根ざした事業者が月一で集まる場。
      本サイトでは、その「どんな人がいるのか」を可視化しています。
    </p>
  </article>
  <article data-role="zones-card">
    <p data-role="eyebrow">THREE ZONES</p>
    <h2 data-role="section-heading">UBM区画</h2>
    <ul data-role="zone-rows">
      <li data-zone="0_to_1" data-role="zone-row">
        <span data-role="chip">0→1</span>
        <span data-role="label">立ち上げフェーズ</span>
        <span data-role="desc">着想と初期検証</span>
      </li>
      <li data-zone="1_to_10" data-role="zone-row">
        <span data-role="chip">1→10</span>
        <span data-role="label">拡大フェーズ</span>
        <span data-role="desc">仕組み化と再現性</span>
      </li>
      <li data-zone="10_to_100" data-role="zone-row">
        <span data-role="chip">10→100</span>
        <span data-role="label">組織化フェーズ</span>
        <span data-role="desc">組織と事業の複線化</span>
      </li>
    </ul>
  </article>
</section>
```

style: `[data-component="about-ubm"]` で `display: grid; grid-template-columns: 1fr 1fr; gap: var(--ubm-spacing-section)` (`@media (max-width: 768px)` で 1 列に degrade)。`data-role="chip"` は `background: var(--ubm-color-zone-{a,b,c})` を `data-zone` セレクタで分岐。

state ownership: なし (pure)。

### 2.4 ZoneIntro (改修最小)

責務: 既存単独セクションをそのまま残置 (削除しない)。`apps/web/app/page.tsx` から `<ZoneIntro />` の呼び出しは **削除** し、代わりに `<AboutUbm />` を配線する。`ZoneIntro` 自体は将来再利用 / 別画面用に保持。

> Phase 3 (design review) で「削除」「保持」を最終判定。Phase 1 §9 のリスクとして「将来再利用前提」を採用 → 保持。

### 2.5 MemberGrid + Featured wrapper (`app/page.tsx` 内 inline)

新規 component は作らず、`app/page.tsx` 内に inline で wrapper を実装する。

DOM:

```html
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
```

acceptance: `items.length === 0` でも `<section data-component="featured-members">` と heading は render される (GAP-4 解消)。

### 2.6 Timeline (改修)

責務: eyebrow + h2 + chip + tl-row layout。`note` / `attendees` は graceful fallback。

```ts
export interface TimelineEntry {
  sessionId: string;
  title: string;
  heldOn: string;     // ISO date
  /** プロトタイプの note。API response に無い場合は undefined */
  note?: string;
  /** プロトタイプの attendees。API response に無い場合は undefined */
  attendees?: number;
}

export interface TimelineProps {
  entries: TimelineEntry[];
  /** 開催頻度チップ (default: "毎月第2木曜開催") */
  cadenceLabel?: string;
}

export function Timeline(props: TimelineProps): JSX.Element;
```

DOM:

```html
<section data-component="timeline">
  <header data-role="header">
    <div>
      <p data-role="eyebrow">RECENT MEETINGS</p>
      <h2 data-role="section-heading">最近の支部会</h2>
    </div>
    <span data-role="chip-cadence">
      <span data-role="dot" aria-hidden="true"/>毎月第2木曜開催
    </span>
  </header>
  {entries.length === 0 ? (
    <EmptyState title="まだ支部会の記録がありません" description="開催後に最新の支部会情報を掲載します。" />
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
```

`yyyyMm` / `dd` は同ファイル内 `export function` として export し test 可能化 (Phase 4 §3.7 方針)。

### 2.7 app/page.tsx (改修)

```tsx
import { AboutUbm } from "../src/components/public/AboutUbm";
import { EmptyState } from "../src/components/feedback/EmptyState";
// ZoneIntro import は削除 (component file 自体は残置)

export default async function HomePage() {
  await connection();
  const [stats, members] = await Promise.all([
    getStats({ revalidate: PUBLIC_API_REVALIDATE.stats }),
    listMembersRaw("limit=6&sort=recent", { revalidate: PUBLIC_API_REVALIDATE.members }),
  ]);

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
          {/* ... wrapper (see §2.5) */}
        </section>
        <Timeline entries={stats.recentMeetings} />
        <CallToActionCTA responderUrl={FORM_RESPONDER_URL} />
      </main>
      <PublicFooter />
    </>
  );
}
```

---

## 3. data fallback 戦略

| 項目 | API response | UI 動作 |
| --- | --- | --- |
| `stats.publicMemberCount` | 既存 | `Stats` の `members` value にそのまま採用 |
| `stats.zoneBreakdown.length` | 既存 | 表示しない (プロト固定 3 を採用)。`zoneCount` は内部計算のみ |
| `stats.recentMeetings[].note` | **無い場合あり** | `tl-note` を omit (要素ごと出さない) |
| `stats.recentMeetings[].attendees` | **無い場合あり** | `tl-attendees` を omit |
| `meetingsPerYear` | **無い** | 固定 `12` を constants から (or component 内 literal) 採用 |
| `cadenceLabel` | **無い** | 固定 `毎月第2木曜開催` (`Timeline` の default prop) |
| `stats.generatedAt` | 既存 | 既存 `lastSyncLabel` を維持 (改修不要) |

> API 拡張は **しない**。`TimelineEntry.note` / `attendees` は型 optional 化のみ。schema 側 (`@ubm-hyogo/shared`) は変更しない。`Timeline` 内部の TS 型を local 化 (`apps/web/src/components/public/Timeline.tsx` 内 `export interface TimelineEntry`)。

---

## 4. CSS layout 設計 (`legacy-public.css` 追加分)

| selector | 内容 |
| --- | --- |
| `[data-component="hero"][data-variant="card"]` | `background: var(--ubm-color-panel); border-radius: 28px; padding: 56px 48px; position: relative; overflow: hidden` |
| `[data-component="hero"] [data-role="accent"]` | `position: absolute; top:-40px; right:-40px; width:320px; height:320px; background: radial-gradient(circle, color-mix(in oklch, var(--ubm-color-accent) 14%, transparent), transparent 70%); pointer-events:none` |
| `[data-component="hero"] [data-role="title-serif"]` | `font-family: var(--ubm-font-serif); font-size: 54px; line-height:1.1; letter-spacing:-0.03em; font-weight:600; margin:0` |
| `[data-component="stats"] [data-role="stat-grid"]` | `display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--ubm-spacing-grid)`、`@media (max-width: 1024px)` で 2 列、`@media (max-width: 600px)` で 1 列 |
| `[data-component="stats"] [data-role="sub"]` | `font-size: 13px; color: var(--ubm-color-text-muted); margin-top: 4px` |
| `[data-role="badge-sync"]` | `display:inline-flex; align-items:center; gap:6px; padding:2px 8px; border-radius:999px; background:color-mix(in oklch, var(--ubm-color-accent) 12%, transparent); color: var(--ubm-color-accent)` |
| `[data-component="about-ubm"]` | `display:grid; grid-template-columns: 1fr 1fr; gap: var(--ubm-spacing-section)`、`@media (max-width: 768px)` で `1fr` |
| `[data-component="about-ubm"] [data-role="zone-row"]` | `display:grid; grid-template-columns: 80px 1fr; padding: 10px 0; border-top: 1px solid var(--ubm-color-border)` |
| `[data-component="about-ubm"] [data-role="chip"][data-zone="0_to_1"]` | `background: var(--ubm-color-zone-a)` (他 zone も同様) |
| `[data-component="featured-members"] [data-role="header"]` | `display:flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px` |
| `[data-component="featured-members"] [data-role="cta-link"]` | `font-size: 14px; color: var(--ubm-color-accent)` |
| `[data-component="timeline"] [data-role="tl-row"]` | `display:grid; grid-template-columns: 96px 1fr auto; gap: 16px; padding: 12px 0; border-bottom: 1px solid var(--ubm-color-border)` |
| `[data-component="timeline"] [data-role="chip-cadence"]` | badge-sync と同型 |

> `--ubm-spacing-grid` / `--ubm-spacing-section` / `--ubm-color-border` / `--ubm-font-serif` / `--ubm-color-text-muted` は `tokens.css` の既存トークンを使用。未定義の token があれば `tokens.css` に追加 (既存値の変更は禁止)。

---

## 5. error / loading 境界

本ワークフローでは **error / loading boundary は不変**。既存 `apps/web/app/(public)/error.tsx` / `apps/web/app/(public)/loading.tsx` (`issue-880` workflow で導入済) をそのまま利用。`app/page.tsx` で `fetchAdmin` 相当の try/catch 化は **不要** (`/public/stats` `/public/members` は既に Next.js cache + fetch error が boundary に伝播する設計)。

---

## 6. ライブラリ採用判断

**新規 dependency は追加しない**。次の既存資産のみ利用:

- React 19 server component
- Tailwind / CSS variables (`tokens.css`)
- 既存 `@/components/ui/*` primitive
- 既存 `@/components/feedback/EmptyState`
- 既存 `@/lib/api/public`

icon は使わず、`▶` / `→` 等は文字符号で表現。`lucide-react` 等の追加は禁止。

---

## 7. 既存 endpoint との contract 表

| Route | API path | response 型 | 用途 |
| --- | --- | --- | --- |
| R1 `/` | `/public/stats` | `PublicStatsView` (`PublicStatsViewZ`) | Stats / Timeline |
| R1 `/` | `/public/members?limit=6&sort=recent` | `PublicMembersListResponse` | Featured |

新規 mapper は **0 個**。API contract は完全不変。

---

## 8. Lane 分割

| Lane | スコープ | 依存 |
| --- | --- | --- |
| **L-A** | `AboutUbm.tsx` + spec | なし (最初) |
| **L-B** | `Hero.tsx` 改修 + spec 拡張 | なし (並列可) |
| **L-C** | `Stats.tsx` 改修 + spec 拡張 | なし (並列可) |
| **L-D** | `Timeline.tsx` 改修 + spec 拡張 | なし (並列可) |
| **L-E** | `legacy-public.css` 追加分 | L-A〜D の DOM 確定後 |
| **L-F** | `app/page.tsx` 配線 + `page.spec.tsx` + Playwright smoke | L-A〜D 完了後 |

合計 約 1〜1.5 日。L-A〜D は並列可。

---

## 9. 1 サイクル完了根拠

- L-A: 1 component + spec = 0.3 日
- L-B/C/D: 各 0.3 日 × 並列 = 0.3 日
- L-E: 0.3 日
- L-F: 0.3 日
- Phase 9-12: 0.3 日

合計 約 1.5 日。CONST_007 1 PR 1 サイクル完結に十分収まる。

---

## 10. 命名規則統一

| 種別 | 規則 | 例 |
| --- | --- | --- |
| 新規 component file | `<Noun>.tsx` (PascalCase) | `AboutUbm.tsx` |
| 新規 spec | 同名 `.spec.tsx` (`__tests__/` 配下) | `AboutUbm.spec.tsx` |
| Props 型 | `<Component>Props` interface | `HeroProps`, `AboutUbmProps`, `TimelineProps` |
| `data-component` | kebab-case | `about-ubm`, `featured-members`, `timeline` |
| `data-role` | kebab-case | `eyebrow`, `cta`, `sub`, `tl-row` |
| `data-variant` | kebab-case | `card`, `panel`, `primary`, `secondary` |
| CSS class (legacy) | 既存 (`.btn-row` 等) は不変。新規追加は `data-*` selector を優先 | — |

---

## 11. 既存 component への影響確認

| 既存 | 影響 | 対応 |
| --- | --- | --- |
| `ZoneIntro.tsx` | `app/page.tsx` から呼び出し削除のみ。component file は残置 | 削除しない (Phase 8 で再評価) |
| `MemberCard.tsx` | 不変 | — |
| `MemberGrid.tsx` | wrapper を `app/page.tsx` 側で実装するため component 内部は不変 | — |
| `CallToActionCTA.tsx` | 不変 | — |
| `PublicHeader/Footer.tsx` | 不変 | — |
| `apps/web/src/lib/api/public.ts` | 不変 | — |

---

## メタ情報

- task_id: `public-dashboard-prototype-alignment`
- Phase: 2
- workflow_state: `spec_created`

## 目的

公開トップ UI alignment の component contract、server/client 境界、data fallback、CSS layout を設計する。

## 実行タスク

- 7 component の props と DOM contract を固定する
- `TimelineEntry.note` / `attendees` の optional 型化と graceful fallback を確定する
- L-A〜F の依存順を定義する

## 参照資料

- `phase-1-requirements.md`
- `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md`
- `docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx` L4-152
- `docs/00-getting-started-manual/claude-design-prototype/primitives.jsx`

## 成果物/実行手順

- 本設計を Phase 4 test plan と Phase 5 implementation の入力にする
- ZoneIntro は component file を残置し、page.tsx 側で呼び出しのみ削除 (Phase 8 で再評価)

## 統合テスト連携

- props-driven contract を Phase 4 の TC-HERO/STATS/ABOUT/TL/PAGE へ対応させる

## 完了条件

- [ ] component API / DOM contract / state 境界 / fallback ルールが Phase 4・5 と一致している
