// 06b: /login route の error boundary。
// SSR / RSC で例外が出ても破滅させず、再試行 CTA を出す。

"use client";

import { useEffect, useRef } from "react";
import { useAutoFocusOnMount } from "../../src/lib/a11y/useAutoFocusOnMount";

export interface LoginErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function LoginError({ error, reset }: LoginErrorProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useAutoFocusOnMount(headingRef);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[login] route error", error);
  }, [error]);
  return (
    <main>
      <section role="alert" aria-live="assertive">
        <h1 ref={headingRef} tabIndex={-1}>
          ログイン画面でエラーが発生しました
        </h1>
        <p>時間をおいて再度お試しください。</p>
        <button type="button" onClick={() => reset()}>
          再読み込み
        </button>
      </section>
    </main>
  );
}
