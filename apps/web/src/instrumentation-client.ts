"use client";

// Next.js v15+ browser-side instrumentation hook.
// Browser runtime uses the Next.js SDK ONLY. The Cloudflare SDK must not be imported here.

declare global {
  interface Window {
    __ubmSentryInitialized__?: boolean;
  }
}

import * as Sentry from "@sentry/nextjs";

if (typeof window !== "undefined" && !window.__ubmSentryInitialized__) {
  window.__ubmSentryInitialized__ = true;
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (dsn) {
    try {
      Sentry.init({
        dsn,
        environment:
          process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ??
          "local",
        tracesSampleRate: parseSampleRate(
          process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
        ),
      });
    } catch (err) {
      console.error("[sentry] client init failed", err);
    }
  }
}

function parseSampleRate(value: string | undefined): number {
  if (!value) return 0.1;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 1 ? n : 0.1;
}
