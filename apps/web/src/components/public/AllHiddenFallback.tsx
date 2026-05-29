// issue-958 Track C: public/members 一覧で全件非公開の状態を可視化する fallback。
// 来訪者が「サイトが壊れている / 会員が居ない」と誤認しないよう、登録会員数と再公開導線を表示する。

import type { JSX } from "react";
import Link from "next/link";
import { Banner } from "../ui/Banner";
import { buttonVariants } from "../ui/Button";

export interface AllHiddenFallbackProps {
  /** 登録 member 総数（公開以外を含む。0 件と区別するために表示） */
  readonly memberCount: number;
}

export function AllHiddenFallback({
  memberCount,
}: AllHiddenFallbackProps): JSX.Element {
  return (
    <section
      aria-label="現在、公開設定中のメンバーがいません"
      data-region="all-hidden-fallback"
    >
      <Banner
        tone="info"
        title="現在、公開設定中のメンバーがいません"
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/login"
              className={buttonVariants({ variant: "primary", size: "sm" })}
              data-testid="all-hidden-login-cta"
            >
              マイページにログイン
            </Link>
            <Link
              href="/admin"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
              data-testid="all-hidden-admin-cta"
            >
              管理者の方はこちら
            </Link>
          </div>
        }
      >
        <p>
          会員 {memberCount} 名が在籍していますが、現時点で公開許可済みのメンバーはいません。
          会員の方は Google Form での再回答や、ログイン後のマイページから設定を確認できます。
        </p>
      </Banner>
    </section>
  );
}
