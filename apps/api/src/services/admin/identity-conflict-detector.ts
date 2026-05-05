// issue-194-03b-followup-001-email-conflict-identity-merge
// 重複候補判定 helper（第一段階: name 完全一致 AND affiliation 完全一致）
//
// pure function として表現する。D1 直接参照しない（不変条件 #5）。

export type IdentitySnapshot = {
  memberId: string;
  name: string;
  affiliation: string;
};

export type EmailConflictRow = {
  sourceMemberId: string;
  name: string;
  affiliation: string;
};

export type ConflictCandidate = {
  sourceMemberId: string;
  candidateTargetMemberId: string;
  matchedFields: ("name" | "affiliation")[];
};

const norm = (s: string): string => s.trim().normalize("NFKC");
const keyOf = (name: string, affiliation: string): string =>
  `${norm(name)}\u0000${norm(affiliation)}`;

/**
 * 第一段階の重複候補判定:
 *   name 完全一致 AND affiliation 完全一致（trim + NFKC 正規化のみ許容）
 *
 * EMAIL_CONFLICT 起点 source の name/affiliation を、
 * 既存 identity の name/affiliation と完全一致で突き合わせる。
 *
 * 自己 (memberId 同一) は候補から除外する。
 */
export function detectConflictCandidates(
  emailConflictRows: readonly EmailConflictRow[],
  existingIdentities: readonly IdentitySnapshot[],
): ConflictCandidate[] {
  const out: ConflictCandidate[] = [];
  const existingByKey = new Map<string, IdentitySnapshot[]>();
  for (const cand of existingIdentities) {
    const cn = norm(cand.name);
    const ca = norm(cand.affiliation);
    if (cn === "" || ca === "") continue;
    const key = `${cn}\u0000${ca}`;
    const bucket = existingByKey.get(key);
    if (bucket) {
      bucket.push(cand);
    } else {
      existingByKey.set(key, [cand]);
    }
  }

  for (const src of emailConflictRows) {
    const sn = norm(src.name);
    const sa = norm(src.affiliation);
    if (sn === "" || sa === "") continue;
    for (const cand of existingByKey.get(keyOf(src.name, src.affiliation)) ?? []) {
      if (cand.memberId === src.sourceMemberId) continue;
      out.push({
        sourceMemberId: src.sourceMemberId,
        candidateTargetMemberId: cand.memberId,
        matchedFields: ["name", "affiliation"],
      });
    }
  }
  return out;
}
