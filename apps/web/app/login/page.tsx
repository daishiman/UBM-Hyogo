// task-13 Phase 5: /login Server Component（カード型 wrapper）。
// 不変条件 #8: searchParams が gate state の正本。
// 不変条件 #9: `/no-access` ルートを使わず /login が 6 状態を吸収する。

import { parseLoginQuery } from "../../src/lib/url/login-query";
import { LoginCard } from "./_components/LoginCard";
import { LoginPanel } from "./_components/LoginPanel.client";

interface LoginPageProps {
  // Next 16: searchParams は Promise（async 解決）
  readonly searchParams?: Promise<
    Record<string, string | string[] | undefined>
  >;
}

const TITLES: Record<string, { title: string; subtitle?: string }> = {
  input: {
    title: "UBM 兵庫支部会へログイン",
    subtitle: "登録済みのメールアドレスでログインしてください。",
  },
  sent: { title: "メールを確認してください" },
  unregistered: { title: "アカウントが見つかりません" },
  deleted: { title: "アカウントが削除されています" },
  rules_declined: { title: "利用規約の同意が必要です" },
  error: { title: "ログインに失敗しました" },
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const raw = (await searchParams) ?? {};
  const q = parseLoginQuery(raw);
  const meta = TITLES[q.state] ?? TITLES.input!;
  const panelProps = {
    state: q.state,
    redirect: q.redirect,
    ...(q.email !== undefined ? { email: q.email } : {}),
    ...(q.error !== undefined ? { error: q.error } : {}),
    ...(q.gate !== undefined ? { gate: q.gate } : {}),
  };
  return (
    <main>
      <LoginCard
        state={q.state}
        title={meta.title}
        {...(meta.subtitle !== undefined ? { subtitle: meta.subtitle } : {})}
      >
        <LoginPanel {...panelProps} />
      </LoginCard>
    </main>
  );
}
