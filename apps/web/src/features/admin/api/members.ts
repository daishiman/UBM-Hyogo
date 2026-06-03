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

export const TAG_PAGE_SIZE_MAX = 100;

type TagMasterApiResponse = {
  total?: number;
  items?: AdminTagRef[];
};

export type TagMasterPage = {
  available: AdminTagRef[];
  total: number;
};

export type FetchTagMasterOptions = {
  q?: string;
  page?: number;
  pageSize?: number;
};

export type TagMasterFullResult = {
  available: AdminTagRef[];
  total: number;
  truncated: boolean;
};

const tagMasterPath = (opts: FetchTagMasterOptions = {}): string => {
  const params = new URLSearchParams();
  const q = opts.q?.trim();
  if (q) params.set("q", q);
  params.set("page", String(opts.page ?? 1));
  params.set("pageSize", String(opts.pageSize ?? TAG_PAGE_SIZE_MAX));
  return `/api/admin/tags?${params.toString()}`;
};

/** bulk UI の tag picker 用 tag master read。API `{ total, items }` を UI `{ available, total }` へ正規化する。 */
export async function fetchTagMaster(
  opts?: FetchTagMasterOptions,
): Promise<TagMasterPage> {
  const res = await fetch(tagMasterPath(opts), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const body = (await res.json()) as TagMasterApiResponse;
  const available = body.items ?? [];
  return {
    available,
    total: body.total ?? available.length,
  };
}

/** tag master を pageSize 上限で周回取得する。cap 超過時は truncated=true。 */
export async function fetchAllTagMaster(
  cap = 500,
): Promise<TagMasterFullResult> {
  const pageSize = TAG_PAGE_SIZE_MAX;
  const available: AdminTagRef[] = [];
  let page = 1;
  let total = 0;
  let truncated = false;

  while (available.length < cap) {
    const current = await fetchTagMaster({ page, pageSize });
    total = current.total;
    available.push(...current.available);

    if (current.available.length < pageSize) break;
    page += 1;
  }

  if (available.length > cap) {
    available.length = cap;
    truncated = true;
  }

  if (total > available.length) truncated = true;

  return { available, total, truncated };
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
