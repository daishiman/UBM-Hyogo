// 06b: /profile Server Component（read-only）。
// 不変条件 #4: 編集 form / button は一切描画しない（CTA は外部 Google Form のみ）。
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
      <AttendanceList attendance={profile.attendance} />
    </main>
  );
}
