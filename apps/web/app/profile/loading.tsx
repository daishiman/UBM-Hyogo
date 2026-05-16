export default function ProfileLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      data-page="profile-loading"
      className="mx-auto max-w-2xl space-y-4 px-6 py-12"
    >
      <span className="sr-only">プロフィールを読み込み中</span>
      <div className="h-16 w-16 rounded-full bg-surface-2 motion-safe:animate-pulse" />
      <div className="h-6 w-1/3 rounded bg-surface-2 motion-safe:animate-pulse" />
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-surface-2 motion-safe:animate-pulse" />
        <div className="h-4 w-full rounded bg-surface-2 motion-safe:animate-pulse" />
        <div className="h-4 w-2/3 rounded bg-surface-2 motion-safe:animate-pulse" />
      </div>
    </div>
  );
}
