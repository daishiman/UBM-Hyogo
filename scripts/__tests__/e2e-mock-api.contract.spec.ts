// Contract test for scripts/e2e-mock-api.mjs.
// 起動した mock を実 HTTP で叩き、packages/contracts の zod schema で再 parse する。
// AC-1..AC-5 / AC-6（既存 E2E green 維持）/ AC-7（型・lint・coverage）を unit 段で先回り検出。
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { spawn, type ChildProcess } from "node:child_process";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — package exports plain ESM .mjs without .d.ts
import { schemas } from "../../packages/contracts/src/index.mjs";

const PORT = 38901;
const BASE = `http://127.0.0.1:${PORT}`;
let mock: ChildProcess | undefined;

const waitForReady = async (): Promise<void> => {
  for (let i = 0; i < 30; i++) {
    try {
      const r = await fetch(`${BASE}/health`);
      if (r.ok) return;
    } catch {
      /* not ready */
    }
    await new Promise((res) => setTimeout(res, 200));
  }
  throw new Error("mock not ready after 30 attempts");
};

beforeAll(async () => {
  mock = spawn("node", ["scripts/e2e-mock-api.mjs"], {
    env: { ...process.env, E2E_MOCK_API_PORT: String(PORT) },
    stdio: "ignore",
  });
  await waitForReady();
}, 20_000);

afterAll(() => {
  mock?.kill("SIGTERM");
});

beforeEach(async () => {
  await fetch(`${BASE}/__test__/reset`, { method: "POST" });
});

describe("contract: /health", () => {
  it("200 + status:ok を返す", async () => {
    const r = await fetch(`${BASE}/health`);
    expect(r.status).toBe(200);
    const body = (await r.json()) as { status: string };
    expect(body.status).toBe("ok");
  });
});

describe("contract: /me", () => {
  it("GET /me が MeResponseZ を満たす", async () => {
    const r = await fetch(`${BASE}/me`);
    expect(r.status).toBe(200);
    const body = await r.json(); expect(() => schemas.MeResponseZ.parse(body)).not.toThrow();
  });
  it("GET /me/profile が MeProfileResponseZ を満たす", async () => {
    const r = await fetch(`${BASE}/me/profile`);
    expect(r.status).toBe(200);
    const body = await r.json(); expect(() => schemas.MeProfileResponseZ.parse(body)).not.toThrow();
  });
  it("POST /me/visibility-request が valid body で 202 + MeQueueAcceptedResponseZ", async () => {
    const r = await fetch(`${BASE}/me/visibility-request`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ desiredState: "hidden", reason: "test" }),
    });
    expect(r.status).toBe(202);
    const body = await r.json(); expect(() => schemas.MeQueueAcceptedResponseZ.parse(body)).not.toThrow();
  });
  it("POST /me/delete-request が valid body で 202", async () => {
    const r = await fetch(`${BASE}/me/delete-request`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason: "test" }),
    });
    expect(r.status).toBe(202);
    const body = await r.json(); expect(() => schemas.MeQueueAcceptedResponseZ.parse(body)).not.toThrow();
  });
});

const publicCases = [
  ["/public/stats", "PublicStatsZ"],
  ["/public/members", "PublicMemberListZ"],
  ["/public/members/m-1", "PublicMemberDetailZ"],
  ["/public/form-preview", "PublicFormPreviewZ"],
] as const;

describe.each(publicCases)("contract: GET %s", (path, schemaName) => {
  it(`${schemaName} を満たす`, async () => {
    const r = await fetch(`${BASE}${path}`);
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(() =>
      (
        schemas as Record<string, { parse: (v: unknown) => unknown }>
      )[schemaName].parse(body),
    ).not.toThrow();
  });
});

describe("contract: /public/members negative query", () => {
  it("zzz_no_match_zzz は 0 件を返す", async () => {
    const r = await fetch(`${BASE}/public/members?q=zzz_no_match_zzz`);
    const body = (await r.json()) as { items: unknown[] };
    expect(body.items.length).toBe(0);
  });
});

const adminCases = [
  ["/admin/dashboard", "AdminDashboardZ"],
  ["/admin/members", "AdminMemberListZ"],
  ["/admin/members/m-1", "AdminMemberDetailZ"],
  ["/admin/tags/queue", "AdminTagQueueZ"],
  ["/admin/schema", "AdminSchemaZ"],
  ["/admin/schema/diff", "AdminSchemaDiffZ"],
  ["/admin/meetings", "AdminMeetingListZ"],
  ["/admin/meetings/sess-1", "AdminMeetingDetailZ"],
  ["/admin/requests", "AdminRequestListZ"],
  ["/admin/identity-conflicts", "IdentityConflictListZ"],
  ["/admin/audit", "AdminAuditListZ"],
] as const;

describe.each(adminCases)("contract: GET %s", (path, schemaName) => {
  it(`${schemaName} を満たす`, async () => {
    const r = await fetch(`${BASE}${path}`);
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(() =>
      (
        schemas as Record<string, { parse: (v: unknown) => unknown }>
      )[schemaName].parse(body),
    ).not.toThrow();
  });
});

describe("contract: identity-conflicts mutation", () => {
  it("POST merge が valid body で 200 + MergeIdentityResponseZ", async () => {
    const r = await fetch(`${BASE}/admin/identity-conflicts/cf_001/merge`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ targetMemberId: "m_dst_01", reason: "duplicate" }),
    });
    expect(r.status).toBe(200);
    const body = await r.json(); expect(() => schemas.MergeIdentityResponseZ.parse(body)).not.toThrow();
  });
  it("POST merge で targetMemberId 欠落は 400", async () => {
    const r = await fetch(`${BASE}/admin/identity-conflicts/cf_001/merge`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason: "broken" }),
    });
    expect(r.status).toBe(400);
  });
  it("POST dismiss が valid body で 200 + DismissIdentityConflictResponseZ", async () => {
    const r = await fetch(`${BASE}/admin/identity-conflicts/cf_001/dismiss`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason: "false-positive" }),
    });
    expect(r.status).toBe(200);
    const body = await r.json(); expect(() => schemas.DismissIdentityConflictResponseZ.parse(body)).not.toThrow();
  });
  it("POST dismiss で reason 欠落は 400", async () => {
    const r = await fetch(`${BASE}/admin/identity-conflicts/cf_001/dismiss`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(r.status).toBe(400);
  });
});

describe("contract: admin member PATCH", () => {
  it("PATCH /admin/members/m-1 が 200 + AdminMemberPatchResponseZ", async () => {
    const r = await fetch(`${BASE}/admin/members/m-1`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ visibility: "hidden" }),
    });
    expect(r.status).toBe(200);
    const body = await r.json(); expect(() => schemas.AdminMemberPatchResponseZ.parse(body)).not.toThrow();
  });
});

describe("contract: 未定義 path/method の 404 化（{ok:true} fallthrough 廃止）", () => {
  it("GET 未定義 path は 404", async () => {
    const r = await fetch(`${BASE}/no-such-path`);
    expect(r.status).toBe(404);
  });
  it("POST 未定義 path は 404", async () => {
    const r = await fetch(`${BASE}/no-such-mutation`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(r.status).toBe(404);
  });
});
