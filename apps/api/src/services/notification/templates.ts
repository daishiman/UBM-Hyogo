// Issue #401: admin resolve 後の member 通知テンプレート
//
// AC-8: email 本文に raw resolutionNote を含めない
// AC-9: sanitize: 制御文字除去 + 200 char truncate + trim
//
// approve / reject の subject / text / html は固定文字列。
// reject 時のみ sanitize 済 reasonSummary を末尾に明示ラベルで付与する。

import type { MailMessage } from "../mail/magic-link-mailer";
import type {
  NotificationOutcome,
  NotificationRequestType,
} from "../../repository/notificationOutbox";

const CONTROL_CHAR_RE = /[\x00-\x08\x0B-\x1F\x7F]/g;

export const sanitizeRejectionNote = (raw: string | null | undefined): string => {
  if (raw === null || raw === undefined) return "";
  return raw.replace(CONTROL_CHAR_RE, "").trim().slice(0, 200);
};

const requestTypeLabel = (rt: NotificationRequestType): string =>
  rt === "visibility_request" ? "公開設定の変更" : "退会・削除のお手続き";

export interface BuildApprovedMessageInput {
  to: string;
  from: string;
  requestType: NotificationRequestType;
}

export const buildApprovedMessage = (
  input: BuildApprovedMessageInput,
): MailMessage => {
  const label = requestTypeLabel(input.requestType);
  const subject = `[UBM 兵庫支部会] ご依頼の${label}が完了しました`;
  const completion =
    input.requestType === "delete_request"
      ? "ご依頼いただいた退会・削除のお手続きが完了しました。\n今後、メンバーディレクトリ等への掲載は停止されます。"
      : "ご依頼いただいた公開設定の変更を反映しました。";
  const text = [
    "UBM 兵庫支部会 です。",
    "",
    completion,
    "",
    "ご不明点があれば本メール返信または運営までご連絡ください。",
  ].join("\n");
  const html = [
    "<!DOCTYPE html>",
    '<html lang="ja"><body>',
    "<p>UBM 兵庫支部会 です。</p>",
    `<p>${completion.replace(/\n/g, "<br/>")}</p>`,
    "<p>ご不明点があれば本メール返信または運営までご連絡ください。</p>",
    "</body></html>",
  ].join("");
  return {
    to: input.to,
    from: input.from,
    subject,
    text,
    html,
  };
};

export interface BuildRejectedMessageInput {
  to: string;
  from: string;
  requestType: NotificationRequestType;
  reasonSummary: string | null;
}

export const buildRejectedMessage = (
  input: BuildRejectedMessageInput,
): MailMessage => {
  const label = requestTypeLabel(input.requestType);
  const subject = `[UBM 兵庫支部会] ご依頼の${label}について`;
  const reasonLine =
    input.reasonSummary && input.reasonSummary.length > 0
      ? `\n理由（管理者からの要約）:\n${input.reasonSummary}\n`
      : "";
  const reasonHtml =
    input.reasonSummary && input.reasonSummary.length > 0
      ? `<p>理由（管理者からの要約）:<br/>${escapeHtml(input.reasonSummary)}</p>`
      : "";
  const text = [
    "UBM 兵庫支部会 です。",
    "",
    `ご依頼いただいた${label}について、申請を見送らせていただきました。`,
    reasonLine,
    "ご不明点があれば本メール返信または運営までご連絡ください。",
  ].join("\n");
  const html = [
    "<!DOCTYPE html>",
    '<html lang="ja"><body>',
    "<p>UBM 兵庫支部会 です。</p>",
    `<p>ご依頼いただいた${escapeHtml(label)}について、申請を見送らせていただきました。</p>`,
    reasonHtml,
    "<p>ご不明点があれば本メール返信または運営までご連絡ください。</p>",
    "</body></html>",
  ].join("");
  return {
    to: input.to,
    from: input.from,
    subject,
    text,
    html,
  };
};

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export interface BuildMessageInput {
  to: string;
  from: string;
  outcome: NotificationOutcome;
  requestType: NotificationRequestType;
  reasonSummary: string | null;
}

export const buildNotificationMessage = (
  input: BuildMessageInput,
): MailMessage =>
  input.outcome === "approved"
    ? buildApprovedMessage({
        to: input.to,
        from: input.from,
        requestType: input.requestType,
      })
    : buildRejectedMessage({
        to: input.to,
        from: input.from,
        requestType: input.requestType,
        reasonSummary: input.reasonSummary,
      });
