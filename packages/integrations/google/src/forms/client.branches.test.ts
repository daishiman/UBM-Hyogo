import { describe, expect, it, vi } from "vitest";

import {
  createGoogleFormsClient,
  defaultQuestionIdMap,
  defaultSchemaHash,
} from "./client";
import type { RawForm } from "./mapper";

const env = { FORMS_SA_EMAIL: "sa@p.iam", FORMS_SA_KEY: "KEY" };

const tokenResponse = () =>
  new Response(JSON.stringify({ access_token: "tok", expires_in: 3600 }), {
    status: 200,
  });

const formBody = {
  formId: "form_1",
  info: { title: "T" },
  revisionId: "rev-1",
  items: [
    {
      itemId: "i_1",
      title: "お名前（フルネーム）",
      questionItem: { question: { questionId: "q_1" } },
    },
  ],
};

describe("defaultSchemaHash / defaultQuestionIdMap (exported helpers)", () => {
  it("hashes empty items deterministically", () => {
    expect(defaultSchemaHash({ formId: "f" })).toMatch(/^sha-/);
  });

  it("hashes differs by item content", () => {
    const a = defaultSchemaHash({
      formId: "f",
      items: [{ itemId: "i", title: "A" }],
    } as RawForm);
    const b = defaultSchemaHash({
      formId: "f",
      items: [{ itemId: "i", title: "B" }],
    } as RawForm);
    expect(a).not.toBe(b);
  });

  it("defaultQuestionIdMap maps qid → title and skips items without title or qid", () => {
    const map = defaultQuestionIdMap({
      formId: "f",
      items: [
        { itemId: "i_1", title: "Q1", questionItem: { question: { questionId: "q_1" } } },
        { itemId: "i_2", questionItem: { question: { questionId: "q_2" } } }, // no title
        { itemId: "i_3", title: "Q3", questionItem: { question: {} } }, // no qid
      ],
    } as RawForm);
    expect(map).toEqual({ q_1: "Q1" });
  });
});

describe("createGoogleFormsClient error path coverage", () => {
  it("throws non-retryable error for non-ok response with body", async () => {
    const fetchImpl = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes("oauth2.googleapis.com")) return tokenResponse();
      return new Response("forbidden", { status: 403, statusText: "Forbidden" });
    }) as unknown as typeof fetch;
    const client = createGoogleFormsClient(env, {
      fetchImpl,
      authDeps: {
        fetchImpl,
        signer: { sign: async () => "jwt" },
        now: () => 0,
      },
      backoff: { maxRetry: 0, sleep: async () => {} },
      now: () => new Date("2026-04-30T00:00:00Z"),
    });
    await expect(client.getForm("form_1")).rejects.toThrow(/403.*forbidden/);
  });

  it("listResponses returns no nextPageToken when API omits it", async () => {
    const fetchImpl = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes("oauth2")) return tokenResponse();
      if (u.includes("/responses")) {
        return new Response(JSON.stringify({ responses: [] }), { status: 200 });
      }
      return new Response(JSON.stringify(formBody), { status: 200 });
    }) as unknown as typeof fetch;
    const client = createGoogleFormsClient(env, {
      fetchImpl,
      authDeps: {
        fetchImpl,
        signer: { sign: async () => "jwt" },
        now: () => 0,
      },
      backoff: { maxRetry: 0, sleep: async () => {} },
      now: () => new Date("2026-04-30T00:00:00Z"),
    });
    const out = await client.listResponses("form_1");
    expect(out.responses).toEqual([]);
    expect(out).not.toHaveProperty("nextPageToken");
  });

  it("listResponses applies pageToken and since query params via default qid map", async () => {
    const calls: string[] = [];
    const fetchImpl = vi.fn(async (url) => {
      const u = String(url);
      calls.push(u);
      if (u.includes("oauth2")) return tokenResponse();
      if (u.includes("/responses")) {
        return new Response(
          JSON.stringify({
            responses: [
              {
                responseId: "r_1",
                lastSubmittedTime: "2026-04-30T00:00:00Z",
                respondentEmail: null,
                answers: {
                  q_1: { textAnswers: { answers: [{ value: "山田" }] } },
                },
              },
            ],
          }),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify(formBody), { status: 200 });
    }) as unknown as typeof fetch;
    const client = createGoogleFormsClient(env, {
      fetchImpl,
      authDeps: {
        fetchImpl,
        signer: { sign: async () => "jwt" },
        now: () => 0,
      },
      backoff: { maxRetry: 0, sleep: async () => {} },
      now: () => new Date("2026-04-30T00:00:00Z"),
      // omit questionIdToStableKey to exercise the default inline mapper
    });
    const out = await client.listResponses("form_1", {
      pageToken: "pt",
      since: "2026-04-29T00:00:00Z",
    });
    expect(out.responses).toHaveLength(1);
    expect(calls.some((u) => u.includes("pageToken=pt"))).toBe(true);
    expect(calls.some((u) => u.includes("filter=timestamp"))).toBe(true);
  });
});
