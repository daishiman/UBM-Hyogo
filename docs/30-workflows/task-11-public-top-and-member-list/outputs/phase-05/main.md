# Phase 5: 実装ランブック

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 5 |
| task | task-11-public-top-and-member-list |
| state | implemented-local / implementation / VISUAL_ON_EXECUTION |

## 目的

「後続実装者がそのまま手を動かせる」粒度で、Phase 2 の設計を実装手順に落とす。

## 実行タスク

- [ ] Step 0〜8 を順序通りに実装する
- [ ] runtime evidence は user-gated。Phase 11 まで PASS 化しない

## 参照資料

- Phase 2（変更対象 / シグネチャ）/ Phase 4（テスト ID）
- 一次原典 §3 / §6
- `docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx`

## 成果物

- `outputs/phase-05/main.md`

## 統合テスト連携

- 本 runbook の Step 5/6/7/8 を Phase 9/11 の検証コマンドへ接続する。
- 実装後は focused Vitest、Playwright smoke、grep gate、build を同一 evidence path に保存する。

## 実装手順（順序厳守）

### Step 0: 既存 caller の grep（書き換え影響範囲確認）

```bash
rg -n "from '@/components/public/Hero'" apps/web
rg -n "from '@/components/public/MemberCard'" apps/web
rg -n "from '@/components/public/Timeline'" apps/web
rg -n "from '@/lib/url/members-search'" apps/web
rg -n "from '@/lib/fetch/public'" apps/web
```

期待: 既存 caller を Phase 2 の新シグネチャと整合させる。Breaking change は本 task 内で吸収する（caller 側も書き換える）。

### Step 1: `lib/url/members-search.ts` 拡張（M）

Phase 2 §関数シグネチャの `MembersSearchZ` / `parseSearchParams` / `toApiQuery` を実装。既存 export のシグネチャと衝突する場合は本 task で書き換える。

### Step 2: `lib/api/public.ts` 新設（C）

```ts
// apps/web/src/lib/api/public.ts
import {
  PublicStatsViewZ,
  PublicMemberListViewZ,
  PublicMemberProfileZ,
  FormPreviewViewZ,
} from "@ubm-hyogo/shared";
import { fetchPublic } from "@/lib/fetch/public";
import { toApiQuery, type MembersSearch } from "@/lib/url/members-search";

type FetchOpts = { revalidate?: number };

export class FetchPublicError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}
export class FetchPublicNotFoundError extends FetchPublicError {}

const DEFAULTS = MembersSearchZ.parse({});

export async function getStats(opts: FetchOpts = {}) {
  const json = await fetchPublic("/public/stats", { next: { revalidate: opts.revalidate ?? 60 } });
  return PublicStatsViewZ.parse（strict 定義済み schema）(json);
}

export async function listMembers(search: Partial<MembersSearch>, opts: FetchOpts = {}) {
  const qs = toApiQuery({ ...DEFAULTS, ...search });
  const json = await fetchPublic(`/public/members?${qs.toString()}`, {
    next: { revalidate: opts.revalidate ?? 30 },
  });
  return PublicMemberListViewZ.parse（strict 定義済み schema）(json);
}

export async function getMemberProfile(id: string, opts: FetchOpts = {}) {
  const json = await fetchPublic(`/public/members/${encodeURIComponent(id)}`, {
    next: { revalidate: opts.revalidate ?? 30 },
  });
  return PublicMemberProfileZ.parse（strict 定義済み schema）(json);
}

export async function getFormPreview(opts: FetchOpts = {}) {
  const json = await fetchPublic(`/public/form-preview`, { next: { revalidate: opts.revalidate ?? 60 } });
  return FormPreviewViewZ.parse（strict 定義済み schema）(json);
}
```

`fetchPublic` 内部で 404 時に `FetchPublicNotFoundError`、500 時に `FetchPublicError` を throw する。既存実装が type 互換ならそのまま利用し、互換でなければ本 task 内で揃える。

### Step 3: 公開 components 新設・拡張

#### 3-1. `Hero.tsx`（M）

```tsx
// apps/web/src/components/public/Hero.tsx
import Link from "next/link";

export interface HeroCta { label: string; href: string }
export interface HeroProps {
  eyebrow?: string;
  title: string;
  description: string;
  primaryCta: HeroCta;
  secondaryCta?: HeroCta;
}

export function Hero({ eyebrow, title, description, primaryCta, secondaryCta }: HeroProps) {
  return (
    <section
      data-component="hero"
      className="rounded-[var(--ubm-radius-lg)] bg-[var(--ubm-color-accent)] px-[var(--ubm-spacing-9)] py-[var(--ubm-spacing-9)]"
    >
      {eyebrow && <p className="text-xs uppercase tracking-widest">{eyebrow}</p>}
      <h1 className="mt-2 text-[var(--ubm-typography-display-1)] font-semibold">{title}</h1>
      <p className="mt-3 text-base">{description}</p>
      <div data-role="cta-row" className="mt-6 flex flex-wrap gap-3">
        <Link href={primaryCta.href} className="rounded-md bg-[var(--ubm-color-primary)] px-4 py-2 text-sm text-[var(--ubm-color-on-primary)]">
          {primaryCta.label}
        </Link>
        {secondaryCta && (
          <Link href={secondaryCta.href} className="rounded-md border border-[var(--ubm-color-border)] px-4 py-2 text-sm">
            {secondaryCta.label}
          </Link>
        )}
      </div>
    </section>
  );
}
```

#### 3-2. `Stats.tsx`（C）

```tsx
// apps/web/src/components/public/Stats.tsx
import type { z } from "zod";
import { PublicStatsViewZ } from "@ubm-hyogo/shared";

type PublicStatsView = z.infer<typeof PublicStatsViewZ>;
export interface StatsProps { stats: PublicStatsView }

export function Stats({ stats }: StatsProps) {
  const lastSync = stats.lastSync.responseSync ?? "未同期";
  return (
    <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <article data-stat="total"><h3>総会員</h3><p>{stats.memberCount}</p></article>
      <article data-stat="public"><h3>公開中</h3><p>{stats.publicMemberCount}</p></article>
      <article data-stat="zones">
        <h3>Zone 内訳</h3>
        <ul>{stats.zoneBreakdown.map((z) => <li key={z.zone}>{z.zone}: {z.count}</li>)}</ul>
      </article>
      <article data-stat="sync"><h3>Last sync</h3><p>{String(lastSync)}</p></article>
    </section>
  );
}
```

#### 3-3. `ZoneIntro.tsx`（C）

3 枚カード（0→1 / 1→10 / 10→100）。token `var(--ubm-color-zone-a/b/c)`。

#### 3-4. `Timeline.tsx`（M）

```tsx
import { EmptyState } from "@/components/ui";

export interface TimelineEntry { sessionId: string; title: string; heldOn: string }
export interface TimelineProps { entries: ReadonlyArray<TimelineEntry> }

export function Timeline({ entries }: TimelineProps) {
  if (entries.length === 0) {
    return <EmptyState title="直近の支部会記録はありません" />;
  }
  const sorted = [...entries].sort((a, b) => b.heldOn.localeCompare(a.heldOn));
  return (
    <ol className="space-y-3">
      {sorted.map((e) => (
        <li key={e.sessionId}>
          <time dateTime={e.heldOn}>{new Date(e.heldOn).toLocaleDateString("ja-JP")}</time>
          <p>{e.title}</p>
        </li>
      ))}
    </ol>
  );
}
```

#### 3-5. `MemberCard.tsx`（M） / `MemberGrid.tsx`（C） / `MemberTable.tsx`（C）

Phase 2 §関数シグネチャ通り。`MemberCard` / `MemberGrid` は density=comfy=`grid-cols-3`、dense=`grid-cols-4` のみ担当する。density=list は `MemberTable` が `<table>` を担当し、`MemberCard` の list variant は作らない。

#### 3-6. `MemberFilters.client.tsx`（C）

```tsx
"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toApiQuery, type MembersSearch } from "@/lib/url/members-search";
import { DensityToggle } from "./DensityToggle.client";

export interface MemberFiltersProps { initial: MembersSearch; total: number }

export function MemberFilters({ initial, total }: MemberFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<MembersSearch>(initial);
  const [, startTransition] = useTransition();

  const apply = (next: MembersSearch) => {
    setState(next);
    startTransition(() => {
      const qs = toApiQuery(next);
      router.replace(`${pathname}?${qs.toString()}`, { scroll: false });
    });
  };

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); apply(state); }}
      role="search"
      aria-label="メンバー検索"
    >
      {/* q / zone / status / sort / tag pills / density toggle / clear button */}
    </form>
  );
}
```

#### 3-7. `DensityToggle.client.tsx`（C）

```tsx
"use client";
const VALUES = ["comfy", "dense", "list"] as const;
type Value = (typeof VALUES)[number];

export function DensityToggle({ value, onChange }: { value: Value; onChange: (v: Value) => void }) {
  return (
    <div role="radiogroup" aria-label="表示密度">
      {VALUES.map((v) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
```

#### 3-8. `PublicHeader.tsx` / `PublicFooter.tsx`（C）

logo + nav（メンバー / 登録 / ログイン）/ legal リンク（`/privacy`, `/terms`）。token 経由 class のみ。

### Step 4: pages 書き換え

#### 4-1. `apps/web/app/(public)/layout.tsx`（M）

```tsx
import { ReactNode } from "react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PublicHeader />
      <div data-region="public-content" className="container mx-auto px-4 py-8">
        {children}
      </div>
      <PublicFooter />
    </>
  );
}
```

#### 4-2. `apps/web/app/page.tsx`（M）

原典 §3.1.1 通り。`Promise.all([getStats({ revalidate: 60 }), listMembers({ limit: 6, sort: "recent" }, { revalidate: 60 })])`。

#### 4-3. `apps/web/app/(public)/members/page.tsx`（M）

原典 §3.2.1 通り。`searchParams: Promise<...>` を `await` し、`parseSearchParams` → `listMembers`。

### Step 5: 単体テスト reify

Phase 4 の TC-U-S/A/H/ST/MC を vitest に reify。`@testing-library/react` の `render` / `screen` / `userEvent` を使用。

### Step 6: Playwright spec reify

`apps/web/playwright/tests/public-top-and-list.spec.ts` に Phase 4 §E2E smoke の TC-E-01〜05 を reify。

```ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("TC-E-01 / 公開トップ", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator('[data-stat="total"]')).toBeVisible();
  const a = await new AxeBuilder({ page }).analyze();
  expect(a.violations.filter((v) => v.impact === "critical")).toHaveLength(0);
});
// ... TC-E-02..05
```

### Step 7: token grep gate（local 自己検査）

```bash
! rg -n '#[0-9a-fA-F]{3,8}' apps/web/src/components/public apps/web/app/page.tsx apps/web/app/\(public\)
! rg -n 'bg-\[#|text-\[#' apps/web/src/components/public apps/web/app/page.tsx apps/web/app/\(public\)
! rg -n 'D1Database' apps/web
```

### Step 8: build / typecheck / lint

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web build
```

## 検証コマンド

```bash
# 単体テスト
mise exec -- pnpm --filter @ubm-hyogo/web test src/components/public src/lib/url src/lib/api/public

# 型チェック / lint / build
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web build

# Playwright（local dev server 起動状態で）
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright install --with-deps chromium
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/public-top-and-list.spec.ts
```

## テスト常時実行可能性 DoD

| 項目 | 固定値 |
| --- | --- |
| 対象 spec | `apps/web/playwright/tests/public-top-and-list.spec.ts` |
| 1 行実行コマンド | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/public-top-and-list.spec.ts` |
| browser binary 自動 install | 実装サイクルで `apps/web/package.json` script または CI step に `pnpm exec playwright install --with-deps chromium` を固定 |
| dev server 自動起動 | Playwright config の `webServer` で `pnpm --filter @ubm-hyogo/web dev` を立ち上げる |
| CI gate | 実装サイクルで `.github/workflows` の existing E2E gate に `playwright/tests/public-top-and-list.spec.ts` を含める |
| un-skip | spec で `test.describe.skip` / `test.skip(true)` / `it.skip` 禁止 |
| E2E coverage | `coverage/e2e/coverage-summary.json` の total と task-touched modules の `lines.pct >= 80` |

## 完了条件

- [ ] Step 0〜8 のファイル変更が全て完了
- [ ] Phase 4 のテストが pass（local）
- [ ] `pnpm --filter @ubm-hyogo/web build` が pass
- [ ] grep gate（HEX / D1Database / `process.env` 直参照）が exit 0
