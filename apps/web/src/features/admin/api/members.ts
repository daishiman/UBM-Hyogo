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

// ---------------------------------------------------------------------------
// issue-1036 / task-B: bulk member tag assign/unassign の web client（不変条件 #13 第3経路）。
//   D1 直接アクセス禁止（不変条件 #1）。Next.js の /api/admin プロキシ経由で API worker を叩く。
//   mutation 実行は BulkActionBar 側で useAdminMutation 経由に配線するが、tag master read と
//   非 hook 再利用向けに raw helper も併せて export する。
// ---------------------------------------------------------------------------

export type BulkTagItemStatus =
  | "assigned"
  | "unassigned"
  | "noop"
  | "skipped_deleted"
  | "tag_not_found";

export type BulkTagResultItem = {
  memberId: string;
  tagId: string;
  status: BulkTagItemStatus;
};

export type BulkApplyMemberTagsResult = {
  batchId: string;
  results: BulkTagResultItem[];
};

/** bulk UI の tag picker 用 tag master read。`{ available }` を返す。 */
export async function fetchTagMaster(): Promise<{ available: AdminTagRef[] }> {
  const res = await fetch("/api/admin/tags", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as { available: AdminTagRef[] };
}

/** 複数 member × 複数 tag を一括 assign/unassign。部分失敗も 200 + results で返す。 */
export async function bulkApplyMemberTags(
  memberIds: string[],
  tagIds: string[],
  op: "assign" | "unassign",
): Promise<BulkApplyMemberTagsResult> {
  const res = await fetch("/api/admin/members/tags/bulk", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ memberIds, tagIds, op }),
    credentials: "same-origin",
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as BulkApplyMemberTagsResult;
}
