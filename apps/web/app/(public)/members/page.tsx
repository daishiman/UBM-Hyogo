// `/members` 公開メンバー一覧 (Server Component)
// AC-3, AC-5, AC-6 — searchParams を zod parse → 04a へ渡す
// 不変条件 #5: public API 経由のみ
// 不変条件 #8: density / sort / tag / q / zone / status は URL query 正本

import type { z } from "zod";

import { PublicMemberListViewZ } from "@ubm-hyogo/shared";

import { EmptyState } from "../../../src/components/feedback/EmptyState";
import { fetchPublic } from "../../../src/lib/fetch/public";
import {
  parseSearchParams,
  toApiQuery,
  type MembersSearch,
} from "../../../src/lib/url/members-search";
import { MemberList } from "./_components/MemberList";
import { MembersFilterBar } from "./_components/MembersFilterBar.client";

type PublicMemberListView = z.infer<typeof PublicMemberListViewZ>;

export const dynamic = "force-dynamic";
export const revalidate = 30;

interface MembersPageProps {
  // Next.js 16 では searchParams は Promise になっている
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const sp = await searchParams;
  const search: MembersSearch = parseSearchParams(sp);
  const apiQuery = toApiQuery(search).toString();
  const path = apiQuery
    ? `/public/members?${apiQuery}`
    : "/public/members";

  const list = await fetchPublic<PublicMemberListView>(path, {
    revalidate: 30,
  });

  return (
    <main data-page="members">
      <h1>メンバー一覧</h1>
      <MembersFilterBar initial={search} />
      {list.items.length === 0 ? (
        <EmptyState
          title="該当するメンバーがいません"
          description="検索条件を変更するか、絞り込みをクリアしてください。"
          resetHref="/members"
        />
      ) : (
        <MemberList items={list.items} density={search.density} />
      )}
      <p data-role="pagination-meta">
        {list.pagination.total} 件中 {list.items.length} 件表示
      </p>
    </main>
  );
}
