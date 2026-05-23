// UT-17: Hono middleware. lib/cf-webhook-auth の pure function を呼び出して
// `cf-webhook-auth` header を検証する。失敗時は 401。
import type { MiddlewareHandler } from "hono";
import { verifyCfWebhookAuth as verifyHeader } from "../lib/cf-webhook-auth";

export interface VerifyCfWebhookAuthEnv {
  readonly CF_WEBHOOK_AUTH_SECRET?: string;
}

const HEADER_NAME = "cf-webhook-auth";

export const verifyCfWebhookAuth: MiddlewareHandler<{
  Bindings: VerifyCfWebhookAuthEnv;
}> = async (c, next) => {
  const headerValue = c.req.header(HEADER_NAME) ?? null;
  const expected = c.env.CF_WEBHOOK_AUTH_SECRET ?? null;
  const result = verifyHeader(headerValue, expected);
  if (!result.ok) {
    if (result.reason === "missing-secret") {
      return c.json({ error: "internal misconfigured" }, 500);
    }
    return c.json({ error: "unauthorized" }, 401);
  }
  await next();
  return;
};
