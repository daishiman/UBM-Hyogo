"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { logger } from "../src/lib/logger";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RouteError({ error, reset }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    logger.error({
      event: "error.boundary.caught",
      digest: error.digest,
      err: error,
    });
    headingRef.current?.focus({ preventScroll: true });
  }, [error]);

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <div role="alert" aria-live="assertive" className="mx-auto max-w-2xl px-6 py-16">
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-2xl font-semibold text-danger"
      >
        画面を表示できませんでした
      </h1>
      <p className="mt-2 text-sm text-text-3">
        時間をおいて再試行してください。問題が続く場合は管理者にご連絡ください。
      </p>
      {error.digest && (
        <p className="mt-4 text-xs text-text-3">
          エラーID: <code>{error.digest}</code>
        </p>
      )}
      {isDev && (
        <pre className="mt-6 max-h-64 overflow-auto rounded-md bg-surface-2 p-3 text-xs">
          {error.stack ?? error.message}
        </pre>
      )}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-accent px-4 py-2 text-sm text-panel"
        >
          再試行する
        </button>
        <Link
          href="/"
          className="rounded-md border border-border px-4 py-2 text-sm"
        >
          トップへ戻る
        </Link>
      </div>
    </div>
  );
}
