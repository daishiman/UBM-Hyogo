// serial-05: /(public)/members — blueprint 09e:208-338
// task-11: `/members` 公開メンバー一覧 (Server Component)
// AC-2 / AC-3 / AC-5 / AC-6 — searchParams を zod parse → listMembers 経由で取得
// 不変条件 #5: public API 経由のみ
// 不変条件 #8: density / sort / tag / q / zone / status は URL query 正本

import type { Metadata } from "next";
import { connection } from "next/server";

import { buildPageMetadata } from "@/lib/seo/site-metadata";

import { EmptyState } from "../../../src/components/feedback/EmptyState";
import { DensityToggle } from "../../../src/components/public/DensityToggle.client";
import { MemberFilters } from "../../../src/components/public/MemberFilters.client";
import { MemberGrid } from "../../../src/components/public/MemberGrid";
import { SectionError } from "../../../src/components/public/SectionError";
import {
  PUBLIC_API_REVALIDATE,
  listMembers,
} from "../../../src/lib/api/public";
import { safeServerFetch } from "../../../src/lib/server-fetch/safe-fetch";
import {
  parseSearchParams,
  type MembersSearch,
} from "../../../src/lib/url/members-search";

// members=30s revalidate (AC-9)
export const revalidate = 30;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "メンバー一覧",
    description:
      "UBM 兵庫支部会のメンバー紹介。職種・拠点・関心領域から探せます",
    path: "/members",
  });
}

interface MembersPageProps {
  // Next.js 16 では searchParams は Promise になっている
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MembersPage({ searchParams }: MembersPageProps) {
  await connection();
  const sp = await searchParams;
  const search: MembersSearch = parseSearchParams(sp);
  const listResult = await safeServerFetch(
    () =>
      listMembers(search, {
        revalidate: PUBLIC_API_REVALIDATE.members,
      }),
    { codePrefix: "PUBLIC_FETCH" },
  );

  return (
    <main
      data-page="members"
      data-density={search.density}
      data-route="public"
      data-section-rhythm="comfortable"
    >
      <header className="page-head">
        <div>
          <div className="eyebrow">MEMBERS</div>
          <h1>メンバー一覧</h1>
          <p data-role="lead">
            UBM 兵庫支部会のメンバー紹介。職種・拠点・関心領域から探せます。
          </p>
        </div>
        <DensityToggle value={search.density} />
      </header>
      <MemberFilters
        initial={search}
        topTags={listResult.ok ? listResult.data.topTags : []}
        totalCount={listResult.ok ? listResult.data.pagination.total : undefined}
        displayedCount={listResult.ok ? listResult.data.items.length : undefined}
      />
      {!listResult.ok ? (
        <SectionError
          title="メンバー一覧を読み込めませんでした"
          detail={listResult.error.message}
          retryHref="/members"
        />
      ) : listResult.data.items.length === 0 ? (
        <EmptyState
          title="該当するメンバーがいません"
          description="検索条件を変更するか、絞り込みをクリアしてください。"
          variant="compact"
          resetHref="/members"
        />
      ) : (
        <MemberGrid items={listResult.data.items} density={search.density} />
      )}
      <p data-role="pagination-meta" aria-hidden="true">
        {listResult.ok
          ? `${listResult.data.pagination.total} 件中 ${listResult.data.items.length} 件表示`
          : "メンバー件数を読み込めませんでした"}
      </p>
    </main>
  );
}
