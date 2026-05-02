// 06b: /profile Server Component（read-only）。
// 不変条件 #4: profile body の編集 form / submit button は描画しない。
// 06b-B の自己申請 button は本文編集ではなく admin queue への request 作成だけを行う。
// 不変条件 #5: D1 直接禁止。`fetchAuthed` 経由で API Worker を叩く。
// 不変条件 #7: session.memberId のみ参照。responseId は API レスポンス内のみ使用。

import { notFound, redirect } from "next/navigation";
import type {
  MeProfileResponse,
  MeSessionResponse,
} from "../../src/lib/api/me-types";
import {
  AuthRequiredError,
  FetchAuthedError,
  fetchAuthed,
} from "../../src/lib/fetch/authed";
import { StatusSummary } from "./_components/StatusSummary";
import { ProfileFields } from "./_components/ProfileFields";
import { EditCta } from "./_components/EditCta";
import { AttendanceList } from "./_components/AttendanceList";
import { VisibilityRequest } from "./_components/VisibilityRequest.client";
import { DeleteRequest } from "./_components/DeleteRequest.client";

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

  return (
    <main>
      <h1>マイページ</h1>
      <StatusSummary
        statusSummary={statusSummary}
        authGateState={me.authGateState}
      />
      <ProfileFields sections={profile.sections} />
      <EditCta
        editResponseUrl={editResponseUrl}
        fallbackResponderUrl={fallbackResponderUrl}
      />
      <VisibilityRequest
        publishState={statusSummary.publishState}
        disabled={me.authGateState !== "active"}
      />
      <DeleteRequest disabled={me.authGateState !== "active"} />
      <AttendanceList attendance={profile.attendance} />
    </main>
  );
}
