import { escapeBranch } from "./branch-escape.js";

export type FragmentType = "log" | "changelog" | "lessons-learned";

const TYPE_TO_DIR: Record<FragmentType, string> = {
  log: "LOGS",
  changelog: "changelog",
  "lessons-learned": "lessons-learned",
};

export const FRAGMENT_NAME_REGEX =
  /^(LOGS|changelog|lessons-learned)\/[0-9]{8}-[0-9]{6}-[a-z0-9_-]+-[a-f0-9]{8}\.md$/;

export const PATH_BYTE_LIMIT = 240;

export interface FragmentPathInput {
  type: FragmentType;
  timestampCompact: string; // YYYYMMDD-HHMMSS
  branch: string;
  nonce: string; // 8 hex
}

export function isFragmentType(type: string): type is FragmentType {
  return Object.prototype.hasOwnProperty.call(TYPE_TO_DIR, type);
}

export function dirForType(type: FragmentType): string {
  if (!isFragmentType(type)) {
    throw new Error(`invalid fragment type: ${type}`);
  }
  return TYPE_TO_DIR[type];
}

export function buildFragmentRelPath(input: FragmentPathInput): string {
  const dir = dirForType(input.type);
  const branchEsc = escapeBranch(input.branch);
  return `${dir}/${input.timestampCompact}-${branchEsc}-${input.nonce}.md`;
}

export function isWithinPathByteLimit(absPath: string): boolean {
  return Buffer.byteLength(absPath, "utf8") <= PATH_BYTE_LIMIT;
}

export function isFragmentName(rel: string): boolean {
  return FRAGMENT_NAME_REGEX.test(rel);
}
