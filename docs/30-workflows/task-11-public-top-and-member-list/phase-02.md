# Phase 2: 設計

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 2 |
| task | task-11-public-top-and-member-list |
| state | implemented-local / implementation / VISUAL_ON_EXECUTION |

## 目的

task-11 の構造（変更対象ファイル / 関数シグネチャ / データフロー / 上流契約整合）を確定する。

## 実行タスク

- [ ] 変更対象ファイル表を §「変更対象ファイル一覧」に reify する
- [ ] 関数 / 型シグネチャを §「関数・型シグネチャ」に記述する
- [ ] runtime evidence が必要な項目は user-gated として false-green にしない

## 参照資料

- 一次原典 §0.3 / §2 / §3 / §4 / §6
- `docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx`
- `apps/api/src/routes/public/{stats,members,member-profile,form-preview}.ts`
- `@ubm-hyogo/shared` の `PublicStatsViewZ` / `PublicMemberListViewZ` / `PublicMemberListItemZ` / `PublicMemberProfileZ` / `FormPreviewViewZ` / `parsePublicMemberQuery`
- `apps/web/src/lib/fetch/public.ts`（既存）/ `apps/web/src/lib/url/members-search.ts`（既存・要拡張）

## 成果物

- `outputs/phase-02/main.md`

## 統合テスト連携

- Phase 4 の unit / Playwright smoke 仕様へ接続する。
- Phase 11 の `outputs/phase-11/evidence/{test,e2e,grep-gate}.log` で実測確認する。

## 変更対象ファイル一覧

| path | 種別 | 概要 |
| --- | --- | --- |
| `apps/web/app/page.tsx` | M | Hero / Stats / ZoneIntro / Timeline + 任意 MemberGrid。`Promise.all` で stats + recent members（limit=6）並列取得 |
| `apps/web/app/(public)/layout.tsx` | M | PublicHeader / PublicFooter / Container 構成 |
| `apps/web/app/(public)/members/page.tsx` | M | searchParams zod parse → `listMembers` → MemberFilters + Grid\|Table + Pagination meta + EmptyState |
| `apps/web/src/components/public/Hero.tsx` | M | 大見出し + サブ + 2 CTA、`data-component="hero"` |
| `apps/web/src/components/public/Stats.tsx` | C | 4 枚の StatCard（既存 `StatCard.tsx` を内部で利用）、`data-stat=...` |
| `apps/web/src/components/public/ZoneIntro.tsx` | C | 0→1 / 1→10 / 10→100 静的 3 カード |
| `apps/web/src/components/public/Timeline.tsx` | M | `<ol>` + `<time dateTime>`、空時 `EmptyState` |
| `apps/web/src/components/public/MemberCard.tsx` | M | `density: "comfy" \| "dense"` の 2 形態。`list` 表示は `MemberTable` が担当 |
| `apps/web/src/components/public/MemberGrid.tsx` | C | `<ul>` ベース、density 別 grid-cols |
| `apps/web/src/components/public/MemberTable.tsx` | C | `<table>` + `<thead>` + `<a href="/members/{id}">` |
| `apps/web/src/components/public/MemberFilters.client.tsx` | C | `'use client'` URL 書き換え、tag pill switch、density toggle |
| `apps/web/src/components/public/DensityToggle.client.tsx` | C | radiogroup + 3 radio button |
| `apps/web/src/components/public/PublicHeader.tsx` | C | logo + nav |
| `apps/web/src/components/public/PublicFooter.tsx` | C | legal links |
| `apps/web/src/lib/api/public.ts` | C | `getStats` / `listMembers` / `getMemberProfile` / `getFormPreview` 薄い wrapper、Zod strict parse |
| `apps/web/src/lib/url/members-search.ts` | M | `density` / `tags[]` を Zod parse、`toApiQuery` 提供 |
| `apps/web/src/components/public/__tests__/Hero.test.tsx` | C | `<h1>` 一意 / CTA href 検証 |
| `apps/web/src/components/public/__tests__/Stats.test.tsx` | C | 4 StatCard `data-stat` / zone 空配列 crash しない |
| `apps/web/src/components/public/__tests__/MemberCard.test.tsx` | C | density 切替で class 切替 / nickname 空でも render |
| `apps/web/src/lib/url/__tests__/members-search.test.ts` | C/M | parse 既定値 / fallback / round-trip |
| `apps/web/src/lib/api/__tests__/public.test.ts` | C | `getStats` / `listMembers` の Zod strict parse / 500 throw / 404 NotFoundError |
| `apps/web/playwright/tests/public-top-and-list.spec.ts` | C | Playwright smoke 5 ケース + axe critical=0 |

種別: C=Create / M=Modify / D=Delete

## 関数・型シグネチャ

### `apps/web/src/lib/url/members-search.ts`

```ts
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

- 不正値は zod default に fallback（throw しない）
- `tag` は配列。URL 上は `?tag=foo&tag=bar` を許容
- `density` は URL 正本（クライアント切替時は `router.replace` で query を書き換え、履歴を肥大化させない）

### `apps/web/src/lib/api/public.ts`

```ts
import type { z } from "zod";
import {
  PublicStatsViewZ,
  PublicMemberListViewZ,
  PublicMemberProfileZ,
  FormPreviewViewZ,
} from "@ubm-hyogo/shared";
import type { MembersSearch } from "@/src/lib/url/members-search";

type FetchOpts = { revalidate?: number };

export class FetchPublicError extends Error { status: number }
export class FetchPublicNotFoundError extends FetchPublicError {}

export function getStats(opts?: FetchOpts): Promise<z.infer<typeof PublicStatsViewZ>>;

export function listMembers(
  search: Partial<MembersSearch>,
  opts?: FetchOpts,
): Promise<z.infer<typeof PublicMemberListViewZ>>;

export function getMemberProfile(
  id: string,
  opts?: FetchOpts,
): Promise<z.infer<typeof PublicMemberProfileZ>>;

export function getFormPreview(
  opts?: FetchOpts,
): Promise<z.infer<typeof FormPreviewViewZ>>;
```

- 内部で `apps/web/src/lib/fetch/public.ts` の `fetchPublic` を呼び出し、`XxxZ.parse（strict 定義済み schema）(json)` で型安全化する
- 500 系は `FetchPublicError`、404 は `FetchPublicNotFoundError` を throw
- Workers では `env.API_SERVICE.fetch(...)`、ローカルは `${PUBLIC_API_BASE_URL}` を `getPublicEnv()` 経由で参照

### `apps/web/src/components/public/Hero.tsx`

```tsx
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

### `apps/web/src/components/public/Stats.tsx`

```tsx
import type { z } from "zod";
import { PublicStatsViewZ } from "@ubm-hyogo/shared";
type PublicStatsView = z.infer<typeof PublicStatsViewZ>;
export interface StatsProps { stats: PublicStatsView }
export function Stats({ stats }: StatsProps): JSX.Element;
```

- 4 枚（total / public / zones / sync）を `data-stat="total|public|zones|sync"` で識別

### `apps/web/src/components/public/ZoneIntro.tsx`

```tsx
export function ZoneIntro(): JSX.Element;
```

### `apps/web/src/components/public/Timeline.tsx`

```tsx
export interface TimelineEntry { sessionId: string; title: string; heldOn: string }
export interface TimelineProps { entries: ReadonlyArray<TimelineEntry> }
export function Timeline({ entries }: TimelineProps): JSX.Element;
```

### `apps/web/src/components/public/MemberCard.tsx`

```tsx
import type { z } from "zod";
import { PublicMemberListItemZ } from "@ubm-hyogo/shared";
type Item = z.infer<typeof PublicMemberListItemZ>;
export interface MemberCardProps {
  member: Item;
  density: "comfy" | "dense";
}
export function MemberCard({ member, density }: MemberCardProps): JSX.Element;
```

### `apps/web/src/components/public/MemberGrid.tsx`

```tsx
import type { z } from "zod";
import { PublicMemberListItemZ } from "@ubm-hyogo/shared";
type Item = z.infer<typeof PublicMemberListItemZ>;
export interface MemberGridProps {
  items: ReadonlyArray<Item>;
  density: "comfy" | "dense";
}
export function MemberGrid({ items, density }: MemberGridProps): JSX.Element;
```

### `apps/web/src/components/public/MemberTable.tsx`

```tsx
export interface MemberTableProps { items: ReadonlyArray<Item> }
export function MemberTable({ items }: MemberTableProps): JSX.Element;
```

### `apps/web/src/components/public/MemberFilters.client.tsx`

```tsx
"use client";
export interface MemberFiltersProps { initial: MembersSearch; total: number }
export function MemberFilters(props: MemberFiltersProps): JSX.Element;
```

### `apps/web/src/components/public/DensityToggle.client.tsx`

```tsx
"use client";
export interface DensityToggleProps {
  value: "comfy" | "dense" | "list";
  onChange: (next: "comfy" | "dense" | "list") => void;
}
export function DensityToggle(props: DensityToggleProps): JSX.Element;
```

## データフロー / 副作用

| 種別 | 内容 |
| --- | --- |
| 入力 | URL `searchParams`（Server Component）/ Hono Worker からの JSON |
| 出力 | React tree、`router.replace("?...")` による URL 書換 |
| 副作用 | fetch（Workers binding または HTTP）、Server Component の revalidate（stats=60s / members=30s） |
| 失敗時挙動 | `FetchPublicError` → `error.tsx`（task-05）が boundary で catch、Sentry capture（task-04 logger 経由） |

## 上流依存の取り込み

| 上流 task | import | 用途 |
| --- | --- | --- |
| task-02 | `getEnv()` / `getPublicEnv()` from `@/lib/env` | `PUBLIC_API_BASE_URL` / Workers binding 解決 |
| task-04 | `logger` from `@/lib/logger` | 失敗時 logging（fetch wrapper 内） |
| task-08 | `var(--ubm-color-*)` / `var(--ubm-color-zone-{a..e})` | OKLch tokens 経由の color |
| task-09 | tailwind v4 token 経由 class | `bg-[var(--ubm-color-...)]` 経由は禁止、token 経由 class のみ |
| task-10 | `Button` / `Card` / `Badge` / `Input` / `Select` / `Avatar` / `EmptyState` / `Field` / `Stat` from `@/components/ui` | primitives のみ使用 |
| task-05 | `error.tsx` / `loading.tsx` の存在 | route boundary に依存 |

## 設計上の判断

| 論点 | 判断 | 理由 |
| --- | --- | --- |
| `lib/fetch/public.ts` を残すか `lib/api/public.ts` に統合するか | 新規 `lib/api/public.ts` は `lib/fetch/public.ts` の上に薄く乗せる | 既存テスト互換性維持 + Zod strict parse の集約 |
| density の正本 | URL query | F5 / share URL で復元 |
| tag pill の役割 | `role="switch" aria-checked` | toggle セマンティクスを ARIA で明示 |
| Hero のグラデ | `var(--ubm-color-accent)` 経由 | task-08 token のみ参照 |
| revalidate | stats=60 / members=30 | 無料枠運用 + 反映速度のバランス |
| caching 方針 | `dynamic = "force-dynamic"` は使わず、`connection()` で build-time prerender fetch を避け、`next.revalidate` / page-level `revalidate` を正本にする | `force-dynamic` と revalidate AC の矛盾、および API 未起動時の build prerender fetch を避けるため |

## 完了条件

- [ ] 変更対象ファイル表が原典 §0.3 / §2 と整合
- [ ] 関数シグネチャが Next.js v15 規約（`'use client'` / Server Component / `searchParams: Promise`）に準拠
- [ ] 上流 task の export のみで実装が完結する設計になっている
- [ ] 新 API endpoint 追加 / `apps/api` への変更が無いことを `git diff --name-only` で検証可能
