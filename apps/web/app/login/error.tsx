"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent } from "../../src/components/ui/Card";

export interface LoginErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function LoginError({ error, reset }: LoginErrorProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[login] route error", error);
    headingRef.current?.focus({ preventScroll: true });
  }, [error]);

  return (
    <Card data-state="error" data-page="login-error" className="mx-auto max-w-md">
      <CardContent
        role="alert"
        aria-live="assertive"
        className="space-y-4 px-6 py-6"
      >
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-xl font-bold text-danger"
        >
          ログイン処理でエラーが発生しました
        </h1>
        <p className="text-sm text-text-3">
          時間をおいて再度お試しください。
        </p>
        {error.digest ? (
          <p className="text-xs text-text-3">
            エラーID:{" "}
            <code className="rounded bg-surface-2 px-2 py-1">
              {error.digest}
            </code>
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md bg-accent px-4 py-2 text-sm text-panel"
        >
          再試行する
        </button>
      </CardContent>
    </Card>
  );
}
