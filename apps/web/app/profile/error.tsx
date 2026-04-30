// 06b: /profile error boundary。fetchAuthed の non-2xx 例外を catch する。

"use client";

import { useEffect } from "react";

export interface ProfileErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function ProfileError({ error, reset }: ProfileErrorProps) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[profile] route error", error);
  }, [error]);
  return (
    <main>
      <section role="alert">
        <h1>マイページの読み込みに失敗しました</h1>
        <p>時間をおいて再度お試しください。</p>
        <button type="button" onClick={() => reset()}>
          再読み込み
        </button>
      </section>
    </main>
  );
}
