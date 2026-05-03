// 05a: session 取得 helper。Server Component / Route Handler から auth() で session を読む。
// 不変条件 #11: SessionUser には profile 本文 / responseId を含めない。

import { getAuth } from "./auth";

export interface SessionUser {
  memberId: string;
  email: string;
  name?: string;
  isAdmin: boolean;
}

export const getSession = async (): Promise<SessionUser | null> => {
  const { auth } = await getAuth();
  const session = await auth();
  if (!session?.user) return null;
  const u = session.user as Partial<SessionUser>;
  if (!u.memberId || !u.email) return null;
  return {
    memberId: u.memberId,
    email: u.email,
    isAdmin: u.isAdmin === true,
    ...(u.name ? { name: u.name } : {}),
  };
};
