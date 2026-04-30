// 06b: Google OAuth 起動の client side ラッパ。
// next-auth/react の signIn を呼ぶだけだが、callbackUrl の組み立て / redirect path の正規化を統一する。

"use client";

import { signIn } from "next-auth/react";

const FALLBACK_REDIRECT = "/profile";

/**
 * Google OAuth flow を開始する。`redirect` は成功時のみ使われ、open redirect を防ぐため
 * 内部 path のみを許容する。
 */
export const signInWithGoogle = async (redirect?: string): Promise<void> => {
  const callbackUrl =
    redirect && redirect.startsWith("/") && !redirect.startsWith("//")
      ? redirect
      : FALLBACK_REDIRECT;
  await signIn("google", { callbackUrl });
};
