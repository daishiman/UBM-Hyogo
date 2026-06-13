import { describe, expect, it } from "vitest";
import {
  createDiagnosticsRouter,
  getFormsPipelineSnapshot,
} from "./forms-pipeline";
import { adminAuthHeader, TEST_AUTH_SECRET } from "../routes/admin/_test-auth";

/**
 * Mock D1 driving getFormsPipelineSnapshot without a real D1 binding.
 *
 * getFormsPipelineSnapshot runs a fixed sequence of queries, each matched here
 * by a stable SQL substring. This lets every helper branch
 * (normalizeSyncStatus / readResponsesFetched / readErrorMessage) and every
 * `?? fallback` (when `.first()` returns null) be exercised deterministically.
 */
type Row = Record<string, unknown>;

interface MockSpec {
  // counts SELECT first<CountRow>()
  counts?: Row | null;
  // sync_jobs ...LIMIT 10 all<SyncJobRow>()
  syncRows?: Row[] | undefined;
  // schema_diff_queue queued first<{n}>()
  aliasRow?: Row | null;
  // member_status visibility first<VisibilityRow>()
  visibility?: Row | null;
  // identity health first<IdentityHealthRow>()
  identityHealth?: Row | null;
  // consent breakdown first()
  consentRow?: Row | null;
  // publish breakdown first()
  publishRow?: Row | null;
  // visible public count first<{n}>()
  visibleRow?: Row | null;
  // MAX(finished_at) first<{t}>()
  lastSyncRow?: Row | null;
  // totals first()
  totalsRow?: Row | null;
}

function makeDb(spec: MockSpec): D1Database {
  const pick = (sql: string): { first: boolean; value: unknown } => {
    if (sql.includes("AS formResponses")) {
      return { first: true, value: spec.counts ?? null };
    }
    if (sql.includes("FROM sync_jobs") && sql.includes("LIMIT 10")) {
      return { first: false, value: { results: spec.syncRows } };
    }
    if (sql.includes("schema_diff_queue")) {
      return { first: true, value: spec.aliasRow ?? null };
    }
    if (sql.includes("AS totalMembers")) {
      return { first: true, value: spec.visibility ?? null };
    }
    if (sql.includes("AS totalIdentities") && sql.includes("identitiesWithoutMember")) {
      return { first: true, value: spec.identityHealth ?? null };
    }
    if (sql.includes("AS consented")) {
      return { first: true, value: spec.consentRow ?? null };
    }
    if (sql.includes("AS p_public")) {
      return { first: true, value: spec.publishRow ?? null };
    }
    if (sql.includes("identity_aliases")) {
      return { first: true, value: spec.visibleRow ?? null };
    }
    if (sql.includes("MAX(finished_at)")) {
      return { first: true, value: spec.lastSyncRow ?? null };
    }
    if (sql.includes("AS memberStatus")) {
      return { first: true, value: spec.totalsRow ?? null };
    }
    // member-diagnosis WITH target(...) lookup → null member (404 branch)
    if (sql.includes("WITH target")) {
      return { first: true, value: null };
    }
    throw new Error(`unexpected SQL: ${sql.slice(0, 60)}`);
  };

  const prepare = (sql: string) => {
    const handler = () => pick(sql);
    const stmt: Record<string, unknown> = {};
    stmt["bind"] = () => stmt;
    stmt["first"] = async () => handler().value;
    stmt["all"] = async () => handler().value;
    stmt["run"] = async () => ({ success: true });
    return stmt;
  };

  return { prepare } as unknown as D1Database;
}

const baseEnv = {
  DB: makeDb({}),
  GOOGLE_SERVICE_ACCOUNT_EMAIL: "",
  GOOGLE_PRIVATE_KEY: "",
  FORMS_SA_EMAIL: "",
  FORMS_SA_KEY: "",
  GOOGLE_FORM_ID: "",
  FORM_ID: "",
  AUTH_SECRET: "",
} as unknown as Parameters<typeof getFormsPipelineSnapshot>[0];

describe("getFormsPipelineSnapshot — null-fallback branches", () => {
  it("uses every `?? default` fallback when each query returns null", async () => {
    const env = {
      ...baseEnv,
      DB: makeDb({
        counts: null,
        syncRows: undefined,
        aliasRow: null,
        visibility: null,
        identityHealth: null,
        consentRow: null,
        publishRow: null,
        visibleRow: null,
        lastSyncRow: null,
        totalsRow: null,
      }),
    };
    const snap = await getFormsPipelineSnapshot(env);
    expect(snap.counts).toEqual({
      formResponses: 0,
      responseFields: 0,
      members: 0,
      memberIdentities: 0,
    });
    expect(snap.latestSyncRuns).toEqual([]);
    expect(snap.aliasPendingCount).toBe(0);
    expect(snap.publicVisibility.totalMembers).toBe(0);
    expect(snap.publicVisibility.allHiddenByPublishState).toBe(false);
    expect(snap.identityHealth.totalIdentities).toBe(0);
    expect(snap.publicConsentBreakdown).toEqual({
      consented: 0,
      declined: 0,
      unknown: 0,
    });
    expect(snap.publishStateBreakdown.legacy_published).toBe(0);
    expect(snap.visiblePublicCount).toBe(0);
    expect(snap.lastSuccessfulSyncAt).toBeNull();
    expect(snap.totals).toEqual({
      memberIdentities: 0,
      memberResponses: 0,
      memberStatus: 0,
    });
    // empty ledger + 0 responses → H1 true
    expect(snap.hypothesisFlags.H1_ingestNeverRanOrAllErrors).toBe(true);
  });
});

describe("getFormsPipelineSnapshot — sync row helper branches", () => {
  it("normalizes failed/aborted/running statuses and reads metrics fallbacks", async () => {
    const env = {
      ...baseEnv,
      DB: makeDb({
        counts: { formResponses: 5, responseFields: 10, members: 3, memberIdentities: 3 },
        syncRows: [
          {
            job_id: "j-failed",
            started_at: "2026-05-26T00:00:00Z",
            finished_at: "2026-05-26T00:00:05Z",
            status: "failed",
            error_json: JSON.stringify({ message: "boom" }),
            metrics_json: JSON.stringify({ responsesFetched: 7 }),
          },
          {
            job_id: "j-aborted",
            started_at: "2026-05-26T01:00:00Z",
            finished_at: null,
            status: "aborted",
            error_json: JSON.stringify({ error: "halted" }),
            metrics_json: JSON.stringify({ fetched: 3 }),
          },
          {
            job_id: "j-running",
            started_at: "2026-05-26T02:00:00Z",
            finished_at: null,
            status: "in_progress",
            error_json: null,
            metrics_json: JSON.stringify({ processed: 2 }),
          },
        ],
        aliasRow: { n: 2 },
        visibility: {
          totalMembers: 3,
          publicConsentTrue: 1,
          publishedTrue: 1,
          visibleOnPublicDirectory: 0,
        },
        identityHealth: {
          totalIdentities: 3,
          identitiesWithoutMember: 1,
          membersWithoutIdentity: 0,
        },
        consentRow: { consented: 1, declined: 1, unknown: 1 },
        publishRow: {
          p_public: 1,
          p_member_only: 0,
          p_hidden: 1,
          p_legacy_published: 0,
          p_legacy_private: 0,
        },
        visibleRow: { n: 0 },
        lastSyncRow: { t: "2026-05-26T00:00:05Z" },
        totalsRow: { memberIdentities: 3, memberResponses: 5, memberStatus: 3 },
      }),
    };

    const snap = await getFormsPipelineSnapshot(env);
    const [failed, aborted, running] = snap.latestSyncRuns;
    expect(failed.status).toBe("error");
    expect(failed.responsesFetched).toBe(7);
    expect(failed.errorMessage).toBe("boom");
    expect(failed.finishedAt).toBe("2026-05-26T00:00:05Z");

    expect(aborted.status).toBe("aborted");
    expect(aborted.responsesFetched).toBe(3);
    expect(aborted.errorMessage).toBe("halted");
    expect(aborted.finishedAt).toBeNull();

    expect(running.status).toBe("running");
    expect(running.responsesFetched).toBe(2);
    expect(running.errorMessage).toBeNull();

    // alias pending non-zero
    expect(snap.hypothesisFlags.H4_aliasPendingNonZero).toBe(true);
    // identitiesWithoutMember > 0 → H2
    expect(snap.hypothesisFlags.H2_identityMismatchSuspected).toBe(true);
    // totalMembers>0 + visible 0 → H3 allHidden
    expect(snap.hypothesisFlags.H3_allHiddenByPublishState).toBe(true);
  });

  it("falls back to 0 / 'sync error' on malformed metrics and error JSON", async () => {
    const env = {
      ...baseEnv,
      DB: makeDb({
        counts: { formResponses: 1, responseFields: 1, members: 1, memberIdentities: 1 },
        syncRows: [
          {
            job_id: "j-bad-json",
            started_at: "2026-05-26T00:00:00Z",
            finished_at: "2026-05-26T00:00:05Z",
            status: "succeeded",
            // invalid JSON → both catch blocks
            error_json: "{not-json",
            metrics_json: "{also-not-json",
          },
          {
            job_id: "j-null-metrics",
            started_at: "2026-05-26T00:01:00Z",
            finished_at: "2026-05-26T00:01:05Z",
            status: "succeeded",
            error_json: null,
            // non-string message → "sync error"
            metrics_json: null,
          },
        ],
        aliasRow: { n: 0 },
        visibility: {
          totalMembers: 1,
          publicConsentTrue: 1,
          publishedTrue: 1,
          visibleOnPublicDirectory: 1,
        },
        identityHealth: {
          totalIdentities: 1,
          identitiesWithoutMember: 0,
          membersWithoutIdentity: 0,
        },
        consentRow: { consented: 1, declined: 0, unknown: 0 },
        publishRow: {
          p_public: 1,
          p_member_only: 0,
          p_hidden: 0,
          p_legacy_published: 0,
          p_legacy_private: 0,
        },
        visibleRow: { n: 1 },
        lastSyncRow: { t: null },
        totalsRow: { memberIdentities: 1, memberResponses: 1, memberStatus: 1 },
      }),
    };

    const snap = await getFormsPipelineSnapshot(env);
    const bad = snap.latestSyncRuns[0];
    // metrics JSON parse failed → 0
    expect(bad.responsesFetched).toBe(0);
    // error JSON parse failed → "sync error"
    expect(bad.errorMessage).toBe("sync error");
    // null lastSyncRow.t → null
    expect(snap.lastSuccessfulSyncAt).toBeNull();
    // has successful run, responses>0 → H1 false
    expect(snap.hypothesisFlags.H1_ingestNeverRanOrAllErrors).toBe(false);
  });

  it("returns null errorMessage when error JSON has only a non-string message", async () => {
    const env = {
      ...baseEnv,
      DB: makeDb({
        counts: { formResponses: 1, responseFields: 1, members: 1, memberIdentities: 1 },
        syncRows: [
          {
            job_id: "j-numeric-msg",
            started_at: "2026-05-26T00:00:00Z",
            finished_at: "2026-05-26T00:00:05Z",
            status: "succeeded",
            error_json: JSON.stringify({ code: 500 }),
            metrics_json: JSON.stringify({ unrelated: true }),
          },
        ],
        aliasRow: { n: 0 },
        visibility: {
          totalMembers: 1,
          publicConsentTrue: 1,
          publishedTrue: 1,
          visibleOnPublicDirectory: 1,
        },
        identityHealth: {
          totalIdentities: 1,
          identitiesWithoutMember: 0,
          membersWithoutIdentity: 0,
        },
        consentRow: { consented: 1, declined: 0, unknown: 0 },
        publishRow: {
          p_public: 1,
          p_member_only: 0,
          p_hidden: 0,
          p_legacy_published: 0,
          p_legacy_private: 0,
        },
        visibleRow: { n: 1 },
        lastSyncRow: { t: "2026-05-26T00:00:05Z" },
        totalsRow: { memberIdentities: 1, memberResponses: 1, memberStatus: 1 },
      }),
    };
    const snap = await getFormsPipelineSnapshot(env);
    // code:500 is a number → readErrorMessage returns "sync error"
    expect(snap.latestSyncRuns[0].errorMessage).toBe("sync error");
    // no relevant metric key → toNumber fallback path → 0
    expect(snap.latestSyncRuns[0].responsesFetched).toBe(0);
  });
});

describe("getFormsPipelineSnapshot — secretsReadiness fallback env vars", () => {
  it("reads FORMS_SA_* / FORM_ID alternates when primary vars are empty", async () => {
    const env = {
      ...baseEnv,
      GOOGLE_SERVICE_ACCOUNT_EMAIL: "",
      GOOGLE_PRIVATE_KEY: "   ", // whitespace-only → hasText false → fallback
      GOOGLE_FORM_ID: "",
      FORMS_SA_EMAIL: "sa@example.com",
      FORMS_SA_KEY: "key-value",
      FORM_ID: "form-fallback",
      AUTH_SECRET: "secret",
      DB: makeDb({
        counts: { formResponses: 1, responseFields: 1, members: 1, memberIdentities: 1 },
        syncRows: [],
        aliasRow: { n: 0 },
        visibility: {
          totalMembers: 0,
          publicConsentTrue: 0,
          publishedTrue: 0,
          visibleOnPublicDirectory: 0,
        },
        identityHealth: {
          totalIdentities: 0,
          identitiesWithoutMember: 0,
          membersWithoutIdentity: 0,
        },
        consentRow: { consented: 0, declined: 0, unknown: 0 },
        publishRow: {
          p_public: 0,
          p_member_only: 0,
          p_hidden: 0,
          p_legacy_published: 0,
          p_legacy_private: 0,
        },
        visibleRow: { n: 0 },
        lastSyncRow: { t: null },
        totalsRow: { memberIdentities: 0, memberResponses: 0, memberStatus: 0 },
      }),
    } as unknown as Parameters<typeof getFormsPipelineSnapshot>[0];

    const snap = await getFormsPipelineSnapshot(env);
    expect(snap.secretsReadiness).toEqual({
      googleServiceAccountEmail: true,
      googlePrivateKey: true,
      googleFormId: true,
      authSecret: true,
    });
  });
});

describe("createDiagnosticsRouter — member 404 branch", () => {
  it("returns 404 when getMemberDiagnosis yields no member", async () => {
    const app = createDiagnosticsRouter();
    const res = await app.request(
      "/member/does-not-exist",
      { headers: await adminAuthHeader() },
      {
        DB: makeDb({}),
        AUTH_SECRET: TEST_AUTH_SECRET,
      } as unknown as Parameters<typeof getFormsPipelineSnapshot>[0],
    );
    expect(res.status).toBe(404);
    const body = (await res.json()) as { ok: boolean; error: string };
    expect(body).toEqual({ ok: false, error: "not found" });
  });
});
