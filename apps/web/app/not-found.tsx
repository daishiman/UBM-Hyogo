import Link from "next/link";

export default function NotFound() {
  return (
    <main
      aria-labelledby="not-found-title"
      data-page="not-found"
      data-testid="not-found"
      className="mx-auto max-w-xl px-6 py-16 text-center"
    >
      <p className="text-sm text-[var(--ubm-color-fg-muted)]">404</p>
      <h1 id="not-found-title" className="mt-2 text-2xl font-semibold">
        ページが見つかりません
      </h1>
      <p className="mt-3 text-sm text-[var(--ubm-color-fg-muted)]">
        URL をご確認のうえ、トップから再度アクセスしてください。
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          href="/"
          className="inline-block rounded-md bg-[var(--ubm-color-primary)] px-4 py-2 text-sm text-[var(--ubm-color-on-primary)]"
        >
          トップへ戻る
        </Link>
        <Link
          href="/members"
          className="inline-block rounded-md border border-[var(--ubm-color-border)] px-4 py-2 text-sm"
        >
          メンバー一覧へ
        </Link>
      </div>
    </main>
  );
}
