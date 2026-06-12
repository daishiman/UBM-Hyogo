import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/Card";
import { buttonVariants } from "../ui/Button";

export interface LoginRequiredNoticeProps {
  readonly redirectTo?: string;
}

export function LoginRequiredNotice({
  redirectTo = "/",
}: LoginRequiredNoticeProps) {
  const href = `/login?redirect=${encodeURIComponent(redirectTo || "/")}`;

  return (
    <main
      className="mx-auto flex min-h-dvh w-full max-w-3xl items-center justify-center px-4 py-12"
      data-testid="login-required-notice"
    >
      <Card className="w-full">
        <CardHeader>
          <CardTitle>ログインが必要です</CardTitle>
          <CardDescription>
            UBM 兵庫支部会の情報は会員限定です。内容を見るにはログインしてください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            className={buttonVariants({ variant: "primary", size: "lg" })}
            data-testid="login-required-notice-cta"
            href={href}
          >
            ログインする
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
