// @vitest-environment node
// Branch coverage recovery for identity-conflict repository (listIdentityConflicts).
// Targets uncovered branches:
//  - fetchIdentitySnapshots / fetchDismissedPairs `?? []` fallbacks (L71/L83, via stub)
//  - null name/affiliation filtering + `?? ""` coalescing (L120/125/126/130/131)
//  - sort comparator both branches: differing + equal detectedAt (L173)
//  - cursor present + found / not-found (L177/L179)
//  - nextCursor non-null when more items than limit (L183)
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "./__tests__/_setup";
import type { DbCtx } from "./_shared/db";
import { listIdentityConflicts } from "./identity-conflict";

let memberSeq = 0;

// Insert one identity (member + response + name/affiliation response_fields).
// When name/affiliation are null, the response_fields rows are omitted so the
// correlated subqueries yield NULL (exercising `?? ""` fallbacks).
const seedIdentity = async (
  env: InMemoryD1,
  opts: {
    memberId: string;
    email: string;
    submittedAt: string;
    name: string | null;
    affiliation: string | null;
  },
) => {
  const responseId = `resp_${memberSeq++}`;
  await env.db
    .prepare(
      `INSERT INTO member_responses (response_id, form_id, revision_id, schema_hash, response_email, search_text, submitted_at, answers_json)
       VALUES (?1,'f1','rev1','h1',?2,'',?3,'{}')`,
    )
    .bind(responseId, opts.email, opts.submittedAt)
    .run();
  await env.db
    .prepare(
      `INSERT INTO member_identities (member_id, response_email, current_response_id, first_response_id, last_submitted_at)
       VALUES (?1,?2,?3,?3,?4)`,
    )
    .bind(opts.memberId, opts.email, responseId, opts.submittedAt)
    .run();
  if (opts.name !== null) {
    await env.db
      .prepare(
        "INSERT INTO response_fields (response_id, stable_key, value_json) VALUES (?1,'fullName', json_quote(?2))",
      )
      .bind(responseId, opts.name)
      .run();
  }
  if (opts.affiliation !== null) {
    await env.db
      .prepare(
        "INSERT INTO response_fields (response_id, stable_key, value_json) VALUES (?1,'occupation', json_quote(?2))",
      )
      .bind(responseId, opts.affiliation)
      .run();
  }
};

const stubEmptyCtx = (): DbCtx => ({
  db: {
    prepare: () => {
      const stmt = {
        bind: () => stmt,
        // sync_jobs first() -> null; identity/dismissal all() -> missing results
        first: async () => null,
        all: async () => ({}) as { results: never[] },
        run: async () => ({ success: true, meta: { changes: 0, last_row_id: 0 } }),
      };
      return stmt;
    },
    exec: async () => ({ count: 0, duration: 0 }),
  } as unknown as DbCtx["db"],
});

describe("identity-conflict branch recovery", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
    memberSeq = 0;
  }, 60000);

  it("returns empty result when snapshot/dismissal queries yield missing results (`?? []`)", async () => {
    const out = await listIdentityConflicts(stubEmptyCtx(), null, 50);
    expect(out.items).toEqual([]);
    expect(out.nextCursor).toBeNull();
  });

  it("excludes identities with null/blank name or affiliation (L120 + `?? \"\"`)", async () => {
    // pair with full fields -> a conflict candidate.
    await seedIdentity(env, {
      memberId: "m_a1",
      email: "a1@x.com",
      submittedAt: "2026-01-01T00:00:00.000Z",
      name: "佐藤花子",
      affiliation: "BETA",
    });
    await seedIdentity(env, {
      memberId: "m_a2",
      email: "a2@x.com",
      submittedAt: "2026-02-01T00:00:00.000Z",
      name: "佐藤花子",
      affiliation: "BETA",
    });
    // identity with NULL name -> subquery returns null -> filtered out, no extra candidate.
    await seedIdentity(env, {
      memberId: "m_nullname",
      email: "n1@x.com",
      submittedAt: "2026-03-01T00:00:00.000Z",
      name: null,
      affiliation: "BETA",
    });
    // identity with NULL affiliation -> filtered out.
    await seedIdentity(env, {
      memberId: "m_nullaff",
      email: "n2@x.com",
      submittedAt: "2026-03-02T00:00:00.000Z",
      name: "佐藤花子",
      affiliation: null,
    });

    const out = await listIdentityConflicts(env.ctx, null, 50);
    // only the fully-populated pair forms a candidate.
    expect(out.items).toHaveLength(1);
    const ids = out.items.map((i) => [i.sourceMemberId, i.candidateTargetMemberId].sort()).flat();
    expect(ids).not.toContain("m_nullname");
    expect(ids).not.toContain("m_nullaff");
  });

  it("sorts multiple conflict groups by detectedAt desc and exercises equal/diff branches (L173)", async () => {
    // Group A: same detectedAt for the two source rows of different groups would be
    // hard; instead build two groups with DIFFERENT source detectedAt (L173 true)
    // and a third group whose source detectedAt EQUALS group A's (L173 false tiebreak).
    // Group A (source detectedAt 2026-05-01)
    await seedIdentity(env, {
      memberId: "g1_old",
      email: "g1o@x.com",
      submittedAt: "2026-01-01T00:00:00.000Z",
      name: "一郎",
      affiliation: "G1",
    });
    await seedIdentity(env, {
      memberId: "g1_new",
      email: "g1n@x.com",
      submittedAt: "2026-05-01T00:00:00.000Z",
      name: "一郎",
      affiliation: "G1",
    });
    // Group B (source detectedAt 2026-06-01 -> sorts first)
    await seedIdentity(env, {
      memberId: "g2_old",
      email: "g2o@x.com",
      submittedAt: "2026-02-01T00:00:00.000Z",
      name: "二郎",
      affiliation: "G2",
    });
    await seedIdentity(env, {
      memberId: "g2_new",
      email: "g2n@x.com",
      submittedAt: "2026-06-01T00:00:00.000Z",
      name: "二郎",
      affiliation: "G2",
    });
    // Group C (source detectedAt 2026-05-01 -> ties with group A on detectedAt -> tiebreak by conflictId)
    await seedIdentity(env, {
      memberId: "g3_old",
      email: "g3o@x.com",
      submittedAt: "2026-03-01T00:00:00.000Z",
      name: "三郎",
      affiliation: "G3",
    });
    await seedIdentity(env, {
      memberId: "g3_new",
      email: "g3n@x.com",
      submittedAt: "2026-05-01T00:00:00.000Z",
      name: "三郎",
      affiliation: "G3",
    });

    const out = await listIdentityConflicts(env.ctx, null, 50);
    expect(out.items).toHaveLength(3);
    // group B detectedAt is newest -> appears first.
    expect(out.items[0]!.sourceMemberId).toBe("g2_new");
    // the two 2026-05-01 groups follow, ordered by conflictId asc (tiebreak).
    const tail = out.items.slice(1).map((i) => i.conflictId);
    expect([...tail].sort()).toEqual(tail);
  });

  it("paginates with a non-null nextCursor and honors a provided cursor (L177/L179/L183)", async () => {
    // 3 distinct conflict groups -> 3 items; limit 2 -> nextCursor non-null (L183 true).
    for (const [n, aff] of [
      ["甲", "C1"],
      ["乙", "C2"],
      ["丙", "C3"],
    ] as const) {
      await seedIdentity(env, {
        memberId: `${aff}_a`,
        email: `${aff}a@x.com`,
        submittedAt: "2026-01-01T00:00:00.000Z",
        name: n,
        affiliation: aff,
      });
      await seedIdentity(env, {
        memberId: `${aff}_b`,
        email: `${aff}b@x.com`,
        submittedAt: "2026-02-01T00:00:00.000Z",
        name: n,
        affiliation: aff,
      });
    }

    const page1 = await listIdentityConflicts(env.ctx, null, 2);
    expect(page1.items).toHaveLength(2);
    expect(page1.nextCursor).not.toBeNull();

    // provide the returned cursor -> findIndex >= 0 -> start = idx+1 (L177 true, L179 true)
    const page2 = await listIdentityConflicts(env.ctx, page1.nextCursor, 2);
    expect(page2.items).toHaveLength(1);
    expect(page2.nextCursor).toBeNull();

    // unknown cursor -> findIndex < 0 -> start resets to 0 (L179 false branch)
    const reset = await listIdentityConflicts(env.ctx, "no__such__cursor", 2);
    expect(reset.items).toHaveLength(2);
  });
});
