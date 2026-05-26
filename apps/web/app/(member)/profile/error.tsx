"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useAutoFocusOnMount } from "@/lib/a11y/useAutoFocusOnMount";
import { logger } from "@/lib/logger";

export interface ProfileErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function ProfileError({ error, reset }: ProfileErrorProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    logger.error({
      event: "error.boundary.caught",
      scope: "profile",
      digest: error.digest,
      err: error,
    });
  }, [error]);
  useAutoFocusOnMount(headingRef);

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <div role="alert" aria-live="assertive" className="mx-auto max-w-2xl px-6 py-16">
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-2xl font-semibold text-danger"
      >
        マイページの読み込みに失敗しました
      </h1>
      <p className="mt-2 text-sm text-text-3">
        時間をおいて再度お試しください。
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
          再読み込み
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
