"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactElement } from "react";
import { useAutoFocusOnMount } from "../../src/lib/a11y/useAutoFocusOnMount";
import { logger } from "../../src/lib/logger";

export interface LoginErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function LoginError({
  error,
  reset,
}: LoginErrorProps): ReactElement {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useAutoFocusOnMount(headingRef);

  useEffect(() => {
    logger.error({
      event: "error.boundary.caught",
      scope: "login",
      digest: error.digest,
      err: error,
    });
  }, [error]);

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <section
        role="alert"
        aria-live="assertive"
        data-page="login-error"
        className="space-y-4 rounded-md border border-border bg-panel p-6"
      >
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-balance rounded-sm text-2xl font-semibold text-danger focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-accent"
        >
          ログイン画面でエラーが発生しました
        </h1>
        <p className="text-sm text-text-3">時間をおいて再度お試しください。</p>
        {error.digest ? (
          <p className="rounded bg-surface-2 p-3 text-xs text-text-3">
            エラーID: <code>{error.digest}</code>
          </p>
        ) : null}
        {isDev && (
          <pre className="max-h-64 overflow-auto rounded-md bg-surface-2 p-3 text-xs">
            {error.stack ?? error.message}
          </pre>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            className="rounded-md bg-accent px-4 py-2 text-sm text-panel"
            onClick={() => reset()}
          >
            再読み込み
          </button>
          <Link
            href="/"
            className="rounded-md border border-border px-4 py-2 text-sm"
          >
            トップへ戻る
          </Link>
        </div>
      </section>
    </main>
  );
}
