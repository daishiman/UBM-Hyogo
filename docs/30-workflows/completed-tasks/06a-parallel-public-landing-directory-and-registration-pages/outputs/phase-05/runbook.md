# runbook.md — 4 page 実装手順

## 前提

- `apps/web` には Next.js 16 (App Router) + `@opennextjs/cloudflare` を採用
- `apps/web/src/components/ui/` に UI primitives 15 種が配置済み（00 task 成果）
- `packages/shared/src/zod/viewmodel.ts` に `PublicStatsViewZ` / `PublicMemberListViewZ` / `PublicMemberProfileZ` / `FormPreviewViewZ` が export 済み（01b task 成果）
- `apps/api/src/routes/public/` に 4 endpoint が実装済み（04a task 成果）

## ステップ 1: layout.tsx

`apps/web/app/layout.tsx` は既存のものを利用（lang="ja", styles.css import 済み）。 (public) layout も既存。

## ステップ 2: `/` (Server Component)

```tsx
// apps/web/app/page.tsx (実装済み)
import { fetchPublic } from "../src/lib/fetch/public";
import { Hero, MemberCard, StatCard, Timeline } from "../src/components/public/*";

export const revalidate = 60;
export default async function HomePage() {
  const [stats, members] = await Promise.all([
    fetchPublic<PublicStatsView>("/public/stats", { revalidate: 60 }),
    fetchPublic<PublicMemberListView>("/public/members?limit=6", { revalidate: 60 }),
  ]);
  return /* Hero + StatCard + featured + Timeline + FAQ + CTA */;
}
```

## ステップ 3: `/members`

```tsx
// apps/web/app/(public)/members/page.tsx (実装済み)
import { parseSearchParams, toApiQuery } from "../../../src/lib/url/members-search";

export const revalidate = 30;
export default async function MembersPage({ searchParams }) {
  const sp = await searchParams;
  const search = parseSearchParams(sp);
  const apiQuery = toApiQuery(search).toString();
  const list = await fetchPublic<PublicMemberListView>(
    apiQuery ? `/public/members?${apiQuery}` : "/public/members"
  );
  return (
    <>
      <MembersFilterBar initial={search} />
      {list.items.length === 0 ? <EmptyState resetHref="/members" ... /> : <MemberList ... />}
    </>
  );
}
```

```tsx
// apps/web/app/(public)/members/_components/MembersFilterBar.client.tsx (実装済み)
"use client";
import { useRouter, useSearchParams } from "next/navigation";

export function MembersFilterBar({ initial }) {
  const router = useRouter();
  const sp = useSearchParams();
  const update = (patch) => {
    const next = new URLSearchParams(sp.toString());
    // patch を反映、tag は repeat、空値は delete
    router.replace(qs ? `/members?${qs}` : "/members"); // history 汚染回避 (Q1)
  };
  return /* Search + Select(zone) + Select(status) + Segmented(sort/density) + tag chips */;
}
```

## ステップ 4: `/members/[id]`

```tsx
// apps/web/app/(public)/members/[id]/page.tsx (実装済み)
import { notFound } from "next/navigation";
import { fetchPublicOrNotFound, FetchPublicNotFoundError } from "../../../../src/lib/fetch/public";

export const revalidate = 60;
export default async function MemberDetailPage({ params }) {
  const { id } = await params;
  let profile;
  try {
    profile = await fetchPublicOrNotFound<PublicMemberProfile>(
      `/public/members/${encodeURIComponent(id)}`
    );
  } catch (e) {
    if (e instanceof FetchPublicNotFoundError) notFound();
    throw e;
  }
  // KVList items は publicSections.fields.stableKey 経由のみ参照（不変条件 #1）
  return <ProfileHero ... /><KVList items={...} /><LinkPills links={...} />;
}
```

## ステップ 5: `/register`

```tsx
// apps/web/app/(public)/register/page.tsx (実装済み)
const FALLBACK_RESPONDER_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform";

export const revalidate = 600;
export default async function RegisterPage() {
  let preview = null;
  let responderUrl = FALLBACK_RESPONDER_URL;
  let previewError = null;
  try {
    preview = await fetchPublic<FormPreviewView>("/public/form-preview", { revalidate: 600 });
    responderUrl = preview.responderUrl ?? FALLBACK_RESPONDER_URL;
  } catch {
    previewError = "フォーム情報を取得できませんでした…"; // F-08
  }
  return (
    <>
      <a href={responderUrl} target="_blank" rel="noopener noreferrer"><Button>...</Button></a>
      {preview ? <FormPreviewSections preview={preview} /> : null}
    </>
  );
}
```

## ステップ 6: ESLint custom rule（placeholder）

```js
// apps/web/.eslintrc.* (placeholder; 後続 Phase で監修)
{
  rules: {
    "no-restricted-globals": ["error", { name: "UBM", message: "window.UBM 禁止 (不変条件 #6)" }],
    "no-restricted-syntax": [
      "error",
      {
        selector: "Literal[value=/^[0-9a-fA-F]{20,}$/]",
        message: "questionId 直書き禁止。stableKey を使え (不変条件 #1, AC-8)",
      },
      {
        selector: "MemberExpression[object.name='localStorage']",
        message: "localStorage を route/session/data の正本にしない (不変条件 #8, AC-9)",
      },
    ],
  },
}
```

## ステップ 7: sanity check

| # | 手順 | 期待 | 結果 |
| --- | --- | --- | --- |
| S-01 | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | error 0 | PASS |
| S-02 | `mise exec -- pnpm vitest run apps/web/src/lib/url/__tests__/members-search.test.ts` | 10 passed | PASS |
| S-03 | `pnpm dev` 起動後 `curl localhost:3000/` | 200 | Phase 11 (ローカル smoke 必要) |
| S-04 | `curl localhost:3000/members?density=dense` | 200 | Phase 11 |
| S-05 | `curl localhost:3000/members/UNKNOWN` | 404 | Phase 11 |
| S-06 | `grep -r "window.UBM" apps/web` | 0 件 | Phase 9 で評価 |
| S-07 | `grep -r "no-access" apps/web/app` | 0 件 | Phase 9 で評価 |

## 不変条件への対応

- #1: `MemberDetailPage` で stableKey 経由の KVList、questionId 文字列を直書きしない
- #5: `fetchPublic` が apps/api 経由のみ
- #6: `window.UBM` 参照ゼロ（grep 確認）
- #8: density / sort / tag / q / zone / status を URL query 正本（zod schema で fallback 制御）
- #9: `/no-access` ルートを作らない
- #10: revalidate 30〜600s で apps/api 呼び出しを抑制
