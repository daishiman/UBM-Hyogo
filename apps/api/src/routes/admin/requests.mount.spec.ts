// @vitest-environment node
// workflow: docs/30-workflows/completed-tasks/admin-requests-prototype-alignment-and-404-fix
// Task A — `/admin/requests` mount drift regression gate (TC-A-06)
//
// 既存 `requests.contract.spec.ts` は `createAdminRequestsRoute()` を直接呼ぶため
// `apps/api/src/index.ts` から `adminRequestsRoute` mount が落ちても通ってしまう。
// 本 spec は worker entry `app.fetch` 経由で `/admin/requests` を叩き、
// dispatch 自体が 404 にならない（auth 段で 401 まで進む）ことを保証する。
import { describe, expect, it } from "vitest";
import worker from "../../index";

const buildCtx = (): ExecutionContext =>
  ({
    waitUntil: () => undefined,
    passThroughOnException: () => undefined,
  }) as unknown as ExecutionContext;

const buildEnv = (): Record<string, unknown> => ({
  ENVIRONMENT: "development",
});

describe("admin requests route — mount drift gate (TC-A-06)", () => {
  it("GET /admin/requests dispatches to admin route (not 404)", async () => {
    const req = new Request(
      "https://example.test/admin/requests?status=pending&type=visibility_request",
      { method: "GET" },
    );
    const res = await worker.fetch(req, buildEnv() as never, buildCtx());
    // mount が落ちると 404 (notFoundHandler) になる。requireAdmin まで届けば 401。
    expect(res.status).not.toBe(404);
    expect([401, 403, 500]).toContain(res.status);
  });

  it("POST /admin/requests/:noteId/resolve dispatches to admin route (not 404)", async () => {
    const req = new Request(
      "https://example.test/admin/requests/note_x/resolve",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resolution: "approve" }),
      },
    );
    const res = await worker.fetch(req, buildEnv() as never, buildCtx());
    expect(res.status).not.toBe(404);
    expect([401, 403, 500]).toContain(res.status);
  });

  it("GET /admin/requests with invalid query is rejected at auth or zod, not as 404 dispatch miss", async () => {
    const req = new Request("https://example.test/admin/requests", {
      method: "GET",
    });
    const res = await worker.fetch(req, buildEnv() as never, buildCtx());
    expect(res.status).not.toBe(404);
  });
});
