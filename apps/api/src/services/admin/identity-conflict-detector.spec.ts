// issue-194-03b-followup-001-email-conflict-identity-merge
// detector unit test (pure function)
import { describe, it, expect } from "vitest";
import { detectConflictCandidates } from "./identity-conflict-detector";

describe("detectConflictCandidates", () => {
  it("name + affiliation 完全一致を candidate として返す", () => {
    const candidates = detectConflictCandidates(
      [{ sourceMemberId: "m_new", name: "山田太郎", affiliation: "ACME" }],
      [
        { memberId: "m_old", name: "山田太郎", affiliation: "ACME" },
        { memberId: "m_other", name: "鈴木花子", affiliation: "ACME" },
      ],
    );
    expect(candidates).toEqual([
      {
        sourceMemberId: "m_new",
        candidateTargetMemberId: "m_old",
        matchedFields: ["name", "affiliation"],
      },
    ]);
  });

  it("name のみ一致では候補にしない（第一段階は両方完全一致）", () => {
    const out = detectConflictCandidates(
      [{ sourceMemberId: "m_a", name: "山田太郎", affiliation: "ACME" }],
      [{ memberId: "m_b", name: "山田太郎", affiliation: "Other" }],
    );
    expect(out).toEqual([]);
  });

  it("自己 (memberId 同一) は候補から除外する", () => {
    const out = detectConflictCandidates(
      [{ sourceMemberId: "m_self", name: "山田太郎", affiliation: "ACME" }],
      [{ memberId: "m_self", name: "山田太郎", affiliation: "ACME" }],
    );
    expect(out).toEqual([]);
  });

  it("trim と NFKC 正規化で同値比較される", () => {
    const out = detectConflictCandidates(
      [{ sourceMemberId: "m_new", name: " 山田太郎 ", affiliation: "ＡＣＭＥ" }],
      [{ memberId: "m_old", name: "山田太郎", affiliation: "ACME" }],
    );
    expect(out).toHaveLength(1);
    expect(out[0]!.candidateTargetMemberId).toBe("m_old");
  });

  it("name もしくは affiliation が空ならスキップする", () => {
    const out = detectConflictCandidates(
      [
        { sourceMemberId: "m_a", name: "", affiliation: "ACME" },
        { sourceMemberId: "m_b", name: "山田太郎", affiliation: "" },
      ],
      [{ memberId: "m_old", name: "山田太郎", affiliation: "ACME" }],
    );
    expect(out).toEqual([]);
  });
});
