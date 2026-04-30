// 共通 404。Phase 6 F-01 / F-09〜F-12 を吸収する。

export default function NotFoundPage() {
  return (
    <main data-page="not-found">
      <h1>ページが見つかりません</h1>
      <p>URL をもう一度確認してください。</p>
      <a href="/">トップに戻る</a>
      <a href="/members">メンバー一覧へ</a>
    </main>
  );
}
