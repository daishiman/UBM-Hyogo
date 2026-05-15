import type { Env } from "../env";
import { createAlertRelayRoute } from "../routes/internal/alert-relay";
import { sendHealthcheckFailureMail } from "../lib/healthcheck-mail-fallback";

export interface AlertRelayHealthcheckDeps {
  readonly fetch?: typeof fetch;
  readonly sleep?: (ms: number) => Promise<void>;
  readonly now?: () => Date;
}

const DAILY_CRON = "0 18 * * *";
const MONDAY = 1;

function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function cloneHeaders(headers: Headers): Headers {
  const cloned = new Headers();
  headers.forEach((value, key) => cloned.set(key, value));
  return cloned;
}

function slackOkBodyGuard(fetchImpl: typeof fetch): typeof fetch {
  return async (input, init) => {
    const response = await fetchImpl(input, init);
    const body = await response.clone().text();
    if (response.status >= 200 && response.status < 300 && body.trim() !== "ok") {
      return new Response(body, {
        status: 502,
        headers: cloneHeaders(response.headers),
      });
    }
    return response;
  };
}

export async function runAlertRelayHealthcheck(
  env: Env,
  controller: ScheduledController,
  deps: AlertRelayHealthcheckDeps = {},
): Promise<void> {
  const cron = (controller as ScheduledController & { cron?: string }).cron ?? "";
  if (cron !== DAILY_CRON) return;

  const scheduledAt = new Date(controller.scheduledTime);
  if (scheduledAt.getUTCDay() !== MONDAY) return;

  try {
    const slackWebhookUrl = env.SLACK_WEBHOOK_URL_HEALTHCHECK ?? env.SLACK_WEBHOOK_URL;
    const relayEnv: Env = {
      ...env,
      ...(slackWebhookUrl ? { SLACK_WEBHOOK_URL: slackWebhookUrl } : {}),
    };
    const fetchImpl = deps.fetch ?? fetch;
    const routeDeps: Parameters<typeof createAlertRelayRoute>[0] =
      deps.sleep === undefined
        ? { fetch: slackOkBodyGuard(fetchImpl) }
        : { fetch: slackOkBodyGuard(fetchImpl), sleep: deps.sleep };
    const app = createAlertRelayRoute(routeDeps);
    const timestamp = scheduledAt.toISOString();
    const response = await app.request(
      "/",
      {
        method: "POST",
        headers: {
          "cf-webhook-auth": env.CF_WEBHOOK_AUTH_SECRET ?? "",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: "UT-17 weekly healthcheck",
          severity: "info",
          policy_id: `ut-17-weekly-healthcheck-${isoWeekKey(scheduledAt)}`,
          ts: scheduledAt.getTime(),
          data: {
            healthcheck: true,
            timestamp,
          },
        }),
      },
      relayEnv,
    );

    if (response.status === 200) return;

    const mailDeps: Parameters<typeof sendHealthcheckFailureMail>[2] =
      deps.now === undefined ? { fetch: fetchImpl } : { fetch: fetchImpl, now: deps.now };
    await sendHealthcheckFailureMail(
      env,
      `alert relay healthcheck failed with status ${response.status}`,
      mailDeps,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[alertRelayHealthcheck] failed", {
      error: message,
    });
  }
}
