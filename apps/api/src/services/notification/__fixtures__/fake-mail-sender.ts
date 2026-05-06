import type {
  MailMessage,
  MailSendResult,
  MailSender,
} from "../../mail/magic-link-mailer";

export interface FakeMailSender extends MailSender {
  readonly sent: MailMessage[];
  setNextResult(result: MailSendResult | (() => MailSendResult)): void;
  setNextThrow(error: Error): void;
}

export const createFakeMailSender = (): FakeMailSender => {
  const sent: MailMessage[] = [];
  let nextResult: MailSendResult | (() => MailSendResult) = { ok: true };
  let nextThrow: Error | null = null;
  return {
    sent,
    setNextResult(result) {
      nextResult = result;
    },
    setNextThrow(error) {
      nextThrow = error;
    },
    async send(message) {
      sent.push(message);
      if (nextThrow) {
        const e = nextThrow;
        nextThrow = null;
        throw e;
      }
      return typeof nextResult === "function" ? nextResult() : nextResult;
    },
  };
};
