// 05b-A: env contract alignment follow-up
// phase-04 L1 test 観点に対応する unit test
// fixture に実 Resend API key 形式 (`re_*`) を書かない（不変条件 #16）

import { describe, expect, it, vi } from "vitest";
import {
  buildMagicLinkMessage,
  createResendSender,
} from "../magic-link-mailer";

const PLACEHOLDER_API_KEY = "TEST_PLACEHOLDER_API_KEY";
const DUMMY_FROM = "noreply@example.com";
const DUMMY_TO = "user@example.com";
const DUMMY_LINK = "https://example.com/api/auth/callback/email?token=t&email=user%40example.com";

describe("buildMagicLinkMessage", () => {
  it("magicLinkUrl と ttlMinutes を text / html / subject に反映する", () => {
    const message = buildMagicLinkMessage({
      to: DUMMY_TO,
      from: DUMMY_FROM,
      magicLinkUrl: DUMMY_LINK,
      ttlMinutes: 15,
    });
    expect(message.to).toBe(DUMMY_TO);
    expect(message.from).toBe(DUMMY_FROM);
    expect(message.subject).toContain("UBM");
    expect(message.text).toContain(DUMMY_LINK);
    expect(message.text).toContain("15 分以内");
    expect(message.html).toContain(`href=\"${DUMMY_LINK}\"`);
  });
});

describe("createResendSender", () => {
  it("Authorization: Bearer <apiKey> ヘッダで Resend HTTP API を呼び出す", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ id: "msg_test" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const sender = createResendSender({
      apiKey: PLACEHOLDER_API_KEY,
      fetchImpl: fetchMock as unknown as typeof fetch,
    });
    const result = await sender.send(
      buildMagicLinkMessage({
        to: DUMMY_TO,
        from: DUMMY_FROM,
        magicLinkUrl: DUMMY_LINK,
        ttlMinutes: 15,
      }),
    );

    expect(result.ok).toBe(true);
    expect(result.providerMessageId).toBe("msg_test");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Bearer ${PLACEHOLDER_API_KEY}`);
    expect(headers["Content-Type"]).toBe("application/json");
    const body = JSON.parse(init.body as string) as {
      from: string;
      to: string[];
      subject: string;
      text: string;
      html: string;
    };
    expect(body.from).toBe(DUMMY_FROM);
    expect(body.to).toEqual([DUMMY_TO]);
    expect(body.text).toContain(DUMMY_LINK);
  });

  it("provider が non-2xx を返した場合は ok=false と errorMessage を伝搬する", async () => {
    const fetchMock = vi.fn(async () =>
      new Response("invalid api key", { status: 401 }),
    );
    const sender = createResendSender({
      apiKey: PLACEHOLDER_API_KEY,
      fetchImpl: fetchMock as unknown as typeof fetch,
    });
    const result = await sender.send(
      buildMagicLinkMessage({
        to: DUMMY_TO,
        from: DUMMY_FROM,
        magicLinkUrl: DUMMY_LINK,
        ttlMinutes: 15,
      }),
    );
    expect(result.ok).toBe(false);
    expect(result.errorMessage).toContain("mail_provider_401");
    expect(result.providerMessageId).toBeUndefined();
  });

  it("provider が 2xx を返したが id を含まない場合でも ok=true を返す", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const sender = createResendSender({
      apiKey: PLACEHOLDER_API_KEY,
      fetchImpl: fetchMock as unknown as typeof fetch,
    });
    const result = await sender.send({
      to: DUMMY_TO,
      from: DUMMY_FROM,
      subject: "s",
      text: "t",
      html: "<p>h</p>",
    });
    expect(result.ok).toBe(true);
    expect(result.providerMessageId).toBeUndefined();
  });
});
