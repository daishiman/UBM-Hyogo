// 06b: /login route の error boundary。
// SSR / RSC で例外が出ても破滅させず、再試行 CTA を出す。

"use client";

import { useEffect, useRef, type ReactElement } from "react";

export interface LoginErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function LoginError({
  error,
  reset,
}: LoginErrorProps): ReactElement {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[login] route error", error);
    headingRef.current?.focus({ preventScroll: true });
  }, [error]);

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
            <code>error id: {error.digest}</code>
          </p>
        ) : null}
        <button
          type="button"
          className="rounded-md bg-accent px-4 py-2 text-sm text-panel"
          onClick={() => reset()}
        >
          再読み込み
        </button>
      </section>
    </main>
  );
}
