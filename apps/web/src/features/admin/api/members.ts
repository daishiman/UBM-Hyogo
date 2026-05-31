// issue-982 / task-B: member tag 編集の web API client。
//   D1 直接アクセス禁止（不変条件 #1）。Next.js の /api/admin プロキシ経由で API worker を叩く。
//   POST/DELETE の mutation は MemberDrawer 側で useAdminMutation 経由に配線するが、
//   非 hook な呼び出し（テスト・将来の再利用）向けに raw helper も併せて export する。

export type AdminTagRef = {
  tagId: string;
  code: string;
  label: string;
  category: string;
};

export type MemberTagsResult = {
  assigned: AdminTagRef[];
  available: AdminTagRef[];
};

const memberTagsPath = (memberId: string): string =>
  `/api/admin/members/${encodeURIComponent(memberId)}/tags`;

/** drawer open 時の GET。`{ assigned, available }` を返す。 */
export async function fetchMemberTags(memberId: string): Promise<MemberTagsResult> {
  const res = await fetch(memberTagsPath(memberId), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as MemberTagsResult;
}

/** tag を付与する（冪等）。更新後の `{ assigned, available }` を返す。 */
export async function assignMemberTag(
  memberId: string,
  tagId: string,
): Promise<MemberTagsResult> {
  const res = await fetch(memberTagsPath(memberId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ tagId }),
    credentials: "same-origin",
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as MemberTagsResult;
}

/** tag を解除する（未存在でも 204 で冪等）。 */
export async function unassignMemberTag(
  memberId: string,
  tagId: string,
): Promise<void> {
  const res = await fetch(
    `${memberTagsPath(memberId)}/${encodeURIComponent(tagId)}`,
    { method: "DELETE", credentials: "same-origin" },
  );
  // 204（成功）/ 404（既に無い = 冪等成功扱い）は throw しない
  if (!res.ok && res.status !== 404) {
    throw new Error(`HTTP ${res.status}`);
  }
}
