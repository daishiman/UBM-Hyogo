"use client";

import { useEffect } from "react";
import { logger } from "../src/lib/logger";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RouteError({ error, reset }: Props) {
  useEffect(() => {
    logger.error({
      event: "error.boundary.caught",
      digest: error.digest,
      err: error,
    });
  }, [error]);

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <div role="alert" aria-live="assertive" className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold text-[var(--ubm-color-danger)]">
        画面を表示できませんでした
      </h1>
      <p className="mt-2 text-sm text-[var(--ubm-color-fg-muted)]">
        時間をおいて再試行してください。問題が続く場合は管理者にご連絡ください。
      </p>
      {error.digest && (
        <p className="mt-4 text-xs text-[var(--ubm-color-fg-muted)]">
          エラーID: <code>{error.digest}</code>
        </p>
      )}
      {isDev && (
        <pre className="mt-6 max-h-64 overflow-auto rounded-md bg-[var(--ubm-color-surface-2)] p-3 text-xs">
          {error.stack ?? error.message}
        </pre>
      )}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-[var(--ubm-color-primary)] px-4 py-2 text-sm text-[var(--ubm-color-on-primary)]"
        >
          再試行する
        </button>
        <a
          href="/"
          className="rounded-md border border-[var(--ubm-color-border)] px-4 py-2 text-sm"
        >
          トップへ戻る
        </a>
      </div>
    </div>
  );
}
