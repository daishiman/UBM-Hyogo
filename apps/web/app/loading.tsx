export default function Loading() {
  return (
    <div
      className="mx-auto max-w-3xl space-y-4 px-6 py-12"
      role="status"
      aria-busy="true"
      aria-live="polite"
      data-page="loading"
    >
      <span className="sr-only">読み込み中</span>
      <div className="h-8 w-2/3 rounded bg-surface-2 motion-safe:animate-pulse" />
      <div className="h-4 w-full rounded bg-surface-2 motion-safe:animate-pulse" />
      <div className="h-4 w-5/6 rounded bg-surface-2 motion-safe:animate-pulse" />
      <div className="h-64 rounded bg-surface-2 motion-safe:animate-pulse" />
    </div>
  );
}
