// Runtime-aware Sentry capture wrapper.
//
// 公開 API（task-04 logger / task-05 error.tsx が import する契約）:
//   - captureException(err, ctx?) => Promise<string | undefined>
//   - captureMessage(msg, ctx?)   => Promise<string | undefined>
//   - CaptureContext 型
//
// fail-soft 保証:
//   - SDK 未 init / DSN 未設定 / dynamic import 失敗いずれでも throw せず undefined を返す
//   - PII / D1 SQL を breadcrumb / extras に含めないこと（呼び出し側の責務）

export type CaptureContext = {
  tags?: Record<string, string>;
  extras?: Record<string, unknown>;
  /** @deprecated 互換のため残す。新規利用は extras を使うこと */
  extra?: Record<string, unknown>;
  level?: "fatal" | "error" | "warning" | "info" | "debug";
  user?: { id?: string; email?: string };
};

type SentryLike = {
  captureException: (e: unknown, hint?: unknown) => string | undefined;
  captureMessage: (
    m: string,
    levelOrHint?: unknown,
  ) => string | undefined;
  withScope?: (cb: (scope: ScopeLike) => void) => void;
};

type ScopeLike = {
  setTag?: (k: string, v: string) => void;
  setExtra?: (k: string, v: unknown) => void;
  setLevel?: (l: string) => void;
  setUser?: (u: unknown) => void;
};

async function loadSdk(): Promise<SentryLike | undefined> {
  try {
    if (typeof window === "undefined") {
      const mod = await import("@sentry/cloudflare");
      return mod as unknown as SentryLike;
    }
    const mod = await import("@sentry/nextjs");
    return mod as unknown as SentryLike;
  } catch (err) {
    console.error("[sentry] dynamic import failed", err);
    return undefined;
  }
}

function withContext<T>(
  sdk: SentryLike,
  ctx: CaptureContext | undefined,
  capture: () => T,
): T {
  if (!ctx || !sdk.withScope) return capture();
  let result: T;
  sdk.withScope((scope) => {
    for (const [key, value] of Object.entries(ctx.tags ?? {})) {
      scope.setTag?.(key, value);
    }
    const extras = { ...(ctx.extras ?? {}), ...(ctx.extra ?? {}) };
    for (const [key, value] of Object.entries(extras)) {
      scope.setExtra?.(key, value);
    }
    if (ctx.level) scope.setLevel?.(ctx.level);
    if (ctx.user) scope.setUser?.(ctx.user);
    result = capture();
  });
  return result!;
}

function buildHint(ctx: CaptureContext | undefined) {
  if (!ctx) return undefined;
  const hint: Record<string, unknown> = {};
  if (ctx.tags) hint.tags = ctx.tags;
  const extras = { ...(ctx.extras ?? {}), ...(ctx.extra ?? {}) };
  if (Object.keys(extras).length > 0) hint.extra = extras;
  if (ctx.level) hint.level = ctx.level;
  if (ctx.user) hint.user = ctx.user;
  return hint;
}

export async function captureException(
  error: unknown,
  ctx?: CaptureContext,
): Promise<string | undefined> {
  const sdk = await loadSdk();
  if (!sdk) return undefined;
  try {
    const hint = buildHint(ctx);
    return withContext(sdk, ctx, () => sdk.captureException(error, hint));
  } catch (err) {
    console.error("[sentry] captureException failed", err);
    return undefined;
  }
}

export async function captureMessage(
  message: string,
  ctx?: CaptureContext,
): Promise<string | undefined> {
  const sdk = await loadSdk();
  if (!sdk) return undefined;
  try {
    const level = ctx?.level ?? "info";
    const hint = buildHint(ctx);
    return withContext(sdk, ctx, () =>
      sdk.captureMessage(message, hint ? { ...hint, level } : level),
    );
  } catch (err) {
    console.error("[sentry] captureMessage failed", err);
    return undefined;
  }
}
