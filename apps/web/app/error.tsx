"use client";

// 共通エラーバウンダリ。Phase 6 F-02 / F-03 / F-14 を吸収する。

import { useEffect } from "react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }, [error]);

  return (
    <main data-page="error">
      <h1>表示中に問題が発生しました</h1>
      <p>時間を置いて再試行してください。</p>
      <button type="button" onClick={() => reset()}>
        再試行
      </button>
      <a href="/">トップに戻る</a>
    </main>
  );
}
