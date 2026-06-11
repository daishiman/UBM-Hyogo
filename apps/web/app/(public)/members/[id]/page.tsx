// serial-06-form-response-binding: /(public)/members/[id]
// - serial-05 で配線した page skeleton に adapter + MemberDetail composing primitive を接続
// - 既存 fetchPublicOrNotFound 経由 (不変条件 #5: web から D1 直接禁止)
// - visibility filter は adapter の二重防御 (正本は API 側 getPublicMemberProfileUseCase)
// Lane B: PageShell + PageHeader(lead=戻る導線) でラップ。
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MemberDetail } from "../../../../src/components/public/MemberDetail";
import { SectionError } from "../../../../src/components/public/SectionError";
import { PageHeader } from "../../../../src/components/ui/layout/PageHeader";
import { PageShell } from "../../../../src/components/ui/layout/PageShell";
import {
  PublicMemberProfileWithUnknownKindZ,
  toMemberDetailProps,
  type PublicMemberProfile,
} from "../../../../src/lib/adapters/member-detail";
import {
  FetchPublicNotFoundError,
  fetchPublicOrNotFound,
} from "../../../../src/lib/fetch/public";
import type { SafeResultError } from "../../../../src/lib/result";
import { safeServerFetch } from "../../../../src/lib/server-fetch/safe-fetch";
import {
  buildMemberOgImageUrl,
  buildPageMetadata,
} from "@/lib/seo/site-metadata";

export const dynamic = "force-dynamic";

const onUnknownKind =
  process.env.NODE_ENV === "development"
    ? (field: PublicMemberProfile["publicSections"][number]["fields"][number]) =>
        console.warn(
          "[member-detail] unknown kind",
          field.kind,
          field.stableKey,
        )
    : undefined;

interface MemberDetailPageProps {
  params: Promise<{ id: string }>;
}

type ProfileFetchResult =
  | { ok: true; data: PublicMemberProfile }
  | { ok: false; error: SafeResultError }
  | null;

async function fetchProfile(id: string): Promise<ProfileFetchResult> {
  try {
    const result = await safeServerFetch(
      () =>
        fetchPublicOrNotFound<unknown>(
          `/public/members/${encodeURIComponent(id)}`,
          { revalidate: 0 },
        ),
      {
        codePrefix: "PUBLIC_FETCH",
        rethrowOn: [FetchPublicNotFoundError],
      },
    );
    if (!result.ok) return result;
    // fail-close: zod parse 失敗時は error.tsx boundary で補足
    return { ok: true, data: PublicMemberProfileWithUnknownKindZ.parse(result.data) };
  } catch (e) {
    if (e instanceof FetchPublicNotFoundError) {
      return null;
    }
    throw e;
  }
}

export async function generateMetadata({
  params,
}: MemberDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const profileResult = await fetchProfile(id);
  if (!profileResult) {
    return buildPageMetadata({
      title: "メンバーが見つかりません",
      description:
        "指定された UBM 兵庫支部会メンバーは公開されていません",
      path: `/members/${id}`,
      ogImage: buildMemberOgImageUrl(id),
    });
  }
  if (!profileResult.ok) {
    return buildPageMetadata({
      title: "メンバー情報を読み込めません",
      description:
        "UBM 兵庫支部会メンバー情報の読み込みに失敗しました",
      path: `/members/${id}`,
      ogImage: buildMemberOgImageUrl(id),
    });
  }
  const profile = profileResult.data;
  const occ = profile.summary.occupation;
  return buildPageMetadata({
    title: profile.summary.fullName,
    description: `${profile.summary.fullName}${
      occ ? `(${occ})` : ""
    }の UBM 兵庫支部会プロフィール`,
    path: `/members/${id}`,
    ogImage: buildMemberOgImageUrl(id),
  });
}

export default async function MemberDetailPage({
  params,
}: MemberDetailPageProps) {
  const { id } = await params;
  const profileResult = await fetchProfile(id);
  if (!profileResult) {
    notFound();
  }
  if (!profileResult.ok) {
    return (
      <main data-route="public" data-section-rhythm="comfortable">
        <PageShell>
          <PageHeader
            title="メンバー詳細"
            lead={
              <a href="/members" data-role="back" className="back-link">
                ← メンバー一覧に戻る
              </a>
            }
          />
          <SectionError
            title="メンバー情報を読み込めませんでした"
            detail={profileResult.error.message}
            retryHref={`/members/${encodeURIComponent(id)}`}
          />
        </PageShell>
      </main>
    );
  }
  const props = toMemberDetailProps(profileResult.data, { onUnknownKind });
  return (
    <main data-route="public" data-section-rhythm="comfortable">
      <PageShell>
        <PageHeader
          title={profileResult.data.summary.fullName}
          lead={
            <a href="/members" data-role="back" className="back-link">
              ← メンバー一覧に戻る
            </a>
          }
        />
        <MemberDetail {...props} />
      </PageShell>
    </main>
  );
}
