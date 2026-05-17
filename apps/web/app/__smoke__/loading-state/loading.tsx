export default function SmokeLoadingStateBoundary() {
  return (
    <main
      className="mx-auto max-w-xl space-y-4 px-6 py-12"
      role="status"
      aria-busy="true"
      aria-live="polite"
      data-page="smoke-loading-state"
    >
      <span>読み込み中</span>
      <div className="h-8 w-2/3 rounded bg-surface-2 motion-safe:animate-pulse" />
      <div className="h-4 w-full rounded bg-surface-2 motion-safe:animate-pulse" />
      <div className="h-4 w-5/6 rounded bg-surface-2 motion-safe:animate-pulse" />
    </main>
  );
}
