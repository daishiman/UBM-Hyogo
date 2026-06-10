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
  fetchAuthed,
} from "@/lib/fetch/authed";
import { ProfileHeader } from "./_components/ProfileHeader";
import { PhotoUpload } from "./_components/PhotoUpload.client";
import { PublicConsentCallout } from "./_components/PublicConsentCallout";
import { StatusBanner } from "./_components/StatusSummary";
import { FORM_RESPONDER_URL } from "@/lib/constants/form";
import { ReflectionTimingNote } from "@/components/public/ReflectionTimingNote";
import { VisibilitySummary } from "./_components/VisibilitySummary";
import { ProfilePreview } from "./_components/ProfilePreview";
import { ProfileFields } from "./_components/ProfileFields";
import { EditCta } from "./_components/EditCta";
import { AttendanceList } from "./_components/AttendanceList";
import { RequestActionPanel } from "./_components/RequestActionPanel";
import { SectionError } from "@/components/member/SectionError";
import type { SafeResult } from "@/lib/result";
import { getStats } from "@/lib/api/public";
import { safeServerFetch } from "@/lib/server-fetch/safe-fetch";
import { pickProfileSummary } from "./_lib/profile-summary";
import { mapProfileSessionErrorToDisplay } from "./_lib/session-error-display";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProfilePage() {
  let meResult: SafeResult<MeSessionResponse>;
  try {
    meResult = await safeServerFetch(
      () => fetchAuthed<MeSessionResponse>("/me"),
      {
        codePrefix: "MEMBER_SESSION",
        logPath: "/me",
        rethrowOn: [AuthRequiredError],
      },
    );
  } catch (err) {
    if (err instanceof AuthRequiredError) {
      return redirect("/login?redirect=/profile");
    }
    throw err;
  }

  if (!meResult.ok) {
    const display = mapProfileSessionErrorToDisplay(meResult.error.code);
    const errorProps = {
      title: display.title,
      detail: display.detail,
      dataCause: display.dataCause,
      ...(display.retryHref ? { retryHref: display.retryHref } : {}),
      ...(display.actionHref ? { actionHref: display.actionHref } : {}),
      ...(display.actionLabel ? { actionLabel: display.actionLabel } : {}),
    };

    return (
      <main data-route="member" data-section-rhythm="comfortable">
        <SectionError {...errorProps} />
      </main>
    );
  }

  const me = meResult.data;

  let profileResult: SafeResult<MeProfileResponse>;
  let statsResult: SafeResult<Awaited<ReturnType<typeof getStats>>>;
  try {
    [profileResult, statsResult] = await Promise.all([
      safeServerFetch(
        () => fetchAuthed<MeProfileResponse>("/me/profile"),
        { codePrefix: "MEMBER_FETCH", rethrowOn: [AuthRequiredError] },
      ),
      safeServerFetch(
        () => getStats({ revalidate: 60 }),
        { codePrefix: "PUBLIC_STATS" },
      ),
    ]);
  } catch (err) {
    if (err instanceof AuthRequiredError) {
      return redirect("/login?redirect=/profile");
    }
    throw err;
  }

  if (!profileResult.ok) {
    if (profileResult.error.code === "MEMBER_FETCH_404") {
      notFound();
    }

    return (
      <main data-route="member" data-section-rhythm="comfortable">
        <ProfileHeader
          memberId={me.user.memberId}
          publishState="hidden"
          editResponseUrl={null}
          fallbackResponderUrl=""
        />
        <SectionError
          title="プロフィールを読み込めませんでした"
          detail={profileResult.error.message}
          retryHref="/profile"
        />
      </main>
    );
  }

  const profileRes = profileResult.data;
  const { profile, statusSummary, editResponseUrl, fallbackResponderUrl } =
    profileRes;
  const summary = pickProfileSummary(profile.sections);

  return (
    <div data-testid="profile-authenticated-root">
      <ProfileHeader
        memberId={me.user.memberId}
        publishState={statusSummary.publishState}
        editResponseUrl={editResponseUrl}
        fallbackResponderUrl={fallbackResponderUrl}
      />
      <PhotoUpload
        memberId={me.user.memberId}
        name={summary.displayName}
        photoUrl={profileRes.photoUrl}
      />
      <StatusBanner
        statusSummary={statusSummary}
        authGateState={me.authGateState}
      />
      <PublicConsentCallout
        publicConsent={statusSummary.publicConsent}
        editResponseUrl={editResponseUrl}
        responderUrl={FORM_RESPONDER_URL}
      />
      <ReflectionTimingNote
        surface="profile"
        lastSyncAt={
          statsResult.ok ? statsResult.data.lastSync.responseSyncFinishedAt : null
        }
        statsUnavailable={!statsResult.ok}
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
    </div>
  );
}
