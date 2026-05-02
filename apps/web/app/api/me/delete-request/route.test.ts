import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import {
  AuthRequiredError,
  FetchAuthedError,
  fetchAuthed,
} from "../../../../src/lib/fetch/authed";

vi.mock("../../../../src/lib/fetch/authed", () => {
  class MockAuthRequiredError extends Error {
    constructor() {
      super("AUTH_REQUIRED");
      this.name = "AuthRequiredError";
    }
  }
  class MockFetchAuthedError extends Error {
    readonly status: number;
    readonly bodyText: string;
    constructor(status: number, bodyText: string) {
      super(`fetchAuthed failed: ${status}`);
      this.name = "FetchAuthedError";
      this.status = status;
      this.bodyText = bodyText;
    }
  }
  return {
    AuthRequiredError: MockAuthRequiredError,
    FetchAuthedError: MockFetchAuthedError,
    fetchAuthed: vi.fn(),
  };
});

const mockedFetchAuthed = vi.mocked(fetchAuthed);

const jsonRequest = (body = "") =>
  new Request("http://localhost/api/me/delete-request", {
    method: "POST",
    body,
    headers: { "content-type": "application/json" },
  });

afterEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/me/delete-request", () => {
  it("forwards JSON body to upstream /me/delete-request and returns 202", async () => {
    mockedFetchAuthed.mockResolvedValueOnce({
      queueId: "q1",
      type: "delete_request",
      status: "pending",
      createdAt: "2026-05-02T00:00:00.000Z",
    });

    const res = await POST(jsonRequest(JSON.stringify({ reason: "move" })));

    expect(res.status).toBe(202);
    expect(mockedFetchAuthed).toHaveBeenCalledWith("/me/delete-request", {
      method: "POST",
      body: JSON.stringify({ reason: "move" }),
      headers: { "content-type": "application/json" },
    });
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ queueId: "q1", type: "delete_request" }),
    );
  });

  it("accepts empty body as an empty object", async () => {
    mockedFetchAuthed.mockResolvedValueOnce({
      queueId: "q1",
      type: "delete_request",
      status: "pending",
      createdAt: "2026-05-02T00:00:00.000Z",
    });

    const res = await POST(jsonRequest());

    expect(res.status).toBe(202);
    expect(mockedFetchAuthed).toHaveBeenCalledWith(
      "/me/delete-request",
      expect.objectContaining({ body: "{}" }),
    );
  });

  it("returns 422 for invalid JSON without calling upstream", async () => {
    const res = await POST(jsonRequest("{"));

    expect(res.status).toBe(422);
    expect(mockedFetchAuthed).not.toHaveBeenCalled();
  });

  it("maps AuthRequiredError to 401", async () => {
    mockedFetchAuthed.mockRejectedValueOnce(new AuthRequiredError());

    const res = await POST(jsonRequest());

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "UNAUTHORIZED" });
  });

  it("passes through upstream status and body", async () => {
    mockedFetchAuthed.mockRejectedValueOnce(
      new FetchAuthedError(429, '{"error":"RATE_LIMITED"}'),
    );

    const res = await POST(jsonRequest());

    expect(res.status).toBe(429);
    await expect(res.json()).resolves.toEqual({ error: "RATE_LIMITED" });
  });
});
