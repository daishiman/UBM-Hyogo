import type { Env } from "../env";

export interface HealthcheckMailFallbackDeps {
  readonly fetch?: typeof fetch;
  readonly now?: () => Date;
}

export interface HealthcheckMailFallbackResult {
  readonly ok: boolean;
  readonly skipped?: boolean;
  readonly status?: number;
}

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "UBM Hyogo Healthcheck <onboarding@resend.dev>";

export async function sendHealthcheckFailureMail(
  env: Env,
  reason: string,
  deps: HealthcheckMailFallbackDeps = {},
): Promise<HealthcheckMailFallbackResult> {
  const apiKey = env.RESEND_API_KEY?.trim();
  const to = env.HEALTHCHECK_FALLBACK_EMAIL?.trim();
  if (!apiKey || !to) {
    console.warn("[alertRelayHealthcheck] mail fallback skipped", {
      reason: "mail_config_not_ready",
    });
    return { ok: true, skipped: true };
  }

  const fetchImpl = deps.fetch ?? fetch;
  const occurredAt = (deps.now ?? (() => new Date()))().toISOString();
  let response: Response;
  try {
    response = await fetchImpl(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: DEFAULT_FROM,
        to,
        subject: "UT-17 alert relay healthcheck failed",
        text: [
          "UT-17 alert relay weekly healthcheck failed.",
          `occurredAt: ${occurredAt}`,
          `reason: ${reason}`,
        ].join("\n"),
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[alertRelayHealthcheck] mail fallback failed", {
      error: message,
    });
    return { ok: false };
  }

  if (!response.ok) {
    console.error("[alertRelayHealthcheck] mail fallback failed", {
      status: response.status,
    });
    return { ok: false, status: response.status };
  }
  return { ok: true, status: response.status };
}
