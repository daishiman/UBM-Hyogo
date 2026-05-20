// 06b: /profile error boundary。fetchAuthed の non-2xx 例外を catch する。

"use client";

import { useEffect, useRef } from "react";
import { useAutoFocusOnMount } from "../../src/lib/a11y/useAutoFocusOnMount";
import { logger } from "../../src/lib/logger";

export interface ProfileErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function ProfileError({ error, reset }: ProfileErrorProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useAutoFocusOnMount(headingRef);

  useEffect(() => {
    logger.error({
      event: "error.boundary.caught",
      scope: "profile",
      digest: error.digest,
      err: error,
    });
  }, [error]);

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <main>
      <section role="alert" aria-live="assertive">
        <h1 ref={headingRef} tabIndex={-1}>
          マイページの読み込みに失敗しました
        </h1>
        <p>時間をおいて再度お試しください。</p>
        {error.digest && (
          <p>
            エラーID: <code>{error.digest}</code>
          </p>
        )}
        {isDev && <pre>{error.stack ?? error.message}</pre>}
        <button type="button" onClick={() => reset()}>
          再読み込み
        </button>
      </section>
    </main>
  );
}
