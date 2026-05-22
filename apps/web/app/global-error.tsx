"use client";

import { useEffect } from "react";
import { logger } from "../src/lib/logger";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error({
      event: "error.global-boundary.caught",
      digest: error.digest,
      err: error,
    });
  }, [error]);

  return (
    <html lang="ja">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
        <main role="alert" aria-live="assertive">
          <h1>システムエラーが発生しました</h1>
          <p>ページを読み込めませんでした。再読込みしてください。</p>
          {error.digest && (
            <p>
              エラーID: <code>{error.digest}</code>
            </p>
          )}
          <button type="button" onClick={reset}>
            再読込み
          </button>
        </main>
      </body>
    </html>
  );
}
