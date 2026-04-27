import { describe, expect, it, vi } from "vitest";

import { createGoogleFormsClient } from "./client";

const env = { FORMS_SA_EMAIL: "sa@p.iam", FORMS_SA_KEY: "KEY" };

const tokenResponse = () =>
  new Response(
    JSON.stringify({ access_token: "tok", expires_in: 3600 }),
    { status: 200 },
  );

const formResponseBody = {
  formId: "form_1",
  info: { title: "UBM Form" },
  revisionId: "rev-1",
  responderUri: "https://docs.google.com/forms/x",
  items: [
    {
      itemId: "i_1",
      title: "お名前（フルネーム）",
      questionItem: { question: { questionId: "q_1", required: true } },
    },
    {
      itemId: "i_2",
      title: "UBM区画",
      questionItem: {
        question: {
          questionId: "q_2",
          required: true,
          choiceQuestion: { options: [{ value: "0_to_1" }, { value: "1_to_10" }] },
        },
      },
    },
  ],
};

describe("createGoogleFormsClient.getForm (AC-8)", () => {
  it("auth → forms.get → mapped FormSchema", async () => {
    const fetchImpl = vi
      .fn()
      .mockImplementationOnce(async () => tokenResponse())
      .mockImplementationOnce(
        async () => new Response(JSON.stringify(formResponseBody), { status: 200 }),
      ) as unknown as typeof fetch;
    const client = createGoogleFormsClient(env, {
      fetchImpl,
      authDeps: {
        fetchImpl,
        signer: { sign: async () => "jwt" },
        now: () => 0,
      },
      backoff: { maxRetry: 0, sleep: async () => {} },
      now: () => new Date("2026-04-27T00:00:00Z"),
    });
    const schema = await client.getForm("form_1");
    expect(schema.manifest.formId).toBe("form_1");
    expect(schema.fields).toHaveLength(2);
    expect(schema.fields[0].label).toBe("お名前（フルネーム）");
  });
});

describe("createGoogleFormsClient retry (AC-9)", () => {
  it("retries on 429 then succeeds", async () => {
    let formAttempt = 0;
    const fetchImpl = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes("oauth2.googleapis.com")) return tokenResponse();
      formAttempt += 1;
      if (formAttempt === 1) return new Response("rate", { status: 429 });
      return new Response(JSON.stringify(formResponseBody), { status: 200 });
    }) as unknown as typeof fetch;
    const client = createGoogleFormsClient(env, {
      fetchImpl,
      authDeps: {
        fetchImpl,
        signer: { sign: async () => "jwt" },
        now: () => 0,
      },
      backoff: { maxRetry: 3, baseMs: 1, sleep: async () => {}, jitter: () => 0 },
      now: () => new Date(),
    });
    const schema = await client.getForm("form_1");
    expect(schema.fields).toHaveLength(2);
  });

  it("throws after exhausting retries on 5xx", async () => {
    const fetchImpl = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes("oauth2.googleapis.com")) return tokenResponse();
      return new Response("err", { status: 503 });
    }) as unknown as typeof fetch;
    const client = createGoogleFormsClient(env, {
      fetchImpl,
      authDeps: {
        fetchImpl,
        signer: { sign: async () => "jwt" },
        now: () => 0,
      },
      backoff: { maxRetry: 2, baseMs: 1, sleep: async () => {}, jitter: () => 0 },
      now: () => new Date(),
    });
    await expect(client.getForm("form_1")).rejects.toThrow(/retryable/);
  });
});

describe("createGoogleFormsClient.listResponses", () => {
  it("returns mapped MemberResponse and nextPageToken", async () => {
    const responsesPayload = {
      responses: [
        {
          responseId: "r_1",
          createTime: "2026-04-27T00:00:00Z",
          lastSubmittedTime: "2026-04-27T01:00:00Z",
          respondentEmail: "a@example.com",
          formId: "form_1",
          answers: {
            q_1: { questionId: "q_1", textAnswers: { answers: [{ value: "山田" }] } },
            q_2: { questionId: "q_2", textAnswers: { answers: [{ value: "0_to_1" }] } },
          },
        },
      ],
      nextPageToken: "next",
    };
    const fetchImpl = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes("oauth2")) return tokenResponse();
      if (u.includes("/responses")) return new Response(JSON.stringify(responsesPayload), { status: 200 });
      return new Response(JSON.stringify(formResponseBody), { status: 200 });
    }) as unknown as typeof fetch;
    const client = createGoogleFormsClient(env, {
      fetchImpl,
      authDeps: {
        fetchImpl,
        signer: { sign: async () => "jwt" },
        now: () => 0,
      },
      backoff: { maxRetry: 0, sleep: async () => {} },
      now: () => new Date("2026-04-27T00:00:00Z"),
    });
    const result = await client.listResponses("form_1");
    expect(result.responses).toHaveLength(1);
    expect(result.responses[0].responseEmail).toBe("a@example.com");
    expect(result.nextPageToken).toBe("next");
  });
});
