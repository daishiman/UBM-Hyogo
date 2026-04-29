// 06b: メール入力 + magic link 送信 + 60s cooldown。
// 不変条件 #5: API は /api/auth/magic-link proxy 経由のみ（D1 直接アクセスなし）。
// 不変条件 #8: 送信成功時に history.replaceState で URL を /login?state=sent&redirect=... に置換し、
//             email を URL から落とす（privacy）。state は URL を正本とするため ブラウザ永続ストレージ は使わない。

"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Field } from "../../../src/components/ui/Field";
import { Input } from "../../../src/components/ui/Input";
import { Button } from "../../../src/components/ui/Button";
import { sendMagicLink } from "../../../src/lib/auth/magic-link-client";
import { replaceLoginState } from "../../../src/lib/url/login-state";

const COOLDOWN_SECONDS = 60;

export interface MagicLinkFormProps {
  readonly redirect: string;
}

export function MagicLinkForm({ redirect }: MagicLinkFormProps) {
  const [email, setEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (cooldown <= 0) return;
    timerRef.current = setInterval(() => {
      setCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cooldown]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting || cooldown > 0) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await sendMagicLink(email, redirect);
      setCooldown(COOLDOWN_SECONDS);
      replaceLoginState(res.state, redirect);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "送信に失敗しました";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const buttonLabel =
    cooldown > 0 ? `${cooldown}s 後に再送可能` : "メールリンクを送信";

  return (
    <form onSubmit={onSubmit}>
      <Field id="magic-link-email" label="メールアドレス">
        <Input
          id="magic-link-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      {error ? (
        <p role="alert" data-tone="error">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={submitting || cooldown > 0 || email.length === 0}
      >
        {buttonLabel}
      </Button>
    </form>
  );
}
