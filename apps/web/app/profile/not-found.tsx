// 06b: /profile not-found（session はあるが member が未解決のケース）。

export default function ProfileNotFound() {
  return (
    <main>
      <section>
        <h1>プロフィール情報が見つかりません</h1>
        <p>
          フォームの同期が完了していない可能性があります。しばらく時間をおいて再度お試しください。
          解決しない場合は管理者にお問い合わせください。
        </p>
      </section>
    </main>
  );
}
