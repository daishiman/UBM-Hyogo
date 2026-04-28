// Phase 5: schema-hash.ts
// items を itemId 昇順に正規化してから JSON 化し、SHA-256 (hex) を取る。
// Phase 3 R-8: items 並び順変動による hash 揺れを防ぐ。
import type { FlatQuestion } from "./types";

const toHex = (buf: ArrayBuffer): string => {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += b.toString(16).padStart(2, "0");
  return s;
};

/**
 * FlatQuestion[] の安定 SHA-256 (hex)。
 * - itemId 未設定の場合は questionId を fallback key に使う。
 * - 並び順は (itemId|questionId) 昇順で正規化する。
 */
export async function schemaHash(items: readonly FlatQuestion[]): Promise<string> {
  const normalized = [...items]
    .map((q) => ({
      key: q.itemId ?? q.questionId,
      questionId: q.questionId,
      itemId: q.itemId,
      title: q.title,
      kind: q.kind,
      options: q.options,
      sectionIndex: q.sectionIndex,
      required: q.required,
    }))
    .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  const json = JSON.stringify(normalized);
  const enc = new TextEncoder().encode(json);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return toHex(buf);
}
