// workflow: mypage-prototype-alignment / Phase 5 / 統合
// 06b: /profile Server Component（read-only）。
// 不変条件 #4: 本文編集 UI は描画しない（申請 button は admin queue への依頼だけを作る）。
// 不変条件 #5: D1 直接禁止。`fetchAuthed` 経由で API Worker を叩く。
// 不変条件 #7: session.memberId のみ参照。responseId は API レスポンス内のみ使用。
// 旧 PublicVisibilityBanner / 旧 KVList 版 StatusSummary / 旧素リンク EditCta の live import は撤去。

import { notFound, redirect } from "next/navigation";
import type {
  MeProfileResponse,
  MeSessionResponse,
} from "@/lib/api/me-types";
import {
  AuthRequiredError,
  FetchAuthedError,
  fetchAuthed,
} from "@/lib/fetch/authed";
import { ProfileHeader } from "./_components/ProfileHeader";
import { StatusBanner } from "./_components/StatusSummary";
import { VisibilitySummary } from "./_components/VisibilitySummary";
import { ProfilePreview } from "./_components/ProfilePreview";
import { ProfileFields } from "./_components/ProfileFields";
import { EditCta } from "./_components/EditCta";
import { AttendanceList } from "./_components/AttendanceList";
import { RequestActionPanel } from "./_components/RequestActionPanel";
import { pickProfileSummary } from "./_lib/profile-summary";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProfilePage() {
  let me: MeSessionResponse;
  let profileRes: MeProfileResponse;
  try {
    [me, profileRes] = await Promise.all([
      fetchAuthed<MeSessionResponse>("/me"),
      fetchAuthed<MeProfileResponse>("/me/profile"),
    ]);
  } catch (err) {
    if (err instanceof AuthRequiredError) {
      redirect("/login?redirect=/profile");
    }
    if (err instanceof FetchAuthedError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  const { profile, statusSummary, editResponseUrl, fallbackResponderUrl } =
    profileRes;
  const summary = pickProfileSummary(profile.sections);

  return (
    <>
      <ProfileHeader
        memberId={me.user.memberId}
        publishState={statusSummary.publishState}
        editResponseUrl={editResponseUrl}
        fallbackResponderUrl={fallbackResponderUrl}
      />
      <StatusBanner
        statusSummary={statusSummary}
        authGateState={me.authGateState}
      />
      <VisibilitySummary sections={profile.sections} />
      <ProfilePreview
        memberId={me.user.memberId}
        displayName={summary.displayName}
        subtitle={summary.subtitle}
        chips={summary.chips}
      />
      <ProfileFields sections={profile.sections} />
      <EditCta
        editResponseUrl={editResponseUrl}
        fallbackResponderUrl={fallbackResponderUrl}
        variant="inline"
      />
      <RequestActionPanel
        publishState={statusSummary.publishState}
        rulesConsent={statusSummary.rulesConsent}
        pendingRequests={profileRes.pendingRequests}
      />
      <AttendanceList
        attendance={profile.attendance}
        attendanceMeta={profile.attendanceMeta}
      />
    </>
  );
}
