// task-11: `/members` 公開メンバー一覧 (Server Component)
// AC-2 / AC-3 / AC-5 / AC-6 — searchParams を zod parse → listMembers 経由で取得
// 不変条件 #5: public API 経由のみ
// 不変条件 #8: density / sort / tag / q / zone / status は URL query 正本

import type { Metadata } from "next";
import { connection } from "next/server";

import { buildPageMetadata } from "@/lib/seo/site-metadata";

import { EmptyState } from "../../../src/components/feedback/EmptyState";
import { MemberFilters } from "../../../src/components/public/MemberFilters.client";
import { MemberGrid } from "../../../src/components/public/MemberGrid";
import { MemberTable } from "../../../src/components/public/MemberTable";
import {
  PUBLIC_API_REVALIDATE,
  listMembers,
} from "../../../src/lib/api/public";
import {
  parseSearchParams,
  type MembersSearch,
} from "../../../src/lib/url/members-search";

// members=30s revalidate (AC-9)
export const revalidate = 30;

export const metadata: Metadata = buildPageMetadata({
  title: "メンバー一覧",
  description:
    "UBM 兵庫支部会のメンバー紹介。職種・拠点・関心領域から探せます",
  path: "/members",
});

interface MembersPageProps {
  // Next.js 16 では searchParams は Promise になっている
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MembersPage({ searchParams }: MembersPageProps) {
  await connection();
  const sp = await searchParams;
  const search: MembersSearch = parseSearchParams(sp);
  const list = await listMembers(search, {
    revalidate: PUBLIC_API_REVALIDATE.members,
  });

  return (
    <main data-page="members" data-density={search.density}>
      <h1>メンバー一覧</h1>
      <MemberFilters initial={search} />
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
        {list.pagination.total} 件中 {list.items.length} 件表示
      </p>
    </main>
  );
}
