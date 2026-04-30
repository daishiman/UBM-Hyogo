// 07b: alias 候補推奨サービス
// 不変条件 #1: stable_key はコードに固定しない（schema_questions row 経由）
// 不変条件 #14: schema 変更は /admin/schema 集約

export interface RecommendDiffInput {
  label: string;
  sectionKey: string | null;
  position: number | null;
}

export interface RecommendExistingInput {
  stableKey: string;
  label: string;
  sectionKey: string;
  position: number;
}

/**
 * Levenshtein distance (DP, 標準)
 */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;
  // 1 行 DP
  let prev = new Array<number>(bl + 1);
  let curr = new Array<number>(bl + 1);
  for (let j = 0; j <= bl; j++) prev[j] = j;
  for (let i = 1; i <= al; i++) {
    curr[0] = i;
    for (let j = 1; j <= bl; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + cost,
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[bl] ?? 0;
}

/**
 * alias 候補をスコア順上位 topN 件で返す。
 * スコア = -levenshtein(label) + (sectionKey 一致 ? 10 : 0) + (position 一致 ? 5 : 0)
 */
export function recommendAliases(
  diff: RecommendDiffInput,
  existing: ReadonlyArray<RecommendExistingInput>,
  topN = 5,
): string[] {
  if (existing.length === 0) return [];
  const scored = existing.map((e) => ({
    stableKey: e.stableKey,
    score:
      -levenshtein(diff.label, e.label) +
      (diff.sectionKey !== null && e.sectionKey === diff.sectionKey ? 10 : 0) +
      (diff.position !== null && e.position === diff.position ? 5 : 0),
  }));
  scored.sort((a, b) => b.score - a.score);
  // 重複 stableKey を除外しつつ上位 topN
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of scored) {
    if (seen.has(s.stableKey)) continue;
    seen.add(s.stableKey);
    out.push(s.stableKey);
    if (out.length >= topN) break;
  }
  return out;
}
