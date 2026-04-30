"use client";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <section role="alert">
      <h1>エラーが発生しました</h1>
      <p>{error.message}</p>
      <button type="button" onClick={() => reset()}>再試行</button>
    </section>
  );
}
