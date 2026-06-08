import {
  fetchTagMaster,
  type AdminTagRef,
  type FetchTagMasterOptions,
  type TagMasterPage,
} from "./members";
import { AuthRequiredError } from "../../../lib/fetch/errors";

export type { AdminTagRef, FetchTagMasterOptions, TagMasterPage };

export type AdminTagUpdateInput = {
  readonly code?: string;
  readonly label?: string;
  readonly category?: string;
  readonly expectedCode?: string;
};

export type AdminTagUpdateErrorCode =
  | "tag_code_conflict"
  | "tag_stale_conflict"
  | "tag_not_found"
  | "no_update_fields"
  | "invalid_body"
  | "invalid_json";

const KNOWN_TAG_UPDATE_ERROR_CODES: readonly AdminTagUpdateErrorCode[] = [
  "tag_code_conflict",
  "tag_stale_conflict",
  "tag_not_found",
  "no_update_fields",
  "invalid_body",
  "invalid_json",
];

export class TagUpdateError extends Error {
  readonly status: number;
  readonly code: AdminTagUpdateErrorCode | null;
  readonly bodyText: string;

  constructor(status: number, code: AdminTagUpdateErrorCode | null, bodyText: string) {
    super(`updateTag failed: HTTP ${status}${code ? ` (${code})` : ""}`);
    this.name = "TagUpdateError";
    this.status = status;
    this.code = code;
    this.bodyText = bodyText;
  }
}

export function parseTagUpdateErrorCode(bodyText: string): AdminTagUpdateErrorCode | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(bodyText);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const code = (parsed as { error?: unknown }).error;
  return KNOWN_TAG_UPDATE_ERROR_CODES.includes(code as AdminTagUpdateErrorCode)
    ? (code as AdminTagUpdateErrorCode)
    : null;
}

export async function updateTag(
  tagId: string,
  input: AdminTagUpdateInput,
): Promise<AdminTagRef> {
  const res = await fetch(`/api/admin/tags/${encodeURIComponent(tagId)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
    credentials: "same-origin",
  });
  if (res.status === 401) {
    throw new AuthRequiredError();
  }
  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw new TagUpdateError(res.status, parseTagUpdateErrorCode(bodyText), bodyText);
  }
  return (await res.json()) as AdminTagRef;
}

export { fetchTagMaster };
