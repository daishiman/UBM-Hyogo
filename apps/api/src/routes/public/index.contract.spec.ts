// UT-08A-01: public router 直叩き unit test。
// 4 endpoint の Cache-Control と auth 非依存（session middleware 未適用）を確認する。
import { describe, expect, it } from "vitest";
import { Hono } from "hono";

import { createPublicRouter } from "./index";
import apiWorker from "../../index";
import { errorHandler } from "../../middleware/error-handler";
import {
  buildMeetingRow,
  buildMemberResponseRow,
  buildMemberStatusRow,
  buildAttendanceJoinRow,
  buildPublicMemberRow,
  buildResponseFieldRow,
  buildSchemaQuestionRow,
  buildSchemaVersionRow,
  buildSyncJobRow,
  createPublicD1Mock,
} from "../../use-cases/public/__tests__/helpers/public-d1";

const buildEnv = (overrides: Record<string, unknown> = {}) => ({
  GOOGLE_FORM_ID: "form-test",
  FORM_ID: "form-test",
  GOOGLE_FORM_RESPONDER_URL: "https://example.test/respond",
  INTERNAL_AUTH_SECRET: "internal-secret",
  ...overrides,
});

const publicHeaders = { headers: { "X-Internal-Auth": "internal-secret" } };

describe("createPublicRouter", () => {
  it("GET /form-preview は 200 と Cache-Control: public, max-age=60 を返す", async () => {
    const app = new Hono();
    app.onError(errorHandler);
    app.route("/public", createPublicRouter());
    const env = buildEnv({
      DB: createPublicD1Mock({
        latestVersion: buildSchemaVersionRow(),
        schemaFields: [buildSchemaQuestionRow()],
      }),
    });
    const res = await app.request("/public/form-preview", publicHeaders, env);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("public, max-age=60");
  });

  it("GET /stats は 200 と Cache-Control: public, max-age=60 を返す", async () => {
    const app = new Hono();
    app.onError(errorHandler);
    app.route("/public", createPublicRouter());
    const env = buildEnv({
      DB: createPublicD1Mock({
        publicMembers: [],
        publicMemberCount: 0,
        meetings: [buildMeetingRow()],
        syncJobs: {
          schema_sync: buildSyncJobRow(),
          response_sync: buildSyncJobRow({ jobType: "response_sync" }),
        },
      }),
    });
    const res = await app.request("/public/stats", publicHeaders, env);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("public, max-age=60");
  });

  it("GET /members は 200 と Cache-Control: no-store を返す（session middleware 非依存）", async () => {
    const app = new Hono();
    app.onError(errorHandler);
    app.route("/public", createPublicRouter());
    const env = buildEnv({
      DB: createPublicD1Mock({
        publicMembers: [
          buildPublicMemberRow({ member_id: "m-1", current_response_id: "r-1" }),
        ],
        publicMemberCount: 1,
        responseFieldsByResponseId: {
          "r-1": [buildResponseFieldRow()],
        },
      }),
    });
    const res = await app.request("/public/members?page=1&limit=24", publicHeaders, env);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("GET /members は 6 query parameter を appliedQuery に反映する", async () => {
    const app = new Hono();
    app.onError(errorHandler);
    app.route("/public", createPublicRouter());
    const env = buildEnv({
      DB: createPublicD1Mock({
        publicMembers: [
          buildPublicMemberRow({ member_id: "m-1", current_response_id: "r-1" }),
        ],
        publicMemberCount: 1,
        responseFieldsByResponseId: {
          "r-1": [buildResponseFieldRow()],
        },
      }),
    });
    const res = await app.request(
      "/public/members?q=%20hello%20%20world%20&zone=1_to_10&status=member&tag=ai&tag=dx&sort=name&density=dense&page=2&limit=500",
      publicHeaders,
      env,
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      appliedQuery: {
        q: "hello world",
        zone: "1_to_10",
        status: "member",
        tags: ["ai", "dx"],
        sort: "name",
        density: "dense",
      },
      pagination: {
        page: 2,
        limit: 100,
      },
      topTags: [],
    });
  });

  it("GET /members は topTags 集計結果を返す（issue-276）", async () => {
    const app = new Hono();
    app.onError(errorHandler);
    app.route("/public", createPublicRouter());
    const env = buildEnv({
      DB: createPublicD1Mock({
        publicMembers: [
          buildPublicMemberRow({ member_id: "m-1", current_response_id: "r-1" }),
        ],
        publicMemberCount: 1,
        responseFieldsByResponseId: {
          "r-1": [buildResponseFieldRow()],
        },
        topTags: [
          { code: "ai", label: "AI", count: 3 },
          { code: "design", label: "デザイン", count: 1 },
        ],
      }),
    });
    const res = await app.request("/public/members", publicHeaders, env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { topTags: Array<{ code: string; count: number }> };
    expect(body.topTags).toEqual([
      { code: "ai", label: "AI", count: 3 },
      { code: "design", label: "デザイン", count: 1 },
    ]);
  });

  it("GET /members は写真登録済み member に presigned photoUrl を返す（issue-1029）", async () => {
    const app = new Hono();
    app.onError(errorHandler);
    app.route("/public", createPublicRouter());
    const env = buildEnv({
      DB: createPublicD1Mock({
        publicMembers: [
          buildPublicMemberRow({ member_id: "m-1", current_response_id: "r-1" }),
          buildPublicMemberRow({ member_id: "m-2", current_response_id: "r-2" }),
        ],
        publicMemberCount: 2,
        responseFieldsByResponseId: {
          "r-1": [buildResponseFieldRow({ response_id: "r-1" })],
          "r-2": [
            buildResponseFieldRow({
              response_id: "r-2",
              value_json: JSON.stringify("写真なし"),
            }),
          ],
        },
        memberPhotosById: {
          "m-1": { member_id: "m-1", object_key: "members/m-1/avatar" },
        },
      }),
      R2_ACCOUNT_ID: "account-id",
      R2_ACCESS_KEY_ID: "access-key-id",
      R2_SECRET_ACCESS_KEY: "secret-access-key",
      MEMBER_PHOTOS: {} as R2Bucket,
      ENVIRONMENT: "staging",
    });
    const res = await app.request("/public/members", publicHeaders, env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      items: Array<{ memberId: string; photoUrl?: string }>;
    };
    const withPhoto = body.items.find((item) => item.memberId === "m-1");
    const withoutPhoto = body.items.find((item) => item.memberId === "m-2");
    expect(withPhoto?.photoUrl).toContain(
      "https://account-id.r2.cloudflarestorage.com/ubm-hyogo-member-photos-staging/members/m-1/avatar",
    );
    expect(withoutPhoto?.photoUrl).toBeUndefined();
  });

  // TC-6 (issue-224): expand=tags で公開 member のみ tags を持ち、leak しない
  it("GET /members?expand=tags は公開 member の tags(code/label/category) を返す", async () => {
    const app = new Hono();
    app.onError(errorHandler);
    app.route("/public", createPublicRouter());
    const env = buildEnv({
      DB: createPublicD1Mock({
        publicMembers: [
          buildPublicMemberRow({ member_id: "m-1", current_response_id: "r-1" }),
        ],
        publicMemberCount: 1,
        responseFieldsByResponseId: {
          "r-1": [
            buildResponseFieldRow({
              stable_key: "fullName",
              value_json: JSON.stringify("田中 太郎"),
            }),
          ],
        },
        // Phase 5 で batch 分岐が参照する fixture（member_id キー）。
        tagsByMemberId: {
          "m-1": [
            {
              member_id: "m-1",
              tag_id: "tag-web",
              source: "forms",
              confidence: null,
              assigned_at: "2024-01-01T00:00:00Z",
              assigned_by: null,
              code: "web",
              label: "Web",
              category: "skill",
              source_stable_keys_json: "[]",
              active: 1,
            },
          ],
          // m-9 は publicMembers に含めない＝visibility filter 外。batch には渡らず leak しない。
          "m-9": [
            {
              member_id: "m-9",
              tag_id: "tag-secret",
              code: "secret",
              label: "秘",
              category: "hidden",
              source: "forms",
              confidence: null,
              assigned_at: "2024-01-01T00:00:00Z",
              assigned_by: null,
              source_stable_keys_json: "[]",
              active: 1,
            },
          ],
        },
      }),
    });
    const res = await app.request("/public/members?expand=tags", publicHeaders, env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      items: Array<{ memberId: string; tags?: Array<{ code: string }> }>;
    };
    expect(body.items).toHaveLength(1);
    expect(body.items[0]?.tags).toEqual([
      { code: "web", label: "Web", category: "skill" },
    ]);
    expect(JSON.stringify(body.items).includes("secret")).toBe(false); // leak しない
  });

  // TC-7 (issue-224): appliedQuery は 6 キー固定（expand を含めない）
  it("GET /members?expand=tags でも appliedQuery は 6 キー固定（expand を出さない）", async () => {
    const app = new Hono();
    app.onError(errorHandler);
    app.route("/public", createPublicRouter());
    const env = buildEnv({
      DB: createPublicD1Mock({
        publicMembers: [
          buildPublicMemberRow({ member_id: "m-1", current_response_id: "r-1" }),
        ],
        publicMemberCount: 1,
        responseFieldsByResponseId: { "r-1": [buildResponseFieldRow()] },
        tagsByMemberId: { "m-1": [] },
      }),
    });
    const res = await app.request("/public/members?expand=tags&q=test", publicHeaders, env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { appliedQuery: Record<string, unknown> };
    expect(Object.keys(body.appliedQuery).sort()).toEqual(
      ["density", "q", "sort", "status", "tags", "zone"].sort(),
    );
    expect(body.appliedQuery).not.toHaveProperty("expand");
  });

  it("GET /members は expand 未指定なら tags key を出さない", async () => {
    const app = new Hono();
    app.onError(errorHandler);
    app.route("/public", createPublicRouter());
    const env = buildEnv({
      DB: createPublicD1Mock({
        publicMembers: [
          buildPublicMemberRow({ member_id: "m-1", current_response_id: "r-1" }),
        ],
        publicMemberCount: 1,
        responseFieldsByResponseId: { "r-1": [buildResponseFieldRow()] },
        tagsByMemberId: {
          "m-1": [
            {
              member_id: "m-1",
              tag_id: "tag-web",
              source: "forms",
              confidence: null,
              assigned_at: "2024-01-01T00:00:00Z",
              assigned_by: null,
              code: "web",
              label: "Web",
              category: "skill",
              source_stable_keys_json: "[]",
              active: 1,
            },
          ],
        },
      }),
    });
    const res = await app.request("/public/members", publicHeaders, env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: Array<Record<string, unknown>> };
    expect(body.items[0]).not.toHaveProperty("tags");
  });

  it("GET /members normalizes comma and repeated expand values at the route boundary", async () => {
    const app = new Hono();
    app.onError(errorHandler);
    app.route("/public", createPublicRouter());
    const env = buildEnv({
      DB: createPublicD1Mock({
        publicMembers: [
          buildPublicMemberRow({ member_id: "m-1", current_response_id: "r-1" }),
        ],
        publicMemberCount: 1,
        responseFieldsByResponseId: { "r-1": [buildResponseFieldRow()] },
        tagsByMemberId: {
          "m-1": [
            {
              member_id: "m-1",
              tag_id: "tag-web",
              source: "forms",
              confidence: null,
              assigned_at: "2024-01-01T00:00:00Z",
              assigned_by: null,
              code: "web",
              label: "Web",
              category: "skill",
              source_stable_keys_json: "[]",
              active: 1,
            },
          ],
        },
      }),
    });
    const res = await app.request(
      "/public/members?expand=tags,unknown&expand=tags",
      publicHeaders,
      env,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      items: Array<{ tags?: Array<{ code: string; label: string; category: string }> }>;
    };
    expect(body.items[0]?.tags).toEqual([
      { code: "web", label: "Web", category: "skill" },
    ]);
  });

  it("GET /members/:memberId は不適格なら 404 (UBM-1404)", async () => {
    const app = new Hono();
    app.onError(errorHandler);
    app.route("/public", createPublicRouter());
    const env = buildEnv({
      DB: createPublicD1Mock({
        memberStatusById: {},
      }),
    });
    const res = await app.request("/public/members/m-missing", publicHeaders, env);
    expect(res.status).toBe(404);
  });

  it("GET /members/:memberId は公開 member に対し 200 と Cache-Control: no-store を返す", async () => {
    const app = new Hono();
    app.onError(errorHandler);
    app.route("/public", createPublicRouter());
    const env = buildEnv({
      DB: createPublicD1Mock({
        memberStatusById: { "m-1": buildMemberStatusRow({ member_id: "m-1" }) },
        currentResponseByMemberId: { "m-1": buildMemberResponseRow() },
        responseFieldsByResponseId: {
          "r-1": [buildResponseFieldRow()],
        },
        schemaFields: [buildSchemaQuestionRow()],
        tagsByMemberId: { "m-1": [] },
        attendanceByMemberId: {
          "m-1": [
            buildAttendanceJoinRow({
              session_id: "s-1",
              title: "定例会 1",
              held_on: "2026-03-15",
            }),
          ],
        },
      }),
    });
    const res = await app.request("/public/members/m-1", publicHeaders, env);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    await expect(res.json()).resolves.toMatchObject({
      memberId: "m-1",
      attendance: [{ sessionId: "s-1", title: "定例会 1", heldOn: "2026-03-15" }],
    });
  });

  it("GET /members/:memberId は写真登録済み member に presigned photoUrl を返す（issue-1029）", async () => {
    const app = new Hono();
    app.onError(errorHandler);
    app.route("/public", createPublicRouter());
    const env = buildEnv({
      DB: createPublicD1Mock({
        memberStatusById: { "m-1": buildMemberStatusRow({ member_id: "m-1" }) },
        currentResponseByMemberId: { "m-1": buildMemberResponseRow() },
        responseFieldsByResponseId: {
          "r-1": [buildResponseFieldRow()],
        },
        schemaFields: [buildSchemaQuestionRow()],
        tagsByMemberId: { "m-1": [] },
        memberPhotosById: {
          "m-1": {
            member_id: "m-1",
            object_key: "members/m-1/avatar",
            content_type: "image/png",
            byte_size: 1234,
            uploaded_by: "admin-1",
            uploaded_at: "2026-05-31T00:00:00.000Z",
          },
        },
      }),
      R2_ACCOUNT_ID: "account-id",
      R2_ACCESS_KEY_ID: "access-key-id",
      R2_SECRET_ACCESS_KEY: "secret-access-key",
      MEMBER_PHOTOS: {} as R2Bucket,
      ENVIRONMENT: "staging",
    });
    const res = await app.request("/public/members/m-1", publicHeaders, env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { photoUrl?: string };
    expect(body.photoUrl).toContain(
      "https://account-id.r2.cloudflarestorage.com/ubm-hyogo-member-photos-staging/members/m-1/avatar",
    );
  });

  it("GET /members/:memberId は公開 gate 不通過なら写真行があっても 404（issue-1029）", async () => {
    const app = new Hono();
    app.onError(errorHandler);
    app.route("/public", createPublicRouter());
    const env = buildEnv({
      DB: createPublicD1Mock({
        memberStatusById: {
          "m-2": buildMemberStatusRow({
            member_id: "m-2",
            publish_state: "member_only",
          }),
        },
        memberPhotosById: {
          "m-2": {
            member_id: "m-2",
            object_key: "members/m-2/avatar",
            content_type: "image/png",
            byte_size: 1234,
            uploaded_by: "admin-1",
            uploaded_at: "2026-05-31T00:00:00.000Z",
          },
        },
      }),
      R2_ACCOUNT_ID: "account-id",
      R2_ACCESS_KEY_ID: "access-key-id",
      R2_SECRET_ACCESS_KEY: "secret-access-key",
      MEMBER_PHOTOS: {} as R2Bucket,
      ENVIRONMENT: "staging",
    });
    const res = await app.request("/public/members/m-2", publicHeaders, env);
    expect(res.status).toBe(404);
  });

  // TC-RED-03 / TC-REG-01: schema_versions 欠落で use-case が UBM-5500 を throw すると
  // route mapping は HTTP 503 を返し、成功時 Cache-Control: public, max-age=60 を漏らさない。
  it("GET /form-preview は schema_versions 欠落時に UBM-5500 (HTTP 503) を返す", async () => {
    const app = new Hono();
    app.onError(errorHandler);
    app.route("/public", createPublicRouter());
    const env = buildEnv({
      DB: createPublicD1Mock({ latestVersion: null }),
    });
    const res = await app.request("/public/form-preview", publicHeaders, env);
    expect(res.status).toBe(503);
    // 成功時 Cache-Control が誤って付与されていないこと（503 は no-store/未設定どちらでも可）
    expect(res.headers.get("cache-control")).not.toBe("public, max-age=60");
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.code).toBe("UBM-5500");
    expect(body.status).toBe(503);
  });

  it("実アプリ組み込みでも /public/* は session guard なしで到達できる", async () => {
    const res = await apiWorker.fetch(
      new Request("https://api.example.test/public/healthz"),
      buildEnv({ DB: createPublicD1Mock() }) as never,
      {} as never,
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, scope: "public" });
  });
});
