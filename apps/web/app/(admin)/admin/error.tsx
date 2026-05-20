"use client";

import { useEffect, useRef } from "react";
import { useAutoFocusOnMount } from "../../../src/lib/a11y/useAutoFocusOnMount";
import { logger } from "../../../src/lib/logger";

type AdminError = Error & { digest?: string };

export default function Error({ error, reset }: { error: AdminError; reset: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useAutoFocusOnMount(headingRef);

  useEffect(() => {
    logger.error({
      event: "error.boundary.caught",
      scope: "admin",
      digest: error.digest,
      err: error,
    });
  }, [error]);

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <section role="alert" aria-live="assertive">
      <h1 ref={headingRef} tabIndex={-1}>
        管理画面を表示できませんでした
      </h1>
      <p>時間をおいて再度お試しください。</p>
      {error.digest && (
        <p>
          エラーID: <code>{error.digest}</code>
        </p>
      )}
      {isDev && <pre>{error.stack ?? error.message}</pre>}
      <button type="button" onClick={() => reset()}>再試行</button>
    </section>
  );
}
