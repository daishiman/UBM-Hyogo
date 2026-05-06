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
  ...overrides,
});

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
    const res = await app.request("/public/form-preview", {}, env);
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
    const res = await app.request("/public/stats", {}, env);
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
    const res = await app.request("/public/members?page=1&limit=24", {}, env);
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
      {},
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
    });
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
    const res = await app.request("/public/members/m-missing", {}, env);
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
      }),
    });
    const res = await app.request("/public/members/m-1", {}, env);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
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
    const res = await app.request("/public/form-preview", {}, env);
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
