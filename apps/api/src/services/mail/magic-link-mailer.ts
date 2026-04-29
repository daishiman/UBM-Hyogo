// 05b: Magic Link メール送信
// 不変条件 #5: provider 抽象化により D1 アクセスは不要
// 不変条件 #10: 失敗時は呼び出し側が token を rollback する
//
// MailSender は依存注入する interface。デフォルトは Resend HTTP API を呼ぶ実装。
// テストでは fake sender を渡す。

export interface MailMessage {
  readonly to: string;
  readonly from: string;
  readonly subject: string;
  readonly text: string;
  readonly html: string;
}

export interface MailSendResult {
  readonly ok: boolean;
  readonly providerMessageId?: string;
  readonly errorMessage?: string;
}

export interface MailSender {
  send(message: MailMessage): Promise<MailSendResult>;
}

export interface BuildMagicLinkMessageInput {
  readonly to: string;
  readonly from: string;
  readonly magicLinkUrl: string;
  readonly ttlMinutes: number;
}

export const buildMagicLinkMessage = (
  input: BuildMagicLinkMessageInput,
): MailMessage => {
  const subject = "UBM 兵庫支部会 ログインリンク";
  const text = [
    "UBM 兵庫支部会 のメンバーサイトにログインするには、",
    `次のリンクを ${input.ttlMinutes} 分以内にクリックしてください。`,
    "",
    input.magicLinkUrl,
    "",
    "このメールに心当たりがない場合は無視してください。",
  ].join("\n");
  const html = [
    "<!DOCTYPE html>",
    "<html lang=\"ja\"><body>",
    "<p>UBM 兵庫支部会 のメンバーサイトにログインするには、",
    `次のリンクを ${input.ttlMinutes} 分以内にクリックしてください。</p>`,
    `<p><a href=\"${input.magicLinkUrl}\">${input.magicLinkUrl}</a></p>`,
    "<p>このメールに心当たりがない場合は無視してください。</p>",
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

// Resend HTTP API 実装 (https://resend.com/docs/api-reference/emails/send-email)
export const createResendSender = (params: {
  readonly apiKey: string;
  readonly fetchImpl?: typeof fetch;
}): MailSender => {
  const fetchImpl = params.fetchImpl ?? fetch;
  return {
    async send(message) {
      const res = await fetchImpl("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${params.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: message.from,
          to: [message.to],
          subject: message.subject,
          text: message.text,
          html: message.html,
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        return { ok: false, errorMessage: `mail_provider_${res.status}: ${body.slice(0, 200)}` };
      }
      const json = (await res.json().catch(() => null)) as { id?: string } | null;
      const result: MailSendResult = { ok: true };
      if (json?.id) {
        return { ...result, providerMessageId: json.id };
      }
      return result;
    },
  };
};
