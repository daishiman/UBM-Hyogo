import Link from "next/link";

export default function MemberNotFound() {
  return (
    <main
      data-page="not-found"
      data-testid="not-found"
      className="mx-auto max-w-xl px-6 py-16 text-center"
    >
      <p className="text-sm">404</p>
      <h1 className="mt-2 text-2xl font-semibold">メンバーが見つかりません</h1>
      <p className="mt-3 text-sm">
        URL をご確認のうえ、メンバー一覧から再度お探しください。
      </p>
      <div className="mt-6">
        <Link href="/members" className="underline">
          メンバー一覧へ
        </Link>
      </div>
    </main>
  );
}
