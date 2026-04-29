// 06b: /login Server Component。
// searchParams を loginQuerySchema でパースし、5 状態を <LoginPanel> に委譲する。
// 不変条件 #8: URL query が gate state の正本。
// 不変条件 #9: `/no-access` ルートを使わず /login が 5 状態を吸収する。

import { parseLoginQuery } from "../../src/lib/url/login-query";
import { LoginPanel } from "./_components/LoginPanel.client";

interface LoginPageProps {
  // Next 16: searchParams は Promise（async 解決）
  readonly searchParams?: Promise<
    Record<string, string | string[] | undefined>
  >;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const raw = (await searchParams) ?? {};
  const q = parseLoginQuery(raw);
  const panelProps = {
    state: q.state,
    redirect: q.redirect,
    ...(q.email !== undefined ? { email: q.email } : {}),
    ...(q.error !== undefined ? { error: q.error } : {}),
    ...(q.gate !== undefined ? { gate: q.gate } : {}),
  };
  return (
    <main>
      <LoginPanel {...panelProps} />
    </main>
  );
}
