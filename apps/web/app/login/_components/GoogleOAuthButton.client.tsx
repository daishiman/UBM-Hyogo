// 06b: Google OAuth 起動ボタン（client side）。
// 不変条件 #5: signIn 経由で Auth.js handler を呼ぶだけ。D1 アクセスなし。

"use client";

import { useState } from "react";
import { Button } from "../../../src/components/ui/Button";
import { signInWithGoogle } from "../../../src/lib/auth/oauth-client";

export interface GoogleOAuthButtonProps {
  readonly redirect: string;
}

export function GoogleOAuthButton({ redirect }: GoogleOAuthButtonProps) {
  const [busy, setBusy] = useState(false);
  const onClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await signInWithGoogle(redirect);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button type="button" onClick={onClick} disabled={busy} loading={busy}>
      Google でログイン
    </Button>
  );
}
