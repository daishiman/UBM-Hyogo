export type ProfileSessionCause =
  | "session-404"
  | "session-410"
  | "session-5xx"
  | "session-failed";

export interface ProfileSessionErrorDisplay {
  readonly title: string;
  readonly detail: string;
  readonly retryHref?: string;
  readonly actionHref?: string;
  readonly actionLabel?: string;
  readonly dataCause: ProfileSessionCause;
}

function isMemberSession5xx(code: string): boolean {
  const match = code.match(/^MEMBER_SESSION_(\d{3})$/);
  return match ? Number(match[1]) >= 500 : false;
}

export function mapProfileSessionErrorToDisplay(
  code: string,
): ProfileSessionErrorDisplay {
  if (code === "MEMBER_SESSION_404") {
    return {
      title: "セッション情報を取得できませんでした",
      detail: "アカウント情報を確認できませんでした。再ログインしてください。",
      actionHref: "/login?redirect=/profile",
      actionLabel: "再ログイン",
      dataCause: "session-404",
    };
  }

  if (code === "MEMBER_SESSION_410") {
    return {
      title: "このアカウントは退会済みです",
      detail:
        "退会手続きが完了しているため、マイページを表示できません。誤って退会された場合や利用再開をご希望の場合は、支部会の運営（管理者）にお問い合わせください。",
      actionHref: "/",
      actionLabel: "公開サイトのトップへ戻る",
      dataCause: "session-410",
    };
  }

  if (isMemberSession5xx(code)) {
    return {
      title: "セッション情報を取得できませんでした",
      detail:
        "サーバー側でセッション確認に失敗しました。時間をおいて再読み込みしてください。",
      retryHref: "/profile",
      dataCause: "session-5xx",
    };
  }

  return {
    title: "セッション情報を取得できませんでした",
    detail:
      "通信経路でセッション確認に失敗しました。時間をおいて再読み込みしてください。",
    retryHref: "/profile",
    dataCause: "session-failed",
  };
}
