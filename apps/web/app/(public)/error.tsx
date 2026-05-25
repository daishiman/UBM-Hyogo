"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "../../src/components/ui/Card";
import { useAutoFocusOnMount } from "../../src/lib/a11y/useAutoFocusOnMount";
import { logger } from "../../src/lib/logger";

export interface PublicErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function PublicError({ error, reset }: PublicErrorProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useAutoFocusOnMount(headingRef);

  useEffect(() => {
    logger.error({
      event: "error.boundary.caught",
      scope: "public",
      digest: error.digest,
      err: error,
    });
  }, [error]);

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <main
      className="mx-auto max-w-2xl px-6 py-16"
      data-route="public"
      data-page="error"
      data-section-rhythm="compact"
    >
      <Card role="alert" aria-live="assertive">
        <CardHeader>
          <h1 ref={headingRef} tabIndex={-1} className="ui-card-title text-danger">
            ページを表示できませんでした
          </h1>
          <CardDescription>
            時間をおいて再試行してください。問題が続く場合は管理者にご連絡ください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error.digest && (
            <p className="text-xs text-text-3">
              エラーID: <code>{error.digest}</code>
            </p>
          )}
          {isDev && (
            <pre className="mt-6 max-h-64 overflow-auto rounded-md bg-surface-2 p-3 text-xs">
              {error.stack ?? error.message}
            </pre>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-accent px-4 py-2 text-sm text-panel"
          >
            再試行する
          </button>
          <Link
            href="/members"
            className="rounded-md border border-border px-4 py-2 text-sm"
          >
            会員一覧へ戻る
          </Link>
          <Link
            href="/"
            className="rounded-md border border-border px-4 py-2 text-sm"
          >
            トップへ戻る
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
