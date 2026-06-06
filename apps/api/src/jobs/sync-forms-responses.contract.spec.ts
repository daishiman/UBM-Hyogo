// 03b: T-U-01 〜 T-U-14 を集約。AC-1〜AC-10 をカバー。
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  decideShouldUpdate,
  previewResponseSync,
  runResponseSync,
} from "./sync-forms-responses";
import { FakeD1 } from "./__fixtures__/d1-fake";
import {
  asResponseEmail,
  asResponseId,
  type MemberResponse,
} from "@ubm-hyogo/shared";
import type { GoogleFormsClient } from "@ubm-hyogo/integrations";

type RespOverrides = Omit<Partial<MemberResponse>, "responseId"> & {
  responseId?: string;
};

const makeResp = (overrides: RespOverrides = {}): MemberResponse => {
  const { responseId, ...rest } = overrides;
  return {
    formId: "form-1",
    revisionId: "rev-1",
    schemaHash: "hash-1",
    responseEmail: asResponseEmail("alice@example.com"),
    submittedAt: "2026-01-01T00:00:00Z",
    editResponseUrl: null,
    answersByStableKey: {},
    rawAnswersByQuestionId: {},
    extraFields: {},
    unmappedQuestionIds: [],
    searchText: "",
    ...rest,
    responseId: asResponseId(responseId ?? "r-1"),
  };
};

const makeClient = (
  pages: Array<{ responses: MemberResponse[]; nextPageToken?: string }>,
): GoogleFormsClient => {
  let i = 0;
  return {
    getForm: vi.fn(),
    listResponses: vi.fn(async (_formId: string, _opts?) => {
      const page = pages[i] ?? { responses: [] };
      i += 1;
      return page.nextPageToken
        ? { responses: page.responses, nextPageToken: page.nextPageToken }
        : { responses: page.responses };
    }),
  } as unknown as GoogleFormsClient;
};

const makeSteppedNow = (...timestamps: number[]): (() => Date) => {
  let i = 0;
  return () => new Date(timestamps[Math.min(i++, timestamps.length - 1)] ?? 0);
};

describe("decideShouldUpdate (AC-1 / T-U-01 / T-U-02)", () => {
  it("submittedAt 最新を採用する", () => {
    expect(
      decideShouldUpdate("2026-01-01T00:00:00Z", "rA", "2026-02-01T00:00:00Z", "rZ"),
    ).toBe(true);
  });
  it("submittedAt が古ければ false", () => {
    expect(
      decideShouldUpdate("2026-02-01T00:00:00Z", "rA", "2026-01-01T00:00:00Z", "rZ"),
    ).toBe(false);
  });
  it("タイ時は responseId lex max を採用 (T-U-02)", () => {
    expect(
      decideShouldUpdate("2026-01-01T00:00:00Z", "rA", "2026-01-01T00:00:00Z", "rB"),
    ).toBe(true);
    expect(
      decideShouldUpdate("2026-01-01T00:00:00Z", "rB", "2026-01-01T00:00:00Z", "rA"),
    ).toBe(false);
  });
});

describe("runResponseSync", () => {
  let db: FakeD1;
  beforeEach(() => {
    db = new FakeD1();
  });

  it("正常系: 1 page を処理して member_identities / member_responses / member_status を upsert する (AC-4)", async () => {
    const resp = makeResp({
      answersByStableKey: {
        fullName: "山田",
        publicConsent: "同意します",
        rulesConsent: "同意します",
      },
    });
    const client = makeClient([{ responses: [resp] }]);
    const result = await runResponseSync(
      { DB: db as unknown as D1Database, GOOGLE_FORM_ID: "form-1" },
      { trigger: "admin", client },
    );
    expect(result.status).toBe("succeeded");
    expect(result.processedCount).toBe(1);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(db.identities).toHaveLength(1);
    expect(db.identities[0]?.["response_email"]).toBe("alice@example.com");
    expect(db.responses).toHaveLength(1);
    // AC-4: response_email は member_responses 列に保存される
    expect(db.responses[0]?.["response_email"]).toBe("alice@example.com");
    // AC-3 / AC-8: consent 正規化値が member_status に反映される
    expect(db.status[0]?.["public_consent"]).toBe("consented");
    expect(db.status[0]?.["rules_consent"]).toBe("consented");
  });

  it("新規 identity 作成時に consent 更新前から member_status 既定行を保証する", async () => {
    const resp = makeResp({ responseEmail: asResponseEmail("ensured@example.com") });
    const client = makeClient([{ responses: [resp] }]);

    await runResponseSync(
      { DB: db as unknown as D1Database, GOOGLE_FORM_ID: "form-1" },
      { trigger: "admin", client },
    );

    expect(db.identities).toHaveLength(1);
    expect(db.status).toHaveLength(1);
    expect(db.status[0]?.["member_id"]).toBe(db.identities[0]?.["member_id"]);
  });

  it('Issue #378: TAG_QUEUE_PAUSED="true" は Forms sync からの candidate enqueue だけを停止する', async () => {
    const resp = makeResp({
      answersByStableKey: {
        fullName: "山田",
        publicConsent: "同意します",
        rulesConsent: "同意します",
      },
    });
    const client = makeClient([{ responses: [resp] }]);
    const result = await runResponseSync(
      {
        DB: db as unknown as D1Database,
        GOOGLE_FORM_ID: "form-1",
        TAG_QUEUE_PAUSED: "true",
      },
      { trigger: "admin", client },
    );

    expect(result.status).toBe("succeeded");
    expect(result.processedCount).toBe(1);
    expect(db.identities).toHaveLength(1);
    expect(db.responses).toHaveLength(1);
    expect(db.status).toHaveLength(1);
    expect(db.tagQueue).toHaveLength(0);
  });

  it("AC-2: unknown question を schema_diff_queue に enqueue し、重複 enqueue は no-op", async () => {
    const resp1 = makeResp({
      responseId: "r-A",
      unmappedQuestionIds: ["q-new"],
      rawAnswersByQuestionId: { "q-new": { textAnswers: { answers: [{ value: "x" }] } } },
    });
    const resp2 = makeResp({
      responseId: "r-B",
      submittedAt: "2026-02-01T00:00:00Z",
      unmappedQuestionIds: ["q-new"],
      rawAnswersByQuestionId: { "q-new": { textAnswers: { answers: [{ value: "y" }] } } },
    });
    const client = makeClient([{ responses: [resp1, resp2] }]);
    await runResponseSync(
      { DB: db as unknown as D1Database, GOOGLE_FORM_ID: "form-1" },
      { trigger: "admin", client },
    );
    const queued = db.schemaDiff.filter(
      (r) => r["question_id"] === "q-new" && r["status"] === "queued",
    );
    expect(queued).toHaveLength(1);
  });

  it("AC-1: 同 email 再回答で current_response_id が submittedAt 最新に切り替わる", async () => {
    const old = makeResp({
      responseId: "r-old",
      submittedAt: "2026-01-01T00:00:00Z",
    });
    const recent = makeResp({
      responseId: "r-new",
      submittedAt: "2026-03-01T00:00:00Z",
    });
    const client = makeClient([{ responses: [old, recent] }]);
    await runResponseSync(
      { DB: db as unknown as D1Database, GOOGLE_FORM_ID: "form-1" },
      { trigger: "admin", client },
    );
    expect(db.identities[0]?.["current_response_id"]).toBe("r-new");
    expect(db.identities[0]?.["last_submitted_at"]).toBe("2026-03-01T00:00:00Z");
  });

  it("AC-9: is_deleted=true の identity は consent snapshot 更新を skip する", async () => {
    // 事前に identity と is_deleted=true status を仕込む
    db.identities.push({
      member_id: "m-existing",
      response_email: "alice@example.com",
      current_response_id: "r-existing",
      first_response_id: "r-existing",
      last_submitted_at: "2025-12-01T00:00:00Z",
    });
    db.status.push({
      member_id: "m-existing",
      public_consent: "unknown",
      rules_consent: "unknown",
      publish_state: "member_only",
      is_deleted: 1,
      updated_at: "2025-12-01T00:00:00Z",
    });
    const resp = makeResp({
      responseId: "r-new",
      submittedAt: "2026-04-01T00:00:00Z",
      answersByStableKey: { publicConsent: "同意します", rulesConsent: "同意します" },
    });
    const client = makeClient([{ responses: [resp] }]);
    await runResponseSync(
      { DB: db as unknown as D1Database, GOOGLE_FORM_ID: "form-1" },
      { trigger: "admin", client },
    );
    const status = db.status.find((r) => r["member_id"] === "m-existing");
    // is_deleted=true なので consent は更新されない（unknown のまま）
    expect(status?.["public_consent"]).toBe("unknown");
    expect(status?.["rules_consent"]).toBe("unknown");
  });

  it("AC-5: cursor pagination で 2 page を loop し nextPageToken=undefined で停止", async () => {
    const r1 = makeResp({ responseId: "r-1" });
    const r2 = makeResp({ responseId: "r-2", responseEmail: asResponseEmail("bob@example.com") });
    const client = makeClient([
      { responses: [r1], nextPageToken: "p2" },
      { responses: [r2] },
    ]);
    const result = await runResponseSync(
      { DB: db as unknown as D1Database, GOOGLE_FORM_ID: "form-1" },
      { trigger: "admin", client },
    );
    expect(result.processedCount).toBe(2);
    expect(client.listResponses).toHaveBeenCalledTimes(2);
    expect(result.cursor).toBe("2026-01-01T00:00:00Z|r-2");
  });

  it("AC-6: 既に同種 sync が走っている状態で起動すると skipped を返す", async () => {
    // 事前に lock を仕込む
    db.syncLocks.push({
      id: "response-sync",
      acquired_at: "2099-01-01T00:00:00Z",
      expires_at: "2099-01-01T00:30:00Z",
      holder: "other-job",
      trigger_type: "cron",
    });
    const client = makeClient([{ responses: [] }]);
    const result = await runResponseSync(
      { DB: db as unknown as D1Database, GOOGLE_FORM_ID: "form-1" },
      { trigger: "admin", client, now: makeSteppedNow(1000, 1042, 1042) },
    );
    expect(result.status).toBe("skipped");
    expect(result.durationMs).toBe(42);
    expect(result.skippedReason).toMatch(/another response sync/);
  });

  it("AC-10: per-sync write が writeCap を超えると loop を打ち切る", async () => {
    const responses = Array.from({ length: 50 }, (_, i) =>
      makeResp({
        responseId: `r-${i}`,
        responseEmail: asResponseEmail(`u${i}@example.com`),
        submittedAt: `2026-01-${String(i + 1).padStart(2, "0")}T00:00:00Z`,
      }),
    );
    const client = makeClient([
      { responses: responses.slice(0, 25), nextPageToken: "p2" },
      { responses: responses.slice(25) },
    ]);
    const result = await runResponseSync(
      {
        DB: db as unknown as D1Database,
        GOOGLE_FORM_ID: "form-1",
        RESPONSE_SYNC_WRITE_CAP: "10",
      },
      { trigger: "admin", client },
    );
    expect(result.status).toBe("succeeded");
    expect(result.writeCount).toBeLessThan(10);
    // 全 50 を処理する前に break する
    expect(result.processedCount).toBeLessThan(50);
  });

  it("S-1: cap 未到達で完了 → metrics_json.writeCapHit === false / emit 0 回 (03b-followup-006)", async () => {
    const writeDataPoint = vi.fn();
    const resp = makeResp({ answersByStableKey: { fullName: "山田" } });
    const client = makeClient([{ responses: [resp] }]);
    const result = await runResponseSync(
      {
        DB: db as unknown as D1Database,
        GOOGLE_FORM_ID: "form-1",
        SYNC_ALERTS: { writeDataPoint } as unknown as AnalyticsEngineDataset,
      },
      { trigger: "admin", client },
    );
    expect(result.status).toBe("succeeded");
    const m = JSON.parse(String(db.syncJobs[0]?.["metrics_json"] ?? "{}"));
    expect(m.writeCapHit).toBe(false);
    expect(writeDataPoint).not.toHaveBeenCalled();
  });

  it("S-3: 直近 3 件すべて cap 到達 → emit 1 回 (03b-followup-006)", async () => {
    // 既存 succeeded job 2 件を writeCapHit=true で seed（直前 window は未達）
    db.syncJobs.push({
      job_id: "seed-0",
      job_type: "response_sync",
      started_at: "2026-01-01T00:00:00Z",
      finished_at: "2026-01-01T00:01:00Z",
      status: "succeeded",
      metrics_json: JSON.stringify({ writeCapHit: false }),
      error_json: null,
    });
    db.syncJobs.push({
      job_id: "seed-1",
      job_type: "response_sync",
      started_at: "2026-01-01T00:15:00Z",
      finished_at: "2026-01-01T00:16:00Z",
      status: "succeeded",
      metrics_json: JSON.stringify({ writeCapHit: true }),
      error_json: null,
    });
    db.syncJobs.push({
      job_id: "seed-2",
      job_type: "response_sync",
      started_at: "2026-01-01T00:30:00Z",
      finished_at: "2026-01-01T00:31:00Z",
      status: "succeeded",
      metrics_json: JSON.stringify({ writeCapHit: true }),
      error_json: null,
    });

    const writeDataPoint = vi.fn();
    const responses = Array.from({ length: 50 }, (_, i) =>
      makeResp({
        responseId: `r-${i}`,
        responseEmail: asResponseEmail(`u${i}@example.com`),
        submittedAt: `2026-02-${String(i + 1).padStart(2, "0")}T00:00:00Z`,
      }),
    );
    const client = makeClient([
      { responses: responses.slice(0, 25), nextPageToken: "p2" },
      { responses: responses.slice(25) },
    ]);
    const result = await runResponseSync(
      {
        DB: db as unknown as D1Database,
        GOOGLE_FORM_ID: "form-1",
        RESPONSE_SYNC_WRITE_CAP: "10",
        SYNC_ALERTS: { writeDataPoint } as unknown as AnalyticsEngineDataset,
      },
      { trigger: "admin", client },
    );
    expect(result.status).toBe("succeeded");
    expect(writeDataPoint).toHaveBeenCalledTimes(1);
    expect(writeDataPoint).toHaveBeenCalledWith(
      expect.objectContaining({
        blobs: ["sync_write_cap_consecutive_hit", "response_sync"],
        doubles: [3, 3],
      }),
    );
  });

  it("S-4: skipped (lock 取得失敗) → writeCapHit=false / emit 0 回 (03b-followup-006)", async () => {
    db.syncLocks.push({
      id: "response-sync",
      acquired_at: "2099-01-01T00:00:00Z",
      expires_at: "2099-01-01T00:30:00Z",
      holder: "other",
      trigger_type: "cron",
    });
    const writeDataPoint = vi.fn();
    const client = makeClient([{ responses: [] }]);
    await runResponseSync(
      {
        DB: db as unknown as D1Database,
        GOOGLE_FORM_ID: "form-1",
        SYNC_ALERTS: { writeDataPoint } as unknown as AnalyticsEngineDataset,
      },
      { trigger: "admin", client },
    );
    const m = JSON.parse(String(db.syncJobs[0]?.["metrics_json"] ?? "{}"));
    expect(m.writeCapHit).toBe(false);
    expect(writeDataPoint).not.toHaveBeenCalled();
  });

  it("S-5: failed path → emit 0 回 (03b-followup-006)", async () => {
    const writeDataPoint = vi.fn();
    const client = {
      getForm: vi.fn(),
      listResponses: vi.fn(async () => {
        throw new Error("forms-api: 503 service unavailable");
      }),
    } as unknown as GoogleFormsClient;
    await runResponseSync(
      {
        DB: db as unknown as D1Database,
        GOOGLE_FORM_ID: "form-1",
        SYNC_ALERTS: { writeDataPoint } as unknown as AnalyticsEngineDataset,
      },
      { trigger: "admin", client },
    );
    expect(writeDataPoint).not.toHaveBeenCalled();
  });

  // members-not-displaying-form-sync-investigation Task B
  it("Task B: MEMBERS_AUTO_PUBLISH_ON_CONSENT='true' は member_only+consented を public に昇格させる", async () => {
    const resp = makeResp({
      answersByStableKey: {
        publicConsent: "同意します",
        rulesConsent: "同意します",
      },
    });
    const client = makeClient([{ responses: [resp] }]);
    const result = await runResponseSync(
      {
        DB: db as unknown as D1Database,
        GOOGLE_FORM_ID: "form-1",
        MEMBERS_AUTO_PUBLISH_ON_CONSENT: "true",
      },
      { trigger: "admin", client },
    );
    expect(result.status).toBe("succeeded");
    const status = db.status.find((r) => r["public_consent"] === "consented");
    expect(status?.["publish_state"]).toBe("public");
    expect(status?.["updated_by"]).toBe("system:sync");
  });

  it("Task B: MEMBERS_AUTO_PUBLISH_ON_CONSENT='false' は publish_state を更新しない", async () => {
    const resp = makeResp({
      answersByStableKey: {
        publicConsent: "同意します",
        rulesConsent: "同意します",
      },
    });
    const client = makeClient([{ responses: [resp] }]);
    await runResponseSync(
      {
        DB: db as unknown as D1Database,
        GOOGLE_FORM_ID: "form-1",
        MEMBERS_AUTO_PUBLISH_ON_CONSENT: "false",
      },
      { trigger: "admin", client },
    );
    const status = db.status.find((r) => r["public_consent"] === "consented");
    // FakeD1 の default publish_state は member_only のまま
    expect(status?.["publish_state"]).toBe("member_only");
  });

  it("Task B: flag=true でも admin override (updated_by='admin@...') は維持される", async () => {
    // 既存 identity + admin が手動で member_only にした status を seed
    db.identities.push({
      member_id: "m-admin",
      response_email: "alice@example.com",
      current_response_id: "r-existing",
      first_response_id: "r-existing",
      last_submitted_at: "2025-12-01T00:00:00Z",
    });
    db.status.push({
      member_id: "m-admin",
      public_consent: "unknown",
      rules_consent: "unknown",
      publish_state: "member_only",
      is_deleted: 0,
      updated_by: "admin@example.com",
      updated_at: "2025-12-01T00:00:00Z",
    });
    const resp = makeResp({
      responseId: "r-new",
      submittedAt: "2026-04-01T00:00:00Z",
      answersByStableKey: {
        publicConsent: "同意します",
        rulesConsent: "同意します",
      },
    });
    const client = makeClient([{ responses: [resp] }]);
    await runResponseSync(
      {
        DB: db as unknown as D1Database,
        GOOGLE_FORM_ID: "form-1",
        MEMBERS_AUTO_PUBLISH_ON_CONSENT: "true",
      },
      { trigger: "admin", client },
    );
    const status = db.status.find((r) => r["member_id"] === "m-admin");
    expect(status?.["publish_state"]).toBe("member_only");
    expect(status?.["updated_by"]).toBe("admin@example.com");
  });

  it("失敗系: client.listResponses が throw すると status='failed'", async () => {
    const client = {
      getForm: vi.fn(),
      listResponses: vi.fn(async () => {
        throw new Error("forms-api: 503 service unavailable");
      }),
    } as unknown as GoogleFormsClient;
    const result = await runResponseSync(
      { DB: db as unknown as D1Database, GOOGLE_FORM_ID: "form-1" },
      { trigger: "admin", client, now: makeSteppedNow(1000, 1000, 1064) },
    );
    expect(result.status).toBe("failed");
    expect(result.durationMs).toBe(64);
    expect(db.syncJobs[0]?.["status"]).toBe("failed");
  });

  it("Issue #1088: succeeded path は durationMs を返す", async () => {
    const resp = makeResp({ responseEmail: asResponseEmail("duration@example.com") });
    const client = makeClient([{ responses: [resp] }]);
    const result = await runResponseSync(
      { DB: db as unknown as D1Database, GOOGLE_FORM_ID: "form-1" },
      { trigger: "admin", client, now: makeSteppedNow(1000, 1000, 1101) },
    );
    expect(result.status).toBe("succeeded");
    expect(result.durationMs).toBe(101);
  });
});

// issue-1089: backfill 影響件数プレビュー（dry-run / count-only）。
// preview は read-only: write / lock / sync_jobs ledger を一切触らない（Phase 2 §2.2 / 不変条件 #3）。
describe("previewResponseSync (issue-1089)", () => {
  let db: FakeD1;
  beforeEach(() => {
    db = new FakeD1();
  });

  it("TC-PV1 件数カウント正常: 1 page 3 件を数え status/dryRun/pagesScanned/capped を返す", async () => {
    const client = makeClient([
      {
        responses: [
          makeResp({ responseId: "r-1", responseEmail: asResponseEmail("a@example.com") }),
          makeResp({ responseId: "r-2", responseEmail: asResponseEmail("b@example.com") }),
          makeResp({ responseId: "r-3", responseEmail: asResponseEmail("c@example.com") }),
        ],
      },
    ]);
    const preview = await previewResponseSync(
      { DB: db as unknown as D1Database, GOOGLE_FORM_ID: "form-1" },
      { client, fullSync: true },
    );
    expect(preview.status).toBe("preview");
    expect(preview.dryRun).toBe(true);
    expect(preview.responseCount).toBe(3);
    expect(preview.pagesScanned).toBe(1);
    expect(preview.capped).toBe(false);
    // PII 非露出: 6 キーのみ（不変条件 #7）
    expect(Object.keys(preview).sort()).toEqual(
      ["capped", "dryRun", "estimatedWrites", "pagesScanned", "responseCount", "status"].sort(),
    );
  });

  it("TC-PV2 responseEmail 欠落は数えない（processResponse skip 相当）", async () => {
    const client = makeClient([
      {
        responses: [
          makeResp({ responseId: "r-1", responseEmail: asResponseEmail("a@example.com") }),
          makeResp({ responseId: "r-2", responseEmail: null as unknown as ReturnType<typeof asResponseEmail> }),
          makeResp({ responseId: "r-3", responseEmail: asResponseEmail("c@example.com") }),
          makeResp({ responseId: "r-4", responseEmail: undefined as unknown as ReturnType<typeof asResponseEmail> }),
          makeResp({ responseId: "r-5", responseEmail: asResponseEmail("e@example.com") }),
        ],
      },
    ]);
    const preview = await previewResponseSync(
      { DB: db as unknown as D1Database, GOOGLE_FORM_ID: "form-1" },
      { client, fullSync: true },
    );
    expect(preview.responseCount).toBe(3);
  });

  it("TC-PV3 highWater フィルタ: readLastCursor の high-water を満たさない response は数えない", async () => {
    // 直近 succeeded sync_jobs に cursor を seed（readLastCursor が返す）
    db.syncJobs.push({
      job_id: "seed-cursor",
      job_type: "response_sync",
      started_at: "2026-01-01T00:00:00Z",
      finished_at: "2026-01-01T00:01:00Z",
      status: "succeeded",
      metrics_json: JSON.stringify({ cursor: "2026-02-01T00:00:00Z|r-mid" }),
      error_json: null,
    });
    const client = makeClient([
      {
        responses: [
          // high-water (2026-02-01|r-mid) 以前 → 除外
          makeResp({ responseId: "r-old", submittedAt: "2026-01-15T00:00:00Z", responseEmail: asResponseEmail("old@example.com") }),
          // 同 submittedAt だが responseId が小さい → 除外
          makeResp({ responseId: "r-aaa", submittedAt: "2026-02-01T00:00:00Z", responseEmail: asResponseEmail("aaa@example.com") }),
          // high-water より後 → 計上
          makeResp({ responseId: "r-new", submittedAt: "2026-03-01T00:00:00Z", responseEmail: asResponseEmail("new@example.com") }),
        ],
      },
    ]);
    const preview = await previewResponseSync(
      { DB: db as unknown as D1Database, GOOGLE_FORM_ID: "form-1" },
      { client, fullSync: false },
    );
    expect(preview.responseCount).toBe(1);
  });

  it("TC-PV4 write が呼ばれない: D1 へ一切書き込まない", async () => {
    const client = makeClient([
      { responses: [makeResp({ responseId: "r-1", responseEmail: asResponseEmail("a@example.com") })] },
    ]);
    await previewResponseSync(
      { DB: db as unknown as D1Database, GOOGLE_FORM_ID: "form-1" },
      { client, fullSync: true },
    );
    expect(db.responses).toHaveLength(0);
    expect(db.identities).toHaveLength(0);
    expect(db.status).toHaveLength(0);
    expect(db.responseFields).toHaveLength(0);
    expect(db.schemaDiff).toHaveLength(0);
    expect(db.tagQueue).toHaveLength(0);
  });

  it("TC-PV5 lock が呼ばれない: sync_locks を取得しない", async () => {
    const client = makeClient([
      { responses: [makeResp({ responseId: "r-1", responseEmail: asResponseEmail("a@example.com") })] },
    ]);
    await previewResponseSync(
      { DB: db as unknown as D1Database, GOOGLE_FORM_ID: "form-1" },
      { client, fullSync: true },
    );
    expect(db.syncLocks).toHaveLength(0);
  });

  it("TC-PV6 ledger が呼ばれない: sync_jobs を start/succeed/fail しない", async () => {
    const client = makeClient([
      { responses: [makeResp({ responseId: "r-1", responseEmail: asResponseEmail("a@example.com") })] },
    ]);
    await previewResponseSync(
      { DB: db as unknown as D1Database, GOOGLE_FORM_ID: "form-1" },
      { client, fullSync: true },
    );
    expect(db.syncJobs).toHaveLength(0);
  });

  it("TC-PV7 capped: 100 page 超で打ち切り capped=true", async () => {
    // 常に nextPageToken を返す client（無限ページ）
    const client = {
      getForm: vi.fn(),
      listResponses: vi.fn(async () => ({
        responses: [makeResp({ responseId: "r", responseEmail: asResponseEmail("x@example.com") })],
        nextPageToken: "next",
      })),
    } as unknown as GoogleFormsClient;
    const preview = await previewResponseSync(
      { DB: db as unknown as D1Database, GOOGLE_FORM_ID: "form-1" },
      { client, fullSync: true },
    );
    expect(preview.capped).toBe(true);
    expect(preview.pagesScanned).toBe(100);
  });

  it("TC-PV8 estimatedWrites 集計: autoPublish off / on で +1 差分", async () => {
    const resp = makeResp({
      responseId: "r-1",
      responseEmail: asResponseEmail("a@example.com"),
      answersByStableKey: { fullName: "山田", publicConsent: "同意します" },
      unmappedQuestionIds: ["q-x"],
    });
    // estimateResponseWrites = 5 + knownCount(2) + unknownCount(1)*2 = 9（off）
    const off = await previewResponseSync(
      { DB: db as unknown as D1Database, GOOGLE_FORM_ID: "form-1" },
      { client: makeClient([{ responses: [resp] }]), fullSync: true },
    );
    expect(off.estimatedWrites).toBe(9);
    const on = await previewResponseSync(
      {
        DB: db as unknown as D1Database,
        GOOGLE_FORM_ID: "form-1",
        MEMBERS_AUTO_PUBLISH_ON_CONSENT: "true",
      },
      { client: makeClient([{ responses: [resp] }]), fullSync: true },
    );
    expect(on.estimatedWrites).toBe(10);
  });

  it("TC-PV9 formId 未設定で throw", async () => {
    const client = makeClient([{ responses: [] }]);
    await expect(
      previewResponseSync(
        { DB: db as unknown as D1Database },
        { client, fullSync: true },
      ),
    ).rejects.toThrow();
  });

  it("TC-PV10 cursor 指定経路: 指定 cursor を since として listResponses に渡す", async () => {
    const listResponses = vi.fn(async () => ({
      responses: [makeResp({ responseId: "r-late", submittedAt: "2026-05-01T00:00:00Z", responseEmail: asResponseEmail("late@example.com") })],
    }));
    const client = {
      getForm: vi.fn(),
      listResponses,
    } as unknown as GoogleFormsClient;
    await previewResponseSync(
      { DB: db as unknown as D1Database, GOOGLE_FORM_ID: "form-1" },
      { client, cursor: "2026-04-01T00:00:00Z|r-base" },
    );
    expect(listResponses).toHaveBeenCalledWith(
      "form-1",
      expect.objectContaining({ since: "2026-04-01T00:00:00Z" }),
    );
  });
});
