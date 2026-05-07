# task-11: public-top-and-member-list

> 公開層のうち `/`（トップ）と `/(public)/members`（会員一覧）の 2 画面を、
> claude-design-prototype の構造（Hero + Stats + Zone説明 + Timeline / 検索フィルタ + density 切替 + card↔table）に
> 合わせて再構成する実装タスク。
>
> **依存**: task-08 (design-tokens-doc) / task-09 (tailwind-v4-setup) / task-10 (ui-primitives) 完了後に着手する。
> **並列可**: task-12（公開詳細・登録・法務）, task-13..17（会員/管理層）と並列実行可。

---

## §0. 自己完結コンテキスト

> このセクションは、本タスク単体で実装に着手できるよう、上位ワークフロー / 既存実装 / 上下流契約 / 用語 / プロトタイプ概念を **inline 自己完結** で要約する。
> 上位ドキュメント（`outputs/phase-1..3` / `CLAUDE.md` / task-08 / task-10 / プロトタイプ）への往復を最小化する目的。

### §0.1 上位ゴール

- ワークフロー `ui-prototype-alignment-mvp-recovery` の最終目的は、**Cloudflare Workers + Next.js（apps/web）の公開層 UI を `claude-design-prototype` の構造へ揃え、OKLch tokens / ui-primitives / 既存 API surface に整合させた MVP を復元する**こと。
- 本タスク（task-11）はその DAG のうち **公開トップ `/` と公開会員一覧 `/(public)/members`** を担当する。プロトタイプ `pages-public.jsx` の Hero / Stats / ZoneIntro / Timeline / 検索フィルタ / density / card↔table 切替 を **既存 API（`/public/stats`, `/public/members`）** へバインドして実装する。
- 不変条件（CLAUDE.md）: D1 直接アクセス禁止 / `apps/api` 経由のみ / OKLch tokens 必須 / GAS prototype を本番仕様に昇格させない / Google Form 再回答が本人更新の正規経路。

### §0.2 DAG 座標

- 依存元: **task-08（design-tokens-doc）/ task-09（tailwind-v4-setup）/ task-10（ui-primitives）**。これらが先に main に入っていなければ実装に着手しない。
- 依存先: **task-18（regression / verify-design-tokens）**。本タスクが終わると task-18 の HEX 直書き走査対象に含まれる。
- 並列可: **task-12（同 05-screens-public 配下）/ task-13..17（06-screens-member, 07-screens-admin）**。コンポーネントの新規追加が多いため衝突リスクは低い。
- 触らない領域: `apps/api/src/routes/public/*`（既存契約のみ消費）、 認証層（`apps/web/app/(auth)`）、管理層（`apps/web/app/(admin)`）。

### §0.3 触れるファイル群（新規 / 変更）

- 新規 (C): `apps/web/src/components/public/{Hero,Stats,ZoneIntro,Timeline,MemberCard,MemberGrid,MemberTable,MemberFilters.client,DensityToggle.client}.tsx`、`apps/web/src/lib/api/public.ts`、各 vitest、`apps/web/e2e/public-top-and-list.spec.ts`
- 変更 (M): `apps/web/app/page.tsx`、`apps/web/app/(public)/layout.tsx`、`apps/web/app/(public)/members/page.tsx`、`apps/web/src/lib/url/members-search.ts`
- 不可触: `apps/api/**`、`packages/shared/**` の Z スキーマ（消費のみ）、 token 定義（task-08 の正本）

### §0.4 既存 API surface（不変・本タスクで変更しない）

`apps/api/src/routes/public/` 配下に Hono Router として実装済み。本タスクは consumer 側のみ実装する。

| Method | Path | Hono ファイル | 主要 Env binding |
|--------|------|---------------|------------------|
| GET | `/public/stats` | `stats.ts` | `DB: D1Database` |
| GET | `/public/members` | `members.ts` | `DB`（`parsePublicMemberQuery` で query 正規化） |
| GET | `/public/members/:memberId` | `member-profile.ts` | `DB` |
| GET | `/public/form-preview` | `form-preview.ts` | `DB`, schema sync 60s cache |

呼び出しは `apps/web/src/lib/fetch/public.ts`（既存）または本タスク新設の `apps/web/src/lib/api/public.ts` 経由のみ。Workers 上では `env.API_SERVICE.fetch(...)`、ローカルは `${PUBLIC_API_BASE_URL}` 直叩き。

### §0.5 不変条件（本タスクに効くもの）

1. `stableKey` 経由でのみ field を参照（一覧では `PublicMemberListItemZ` の固定フィールドのみ）。
2. `consent` キーは `publicConsent` / `rulesConsent` のみ（一覧では非表示だが、命名のみ予約）。
3. D1 への直接アクセスは `apps/api` に閉じる（`apps/web` から `D1Database` import 禁止）。
4. GAS prototype は本番仕様に昇格させない（参照のみ）。
5. URL query を search 状態の正本とする（F5 / share URL でも復元）。
6. revalidate は無料枠を意識する（stats=60s, members=30s）。
7. 色は OKLch tokens のみ（HEX / `bg-[#xxx]` / `text-[#xxx]` 禁止、task-18 が走査）。

### §0.6 上流シグネチャ（inline 展開）

#### §0.6.1 ui-primitives（task-10 由来、本タスクで使う側のみ要約）

- `Button`: `extends ButtonHTMLAttributes`, `VariantProps`（variant: primary/secondary/ghost/danger, size: sm/md/lg, block: bool）, `leftIcon? rightIcon?: ReactNode`。
- `Card`: shadcn 構成、`Card` / `CardHeader` / `CardTitle` / `CardDescription` / `CardContent` / `CardFooter` のサブ Compound。`HTMLAttributes<HTMLDivElement>` をそのまま受ける。
- `Badge`: `VariantProps`（tone: neutral/info/success/warn/danger/zone-a..e, outline: bool, dot: bool）+ `children`。
- `Input`: `extends InputHTMLAttributes<HTMLInputElement>`, `VariantProps`（size: sm/md/lg, invalid: bool）。
- `Select`: `extends SelectHTMLAttributes<HTMLSelectElement>`（options は `<option>` 子要素で渡す）。
- `Avatar`: `{ name: string; hue?: number; size?: "sm"|"md"|"lg"|"xl"; className? }`。`role="img" aria-label={name}` で initial を描画。
- `EmptyState`: `{ icon?: ReactNode; title: string; description?: string; action?: ReactNode; className? }`、`role="status"`。
- `Field`: `{ label; required?; optional?; description?; error?; children: (controlProps) => ReactNode }` の **render-prop**。`htmlFor` / `aria-describedby` / `aria-invalid` を強制配線。
- `Stat`: `{ label: string; value: ReactNode; delta?: ReactNode; tone?: "neutral"|"up"|"down" }`（Stats セクションで使用）。

import 経路: `import { Button, Card, Badge, Input, Select, Avatar, EmptyState, Field, Stat } from "@/components/ui";`。

#### §0.6.2 既存 API（apps/api 既存、`@ubm-hyogo/shared` から zod スキーマを import して strict parse）

- `GET /public/stats` → 出力 `PublicStatsViewZ`
  - 概念: `{ memberCount: number; publicMemberCount: number; zoneBreakdown: Array<{ zone: string; count: number }>; lastSync: { responseSync: ISODateString | null; schemaSync: ISODateString | null }; recentMeetings: Array<{ sessionId; title; heldOn(ISO) }> }`
- `GET /public/members?q&zone&status&tag&sort&page&size` → 入力 `parsePublicMemberQuery` 経由で `{ q?: string; zone?: string; status?: string; tag?: string[]; sort?: "recent"|"name"; page?: number(>=1); size?: number(<=60) }` を正規化、出力 `PublicMemberListViewZ`
  - 概念: `{ items: Array<PublicMemberListItem>; pagination: { total; page; size; totalPages } }`
- `GET /public/members/:id` → 出力 `PublicMemberProfileZ`（task-12 で詳細利用、ここでは link 先 contract のみ把握）
- `GET /public/form-preview` → 出力 `FormPreviewViewZ`（本タスクでは未使用、task-12 register 用）

`apps/web/src/lib/api/public.ts` は **すべての fetch を `XxxZ.strict().parse()` 経由で型安全化**する。

### §0.7 下流シグネチャ（task-18 / task-11 → consumer）

- task-18 `verify-design-tokens.ts` は `apps/web/src/components/public/**` を走査対象に追加する。本タスクは「`bg-[#`, `text-[#`, `#[0-9a-f]{3,8}` を含まない」状態で完了させる。
- 後続が依存する **本タスク産アンカー**: `data-page="home" / data-page="members" / data-stat="total|public|zones|sync" / data-component="hero" / data-role="pagination-meta" / data-role="back"`（一覧は本タスク、詳細の `back` は task-12）。

### §0.8 用語

| 語 | 定義 |
|----|------|
| Zone | UBM の事業ステージ分類 0→1 / 1→10 / 10→100（token: `--ubm-color-zone-{a..e}`）。 |
| publishState | 会員の公開状態（`public`/`private`/その他）。一覧の `status` filter で利用。 |
| density | 会員一覧の表示密度。`comfy`(3 列カード) / `dense`(4 列カード) / `list`(table)。URL `density=` が正本。 |
| stableKey | フォーム項目の安定識別子。schema 変更に追従するため文字列リテラル直参照を禁止する。 |
| revalidate | Next.js Server Component の ISR-like 再取得秒。本タスクでは stats=60, members=30。 |
| MembersSearch | URL query を zod で parse した正規化済み検索条件。`{ q, zone, status, tags[], sort, density, page, limit }`。 |

### §0.9 担当画面の概念（プロトタイプ要約）

#### §0.9.1 `/`（公開トップ）

- レイアウト: 縦積み 4 セクション（Hero → Stats → ZoneIntro → Timeline）+ 任意の「参加している事業者たち」（最近 6 名 MemberGrid comfy）。
- 主要セクション:
  - **Hero**: eyebrow（small caps）+ `<h1>` + 説明 + 2 CTA（「メンバー一覧を見る」/「会員ログイン」）。背景は `--ubm-color-accent` ベースのグラデ。
  - **Stats**: 4 枚の Stat カード（総会員 / 公開中 / Zone内訳 / Last sync）。`grid-cols-4`（mobile=2列）。
  - **ZoneIntro**: 3 枚カード（0→1 / 1→10 / 10→100）。token `--ubm-color-zone-a/b/c`。
  - **Timeline**: `recentMeetings` を `<ol>` 縦並びで降順表示。
- 状態:
  - loading: `loading.tsx` で Stat / MemberCard の Skeleton。
  - error: `error.tsx` で `ErrorState`（Sentry capture）。
  - empty: `recentMeetings = []` のとき Timeline 内に `EmptyState`。
- プロトタイプ由来 vs 派生: Hero / Stats / ZoneIntro / Timeline はすべて `pages-public.jsx` 由来。「参加している事業者たち」セクションはプロトタイプの抜粋を本タスクで再構成（派生）。

#### §0.9.2 `/(public)/members`（会員一覧）

- レイアウト: page-head（eyebrow + `<h1>` + 説明）→ MemberFilters（client）→ Grid もしくは Table → pagination meta。
- 主要セクション:
  - **MemberFilters**: 検索ボックス `q` / Zone select / Status select / Tag pill 群（`role="switch"`）/ Sort select / DensityToggle / クリアボタン。`useSearchParams + router.push` で URL を書き換える（状態は URL 正本）。
  - **MemberGrid**: density=comfy(3 列) / dense(4 列)。`<ul>` ベース。
  - **MemberTable**: density=list 時の `<table>`。各行が `/members/{id}` への link。
  - **Pagination meta**: `total / 表示件数 / page / totalPages` を `<p data-role="pagination-meta">` で。
- 状態:
  - loading: `loading.tsx` の MemberCard×6 Skeleton。
  - empty: `list.items.length===0` で `EmptyState`（「該当なし」+ クリア link）。
  - error: `error.tsx` で `ErrorState`。
- プロトタイプ由来 vs 派生: 検索フィルタ + density + card↔table 切替はすべて `pages-public.jsx` 由来。tag pill の `role="switch"` 化は本タスクの a11y 派生。

---

## 0. ヘッダー

| 項目 | 値 |
|------|----|
| task id | task-11 |
| ワークフロー | `ui-prototype-alignment-mvp-recovery` |
| Phase | Phase 4-7（実装） |
| 区分 | screens-public |
| 対象画面 | `/`, `/(public)/members` |
| 依存タスク | task-08, task-09, task-10（完了必須） |
| 並列可タスク | task-12, task-13, task-14, task-15, task-16, task-17 |
| 単一責務 | 「公開トップと会員一覧をプロトタイプ準拠で再構成し、`/public/stats` と `/public/members` API に接続する」 |
| 想定工数 | 1.0〜1.5 人日（実装 + 単体テスト + a11y 検証） |
| outputs | `apps/web/app/page.tsx`, `apps/web/app/(public)/members/page.tsx`, `apps/web/app/(public)/layout.tsx`, `apps/web/src/components/public/*`, `apps/web/src/lib/api/public.ts`, vitest, Playwright smoke |

---

## 1. ゴール / 非ゴール

### 1.1 ゴール

1. `/`（トップ）を **Hero / Stats / ZoneIntro / Timeline** の 4 セクションで再構成する。
2. `/(public)/members` を **Filters（q / zone / status / tag / sort / density）+ MemberGrid / MemberTable 切替 + Pagination meta** で再構成する。
3. すべての色・余白は task-08 で定義された **OKLch tokens** のみを使う（HEX 直書き禁止）。
4. データ取得は `apps/web/src/lib/fetch/public.ts`（既存）または新規 `apps/web/src/lib/api/public.ts` を介し、**D1 直アクセス禁止**（不変条件 #5）。
5. URL query を search 状態の正本とし（`q`, `zone`, `status`, `tag`, `sort`, `density`, `page`）、Server Component が searchParams を受け取り API へ転送する。
6. loading / empty / error の 3 状態を ui-primitives の `Skeleton` / `EmptyState` / `ErrorState` で表示する。
7. vitest（filter ロジック単体）と Playwright smoke（`/`・`/members` の 200 + 主要要素 visible + axe critical 0）を追加する。

### 1.2 非ゴール

- `/(public)/members/[id]`、`/register`、`/privacy`、`/terms` は **task-12 の責務**。本タスクでは触らない。
- 認証層（`/login`, `/profile`）、管理層は対象外。
- 新 API endpoint の追加禁止（既存 `/public/stats`, `/public/members` のみ）。
- 国際化（i18n）は対象外。日本語固定。
- `/api/...`（Next.js API routes）の追加は不要。fetch は Hono Worker を直接見る。

---

## 2. 変更対象ファイル表

| path | 区分 | 概要 |
|------|------|------|
| `apps/web/app/page.tsx` | M | Hero / Stats / ZoneIntro / Timeline 構成へ書き換え。`Promise.all` で stats + members（limit=6）を並列取得。 |
| `apps/web/app/(public)/layout.tsx` | M | public 共通 Header / Footer / Container を ui-primitives で構成。 |
| `apps/web/app/(public)/members/page.tsx` | M | searchParams を zod parse → `/public/members?...` に転送。`MemberFilters` + `MemberGrid` / `MemberTable` 切替。 |
| `apps/web/src/components/public/Hero.tsx` | C | 大見出し + サブ + 2 CTA。サーバ側で受け取った props のみで描画。 |
| `apps/web/src/components/public/Stats.tsx` | C | `PublicStatsView` を 4 枚の StatCard（総会員 / 公開中 / Zone別 / Last sync）で表示。 |
| `apps/web/src/components/public/ZoneIntro.tsx` | C | UBM 3 zone（0→1 / 1→10 / 10→100）の説明カード。 |
| `apps/web/src/components/public/Timeline.tsx` | C | `recentMeetings` を縦並び timeline で表示。 |
| `apps/web/src/components/public/MemberCard.tsx` | C/M | density=comfy/dense/list の 3 形態。`role="article"`。 |
| `apps/web/src/components/public/MemberGrid.tsx` | C | `<ul>` ベースのグリッド（comfy=3列 / dense=4列）。 |
| `apps/web/src/components/public/MemberTable.tsx` | C | `<table>` ベース、density=list 用。 |
| `apps/web/src/components/public/MemberFilters.client.tsx` | C | `'use client'` 必須。URL query を `useSearchParams` + `useRouter().push` で更新。 |
| `apps/web/src/components/public/DensityToggle.client.tsx` | C | density=comfy/dense/list の Segmented control。 |
| `apps/web/src/lib/api/public.ts` | C | `getStats`, `listMembers`, `getMemberProfile`, `getFormPreview` の薄い wrapper（`fetchPublic` の上）。 |
| `apps/web/src/lib/url/members-search.ts` | M | `density: "comfy" \| "dense" \| "list"`、`tags: string[]` を Zod で parse / serialize。 |
| `apps/web/src/components/public/Hero.test.ts` | C | snapshot ではなく構造（h1 / CTA href）を assert。 |
| `apps/web/src/lib/url/members-search.test.ts` | M | filter / sort / density combination を網羅。 |
| `apps/web/e2e/public-top-and-list.spec.ts` | C | Playwright smoke。`/` と `/members` を 200 + axe critical 0。 |

> 既存の `apps/web/app/page.tsx` と `apps/web/app/(public)/members/page.tsx` は同じ責務をすでに持っているため `M`（書き換え）扱い。

---

## 3. 各画面のコンポーネント分解とシグネチャ

### 3.1 `/`（トップ） — Server Component

#### 3.1.1 Page

```tsx
// apps/web/app/page.tsx
import type { z } from "zod";
import { PublicMemberListViewZ, PublicStatsViewZ } from "@ubm-hyogo/shared";
import { Hero } from "@/src/components/public/Hero";
import { Stats } from "@/src/components/public/Stats";
import { ZoneIntro } from "@/src/components/public/ZoneIntro";
import { Timeline } from "@/src/components/public/Timeline";
import { MemberGrid } from "@/src/components/public/MemberGrid";
import { getStats, listMembers } from "@/src/lib/api/public";

type PublicStatsView = z.infer<typeof PublicStatsViewZ>;
type PublicMemberListView = z.infer<typeof PublicMemberListViewZ>;

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function HomePage() {
  const [stats, recent] = await Promise.all([
    getStats({ revalidate: 60 }),
    listMembers({ limit: 6, sort: "recent" }, { revalidate: 60 }),
  ]);

  return (
    <main data-page="home" className="stack-lg">
      <Hero
        eyebrow="UBM HYOGO · CHAPTER SITE"
        title="兵庫で、事業を育てる人のつながりを可視化する。"
        description="Google フォームから集めた支部会メンバーの自己紹介を、公開情報と会員限定情報に分けて整理・公開します。"
        primaryCta={{ label: "メンバー一覧を見る", href: "/members" }}
        secondaryCta={{ label: "会員ログイン", href: "/login" }}
      />
      <Stats stats={stats} />
      <ZoneIntro />
      <section data-component="featured" aria-labelledby="featured-heading">
        <h2 id="featured-heading">参加している事業者たち</h2>
        <MemberGrid items={recent.items} density="comfy" />
      </section>
      <Timeline entries={stats.recentMeetings} />
    </main>
  );
}
```

#### 3.1.2 Hero

```tsx
// apps/web/src/components/public/Hero.tsx
export interface HeroCta { label: string; href: string }
export interface HeroProps {
  eyebrow?: string;
  title: string;
  description: string;
  primaryCta: HeroCta;
  secondaryCta?: HeroCta;
}
export function Hero(props: HeroProps): JSX.Element;
```

- マークアップ: `<section data-component="hero">` 内に `eyebrow`（small caps）/ `<h1>` / `<p>` / `<div data-role="cta-row">`。
- token 使用: `--ubm-color-accent`, `--ubm-radius-lg`, `--ubm-spacing-9`, `--ubm-typography-display-1`。
- a11y: `<h1>` は 1 個のみ。CTA は `<a>` で href 必須。

#### 3.1.3 Stats

```tsx
// apps/web/src/components/public/Stats.tsx
import type { z } from "zod";
import { PublicStatsViewZ } from "@ubm-hyogo/shared";

type PublicStatsView = z.infer<typeof PublicStatsViewZ>;
export interface StatsProps { stats: PublicStatsView }
export function Stats({ stats }: StatsProps): JSX.Element;
```

- 4 枚の StatCard を `grid-cols-4`（mobile=2列）で配置。
  1. 総会員数 = `stats.memberCount`
  2. 公開中 = `stats.publicMemberCount`
  3. Zone 内訳 = `stats.zoneBreakdown` を Chip 列にして 1 枚に集約
  4. Last sync = `stats.lastSync.responseSync` をバッジ + relative time
- `data-stat="total"` `data-stat="public"` `data-stat="zones"` `data-stat="sync"` をテストアンカーとして付ける。

#### 3.1.4 ZoneIntro

```tsx
// apps/web/src/components/public/ZoneIntro.tsx
export interface ZoneIntroProps { /* no props — 静的コンテンツ */ }
export function ZoneIntro(): JSX.Element;
```

- 3 枚のカード（0→1 / 1→10 / 10→100）。token は `--ubm-color-zone-a/b/c`。
- 各カードは `<article>` + `<h3>` + `<p>` の最小構成。

#### 3.1.5 Timeline

```tsx
// apps/web/src/components/public/Timeline.tsx
export interface TimelineEntry {
  sessionId: string;
  title: string;
  heldOn: string; // ISO8601
}
export interface TimelineProps { entries: ReadonlyArray<TimelineEntry> }
export function Timeline({ entries }: TimelineProps): JSX.Element;
```

- `<ol>` で日付降順。各 `<li>` は `<time dateTime={heldOn}>`。
- `entries.length === 0` 時は `EmptyState` で「直近の支部会記録はありません」。

### 3.2 `/(public)/members`（会員一覧）— Server Component + Client filters

#### 3.2.1 Page

```tsx
// apps/web/app/(public)/members/page.tsx
import type { z } from "zod";
import { PublicMemberListViewZ } from "@ubm-hyogo/shared";
import { listMembers } from "@/src/lib/api/public";
import {
  parseSearchParams,
  type MembersSearch,
} from "@/src/lib/url/members-search";
import { MemberFilters } from "@/src/components/public/MemberFilters.client";
import { MemberGrid } from "@/src/components/public/MemberGrid";
import { MemberTable } from "@/src/components/public/MemberTable";
import { EmptyState } from "@/src/components/ui/empty-state";

type PublicMemberListView = z.infer<typeof PublicMemberListViewZ>;

export const dynamic = "force-dynamic";
export const revalidate = 30;

interface MembersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const sp = await searchParams;
  const search: MembersSearch = parseSearchParams(sp);
  const list: PublicMemberListView = await listMembers(search, { revalidate: 30 });

  return (
    <main data-page="members" className="stack-md">
      <header className="page-head">
        <div>
          <p className="eyebrow">MEMBERS</p>
          <h1>メンバー一覧</h1>
          <p className="muted">兵庫支部会に参加する事業者たち。掲載に同意いただいた方のみ公開しています。</p>
        </div>
      </header>
      <MemberFilters initial={search} total={list.pagination.total} />
      {list.items.length === 0 ? (
        <EmptyState
          title="該当するメンバーがいません"
          description="検索条件を変更するか、絞り込みをクリアしてください。"
          resetHref="/members"
        />
      ) : search.density === "list" ? (
        <MemberTable items={list.items} />
      ) : (
        <MemberGrid items={list.items} density={search.density} />
      )}
      <p data-role="pagination-meta">
        {list.pagination.total} 件中 {list.items.length} 件表示（page {list.pagination.page} / {list.pagination.totalPages}）
      </p>
    </main>
  );
}
```

#### 3.2.2 MembersSearch 型と Zod parser

```ts
// apps/web/src/lib/url/members-search.ts
import { z } from "zod";

export const DensityZ = z.enum(["comfy", "dense", "list"]);
export const SortZ = z.enum(["recent", "name"]);

export const MembersSearchZ = z.object({
  q: z.string().default(""),
  zone: z.string().default(""),
  status: z.string().default(""),
  tags: z.array(z.string()).default([]),
  sort: SortZ.default("recent"),
  density: DensityZ.default("comfy"),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(60).default(24),
});
export type MembersSearch = z.infer<typeof MembersSearchZ>;

export function parseSearchParams(
  sp: Record<string, string | string[] | undefined>,
): MembersSearch;

export function toApiQuery(search: MembersSearch): URLSearchParams;
```

- `tag` は配列。URL 上は `?tag=foo&tag=bar` を許容。
- `density` は URL 正本（クライアント切替時は `router.push` で query を書き換える）。
- 不正値は zod default に fallback（throw しない）。

#### 3.2.3 MemberFilters（client）

```tsx
// apps/web/src/components/public/MemberFilters.client.tsx
"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { MembersSearch } from "@/src/lib/url/members-search";

export interface MemberFiltersProps {
  initial: MembersSearch;
  total: number;
}
export function MemberFilters({ initial, total }: MemberFiltersProps): JSX.Element;
```

- 内部 state は `initial` を seed に `useState`。`onSubmit` または field change で `router.push("?...")`。
- フィールド: 検索ボックス（`q`）、Zone select、Status select、Sort select、Tag pill 群（toggle）、DensityToggle、クリアボタン。
- すべて `<label>` 紐付け。tag pills は `<button role="switch" aria-checked>`。

#### 3.2.4 DensityToggle（client）

```tsx
// apps/web/src/components/public/DensityToggle.client.tsx
"use client";
export interface DensityToggleProps {
  value: "comfy" | "dense" | "list";
  onChange: (next: "comfy" | "dense" | "list") => void;
}
export function DensityToggle(props: DensityToggleProps): JSX.Element;
```

- `<div role="radiogroup" aria-label="表示密度">` + 3 個の `<button role="radio" aria-checked>`。

#### 3.2.5 MemberCard / MemberGrid / MemberTable

```tsx
// apps/web/src/components/public/MemberCard.tsx
import type { z } from "zod";
import { PublicMemberListItemZ } from "@ubm-hyogo/shared";

type Item = z.infer<typeof PublicMemberListItemZ>;
export interface MemberCardProps {
  member: Item;
  density: "comfy" | "dense";
}
export function MemberCard({ member, density }: MemberCardProps): JSX.Element;
```

```tsx
// apps/web/src/components/public/MemberGrid.tsx
export interface MemberGridProps {
  items: ReadonlyArray<Item>;
  density: "comfy" | "dense";
}
export function MemberGrid({ items, density }: MemberGridProps): JSX.Element;
```

- comfy = `grid-cols-3 md:grid-cols-2 sm:grid-cols-1`、dense = `grid-cols-4 md:grid-cols-3 sm:grid-cols-2`。

```tsx
// apps/web/src/components/public/MemberTable.tsx
export interface MemberTableProps { items: ReadonlyArray<Item> }
export function MemberTable({ items }: MemberTableProps): JSX.Element;
```

- `<table>` + `<thead><tr><th scope="col">…` + 各行は詳細リンク `<a href="/members/{id}">`。

### 3.3 共通 layout（`apps/web/app/(public)/layout.tsx`）

```tsx
// apps/web/app/(public)/layout.tsx
import { ReactNode } from "react";
import { PublicHeader } from "@/src/components/public/PublicHeader";
import { PublicFooter } from "@/src/components/public/PublicFooter";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PublicHeader />
      <div data-region="public-content" className="container">
        {children}
      </div>
      <PublicFooter />
    </>
  );
}
```

- Header は logo + nav（メンバー / 登録 / ログイン）。Footer は legal リンク（`/privacy`, `/terms`）。
- token: `--ubm-color-bg`, `--ubm-color-border`, `--ubm-spacing-4`。

---

## 4. データフロー

```
URL  ──► Next.js Server Component (app/(public)/members/page.tsx)
        │
        ├─ parseSearchParams() : MembersSearch    (zod default fallback)
        │
        └─ listMembers(search, { revalidate:30 })
              │
              ├─ apps/web/src/lib/api/public.ts  ── fetchPublic("/public/members?...")
              │       │
              │       ├─ on Workers: env.API_SERVICE.fetch(...)        (service binding)
              │       └─ on local : fetch(`${PUBLIC_API_BASE_URL}/public/members?...`)
              │
              ├─ apps/api/src/routes/public/members.ts (Hono)
              │       └─ listPublicMembersUseCase(query, { ctx({ DB }) })
              │
              └─ Zod parse via PublicMemberListViewZ.strict()
                    │
                    └─ Server Component が JSX に展開
                          │
                          └─ MemberFilters は 'use client', URL を書き換えるだけ
                              （状態は URL 正本、F5 でも復元）
```

### 4.1 状態マトリクス

| 状態 | 検出条件 | UI |
|------|----------|----|
| loading | Server Component 初回取得中（`loading.tsx`） | `Skeleton` で MemberCard×6 / 4 つの StatCard プレースホルダ |
| empty | `list.items.length === 0` | `EmptyState`（「該当なし」+ 絞り込みクリア link） |
| error | `fetchPublic` throw | `error.tsx` boundary が catch → `ErrorState` + Sentry capture |
| success | items >= 1 | MemberGrid / MemberTable + pagination meta |

### 4.2 cache 方針

| エンドポイント | revalidate | reason |
|----------------|------------|--------|
| `/public/stats` | 60s | 集計値は admin 操作後最大 60 秒で反映 |
| `/public/members` | 30s | publishState 切替を 30 秒内で反映（API 側は `Cache-Control: no-store` 既定だが Server Component cache を 30s で被せる） |

---

## 5. テスト方針

### 5.1 vitest（unit）

| ファイル | 検証内容 |
|----------|----------|
| `apps/web/src/lib/url/members-search.test.ts` | <ul><li>空 searchParams → all defaults</li><li>`density=invalid` → "comfy" fallback</li><li>`tag=a&tag=b` → `tags: ["a","b"]`</li><li>`page=-1` → 1 fallback</li><li>`toApiQuery` round-trip safety</li></ul> |
| `apps/web/src/lib/api/public.test.ts` | <ul><li>`getStats` が `PublicStatsViewZ` を強制 parse</li><li>`listMembers` が search を `/public/members?...` に正しく serialize</li><li>500 で throw、404 で `FetchPublicNotFoundError`</li></ul> |
| `apps/web/src/components/public/Hero.test.tsx` | <ul><li>`<h1>` は 1 個</li><li>primaryCta.href が `<a>` に反映</li></ul> |
| `apps/web/src/components/public/Stats.test.tsx` | <ul><li>4 枚の StatCard が `data-stat="..."` で識別</li><li>zone breakdown が空配列でも crash しない</li></ul> |
| `apps/web/src/components/public/MemberCard.test.tsx` | <ul><li>density=comfy/dense でクラスが切り替わる</li><li>nickname 空でも render</li></ul> |

### 5.2 Playwright smoke（`apps/web/e2e/public-top-and-list.spec.ts`）

- `/` 200 + `<h1>` visible + Stats の `[data-stat="total"]` visible + axe critical=0
- `/members` 200 + filters form visible + `[data-page="members"]` 内の MemberGrid もしくは EmptyState のいずれかが visible + axe critical=0
- `/members?density=list` 200 + `<table>` visible
- `/members?density=invalid` 200（fallback 動作）+ MemberGrid（comfy）が visible
- `/members?q=zzz_no_match_zzz` 200 + EmptyState visible

### 5.3 a11y 個別

- `MemberFilters` のラジオ切替 / tag pill switch を keyboard（Tab + Space）で操作可能
- `<label htmlFor>` が全 input に紐付くこと
- focus ring は token `--ubm-color-focus`

---

## 6. ローカル実行コマンド

```bash
# 依存とリント
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 単体テスト
mise exec -- pnpm --filter web test:run -- src/components/public src/lib/url src/lib/api/public
mise exec -- pnpm --filter @ubm-hyogo/shared test:run -- viewmodel

# ローカル dev
mise exec -- pnpm --filter api dev      # Worker (Hono) on :8787
mise exec -- pnpm --filter web dev      # Next.js on :3000

# Playwright smoke
mise exec -- pnpm --filter web e2e -- public-top-and-list.spec.ts
```

---

## 7. DoD（受け入れ条件）

- [ ] `/` が 200 を返し、Hero / Stats / ZoneIntro / Timeline の 4 セクションが visible
- [ ] `/members` が 200 を返し、Filters / Grid|Table / Pagination meta が visible
- [ ] `/members?density=list` で `<table>` が出る、`?density=invalid` で comfy fallback
- [ ] `/members?q=...&zone=...&tag=a&tag=b&sort=name` がそのまま API へ転送される
- [ ] axe-core critical violation = 0（`/`, `/members`, `/members?density=list` の 3 ページ）
- [ ] `pnpm typecheck` / `pnpm lint` / vitest / Playwright smoke が全 pass
- [ ] HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` が **0 件**（task-18 verify-design-tokens.ts と整合）
- [ ] D1 への直接アクセスが `apps/web` 内に **存在しない**（grep で `D1Database` 0 件 / 不変条件 #5）
- [ ] `apps/api/src/routes/public/{stats,members}.ts` への変更は **無し**（既存 endpoint のみ利用）
- [ ] PR 本文に `outputs/phase-1..3` の該当節 + 本仕様書の主要見出しが反映済み

---

## 8. 補足: 不変条件チェックリスト

| 不変条件 | 本タスクでの遵守方法 |
|----------|---------------------|
| #1 stableKey 経由でのみ field を参照 | 一覧では `PublicMemberListItemZ` の固定フィールドのみ参照（schema に追従） |
| #5 D1 直接アクセス禁止 | `apps/web/src/lib/api/public.ts` 経由のみ、`@cloudflare/workers-types` の `D1Database` を import しない |
| #8 URL query が状態正本 | density / sort / tags / q / zone / status / page を URL に書き戻す |
| #10 無料枠を意識した revalidate | stats=60s, members=30s |
| OKLch tokens 必須 | task-08 の token 表からのみ採用、HEX 直書き禁止 |

