import Link from "next/link";
import { Card, CardContent } from "../src/components/ui/Card";
import { EmptyState } from "../src/components/ui/EmptyState";

export default function NotFound() {
  return (
    <main
      aria-labelledby="not-found-title"
      data-page="not-found"
      data-testid="not-found"
      className="mx-auto max-w-xl px-6 py-16"
    >
      <h1 id="not-found-title" className="sr-only">
        404 ページが見つかりません
      </h1>
      <Card>
        <CardContent>
          <EmptyState
            role="status"
            icon={<span className="text-sm text-text-3">404</span>}
            title="ページが見つかりません"
            description="URL をご確認のうえ、トップから再度アクセスしてください。"
            action={
              <div className="mt-6 flex justify-center gap-3">
                <Link
                  href="/"
                  className="inline-block rounded-md bg-accent px-4 py-2 text-sm text-panel"
                >
                  トップへ戻る
                </Link>
                <Link
                  href="/members"
                  className="inline-block rounded-md border border-border px-4 py-2 text-sm"
                >
                  メンバー一覧へ
                </Link>
              </div>
            }
          />
        </CardContent>
      </Card>
    </main>
  );
}
