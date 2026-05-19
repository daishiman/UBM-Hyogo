import type { ReactElement } from "react";

export default function ProfileLoading(): ReactElement {
  return (
    <main
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="mx-auto max-w-3xl space-y-6 px-6 py-12"
      data-page="profile-loading"
    >
      <span className="sr-only">マイページを読み込み中</span>
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-surface-2 motion-safe:animate-pulse" />
        <div className="h-8 w-48 rounded bg-surface-2 motion-safe:animate-pulse" />
      </div>
      <div className="space-y-3">
        <div className="h-6 w-full rounded bg-surface-2 motion-safe:animate-pulse" />
        <div className="h-6 w-5/6 rounded bg-surface-2 motion-safe:animate-pulse" />
        <div className="h-6 w-4/6 rounded bg-surface-2 motion-safe:animate-pulse" />
        <div className="h-6 w-3/6 rounded bg-surface-2 motion-safe:animate-pulse" />
      </div>
    </main>
  );
}
