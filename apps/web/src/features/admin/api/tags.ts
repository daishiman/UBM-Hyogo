import {
  fetchTagMaster,
  type AdminTagRef,
  parseTagErrorCode,
  TagCreateError,
  type FetchTagMasterOptions,
  type TagMasterPage,
} from "./members";
import { AuthRequiredError } from "../../../lib/fetch/errors";
import type { TagDefinitionItem } from "../../../components/admin/tagCatalogLifecycle";

export type { AdminTagRef, FetchTagMasterOptions, TagMasterPage };
export { TagCreateError, parseTagErrorCode };

export type AdminTagCreateInput = {
  readonly code: string;
  readonly label: string;
  readonly category: string;
};

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

export async function createTag(input: AdminTagCreateInput): Promise<TagDefinitionItem> {
  const res = await fetch("/api/admin/tags", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
    credentials: "same-origin",
  });
  if (res.status === 401) {
    throw new AuthRequiredError();
  }
  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw new TagCreateError(res.status, parseTagErrorCode(bodyText), bodyText);
  }
  const json = (await res.json()) as AdminTagRef & { active?: boolean | number };
  return {
    tagId: json.tagId,
    code: json.code,
    label: json.label,
    category: json.category,
    active:
      typeof json.active === "boolean"
        ? json.active
        : typeof json.active === "number"
          ? json.active !== 0
          : true,
  };
}

export { fetchTagMaster };
