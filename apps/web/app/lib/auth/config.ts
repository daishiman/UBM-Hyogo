// 05b: Auth.js 設定 placeholder
// 注: 本タスク (05b) では next-auth 本体の導入は別 issue。
// 本ファイルは「Auth.js 採用時に session callback で何を呼ぶか」の正本ドキュメント。
//
// 不変条件:
//  #5: web は D1 に直接アクセスしない -> resolve-session は API worker 経由
//  #9: /no-access へ redirect しない -> state は UI が解釈
//
// EmailProvider は使用しない (Auth.js の magic-link は内部で D1 に書くため)。
// 代わりに API worker の POST /auth/magic-link を画面の form action から叩く。
// verify (callback) は API worker の POST /auth/magic-link/verify が SessionUser を返すので
// それを Auth.js の session として cookie に詰めれば良い (Credentials Provider 相当)。

export type SessionUserShape = {
  email: string;
  memberId: string;
  responseId: string;
  isAdmin: boolean;
  authGateState: "active";
};

export const AUTH_API_PATHS = {
  issue: "/api/auth/magic-link",
  verify: "/api/auth/magic-link/verify",
  gateState: "/api/auth/gate-state",
} as const;

// session callback で memberId / responseId / isAdmin を session.user に注入する想定。
// 例 (Credentials Provider 採用後):
//   callbacks: {
//     session: async ({ session, token }) => {
//       session.user = { ...session.user, ...(token.appUser as SessionUserShape) };
//       return session;
//     },
//     jwt: async ({ token, user }) => {
//       if (user) token.appUser = user as SessionUserShape;
//       return token;
//     },
//   }
