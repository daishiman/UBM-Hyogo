export default function LoginLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      data-page="login-loading"
      className="mx-auto max-w-md space-y-4 px-6 py-12"
    >
      <span className="sr-only">ログイン画面を読み込み中</span>
      <div className="h-12 w-12 rounded bg-surface-2 motion-safe:animate-pulse" />
      <div className="h-8 w-2/3 rounded bg-surface-2 motion-safe:animate-pulse" />
      <div className="h-10 rounded bg-surface-2 motion-safe:animate-pulse" />
    </div>
  );
}
