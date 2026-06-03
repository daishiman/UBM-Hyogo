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

// ---------------------------------------------------------------------------
// issue-1068 / task-A: drawer 内 inline tag 作成（tag master write）の web client。
//   利用する API: POST /api/admin/tags { code, label, category }
//     → 201 { tagId, code, label, category, active }
//     → 400 invalid_json / invalid_body、409 tag_code_conflict
//     → error body は { ok:false, error:"<code>" }（apps/api 側 fail(c, code)）。
//   apps/api は変更しない（既存 endpoint surface の利用のみ・不変条件 #7）。
//   実 mutation 発火は MemberTagInlineCreate（task-B）が useAdminMutation 経由で行うが、
//   error code 検出には parseTagErrorCode を両経路で共用する。
// ---------------------------------------------------------------------------

/** 既知の create error code（POST /admin/tags の fail() が返す code）。 */
export type AdminTagCreateErrorCode =
  | "tag_code_conflict"
  | "invalid_body"
  | "invalid_json";

const KNOWN_TAG_CREATE_ERROR_CODES: readonly AdminTagCreateErrorCode[] = [
  "tag_code_conflict",
  "invalid_body",
  "invalid_json",
];

/** createTag が !res.ok 時に throw する error。検出した code（不明なら null）と HTTP status を載せる。 */
export class TagCreateError extends Error {
  readonly status: number;
  readonly code: AdminTagCreateErrorCode | null;
  readonly bodyText: string;
  constructor(status: number, code: AdminTagCreateErrorCode | null, bodyText: string) {
    super(`createTag failed: HTTP ${status}${code ? ` (${code})` : ""}`);
    this.name = "TagCreateError";
    this.status = status;
    this.code = code;
    this.bodyText = bodyText;
  }
}

/**
 * FetchAuthedError.bodyText（{ ok:false, error:"<code>" } の JSON 文字列）から
 * 既知 create error code を取り出す。不正 JSON / 未知 code / error 欠落 / 非オブジェクトは null。
 */
export function parseTagErrorCode(bodyText: string): AdminTagCreateErrorCode | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(bodyText);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const code = (parsed as { error?: unknown }).error;
  return KNOWN_TAG_CREATE_ERROR_CODES.includes(code as AdminTagCreateErrorCode)
    ? (code as AdminTagCreateErrorCode)
    : null;
}

/**
 * POST /api/admin/tags の raw helper（fetch 直叩き・非 hook 再利用 / テスト向け）。
 * 201 で AdminTagRef を返す（戻り値は付与判定で不要な `active` を除いた 4 項目に絞る）。
 * !res.ok 時は parseTagErrorCode で検出した code を載せた TagCreateError を throw する
 * （code が null=不明でも throw）。
 */
export async function createTag(input: {
  code: string;
  label: string;
  category: string;
}): Promise<AdminTagRef> {
  const res = await fetch("/api/admin/tags", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
    credentials: "same-origin",
  });
  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw new TagCreateError(res.status, parseTagErrorCode(bodyText), bodyText);
  }
  const json = (await res.json()) as AdminTagRef & { active?: number };
  return {
    tagId: json.tagId,
    code: json.code,
    label: json.label,
    category: json.category,
  };
}
