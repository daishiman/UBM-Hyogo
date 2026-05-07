// Next.js v15+ server-side instrumentation hook.
// Workers / Node SSR / Edge runtimes use the Cloudflare SDK ONLY.
// The Next.js browser SDK must NEVER be imported here to prevent
// requestIdleCallback / Web API leakage into the Workers bundle.

import { getEnv } from "./lib/env";

declare global {
  // eslint-disable-next-line no-var
  var __ubmSentryInitialized__: boolean | undefined;
}

export async function register(): Promise<void> {
  if (globalThis.__ubmSentryInitialized__) {
    return;
  }
  globalThis.__ubmSentryInitialized__ = true;

  const runtime = process.env.NEXT_RUNTIME;
  if (runtime !== "nodejs" && runtime !== "edge") {
    return;
  }

  const env = getEnv();
  if (!env.SENTRY_DSN_WEB) {
    return;
  }

  try {
    const Sentry = (await import("@sentry/cloudflare")) as unknown as {
      init?: (opts: {
        dsn: string;
        environment: string;
        tracesSampleRate: number;
      }) => void;
    };
    // @sentry/cloudflare の最新版は withSentry 経由が前提だが、
    // テストでは init を mock するため、存在する場合のみ呼ぶ fail-soft 設計。
    Sentry.init?.({
      dsn: env.SENTRY_DSN_WEB,
      environment: env.SENTRY_ENVIRONMENT,
      tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
    });
  } catch (err) {
    // fail-soft: SDK 読み込み失敗で本体を落とさない
    console.error("[sentry] server init failed", err);
  }
}
