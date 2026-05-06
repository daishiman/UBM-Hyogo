// Issue #401: notification dispatcher
//
// MailSender 抽象を再利用して provider 非依存に保つ。
// retryable 判定: 4xx → false (即 dlq), 5xx / network / unknown → true (retry)。

import type { MailMessage, MailSender } from "../mail/magic-link-mailer";
import type { NotificationOutboxRow } from "../../repository/notificationOutbox";

export interface DispatchResult {
  ok: boolean;
  providerMessageId?: string;
  errorMessage?: string;
  retryable: boolean;
}

export interface NotificationDispatcher {
  dispatch(row: NotificationOutboxRow): Promise<DispatchResult>;
}

export interface CreateMailDispatcherDeps {
  mailSender: MailSender;
  fromAddress: string;
  buildMessage: (row: NotificationOutboxRow, fromAddress: string) => MailMessage;
}

const FOUR_XX_RE = /(?:^|_|\s)4\d\d(?:[^0-9]|$)/;

const isRetryable = (errorMessage: string | undefined): boolean => {
  if (!errorMessage) return true;
  return !FOUR_XX_RE.test(errorMessage);
};

export const sanitizeProviderError = (
  errorMessage: string | undefined,
): string | undefined => {
  if (!errorMessage) return undefined;
  const providerStatus = errorMessage.match(/mail_provider_(\d{3})/);
  if (providerStatus) return `mail_provider_${providerStatus[1]}`;
  if (errorMessage.includes("MAIL_PROVIDER_KEY")) {
    return "mail_provider_unconfigured";
  }
  if (/network|ECONNRESET|timeout|fetch/i.test(errorMessage)) {
    return "network_error";
  }
  return "provider_error";
};

export const createMailDispatcher = (
  deps: CreateMailDispatcherDeps,
): NotificationDispatcher => ({
  async dispatch(row) {
    const message = deps.buildMessage(row, deps.fromAddress);
    try {
      const result = await deps.mailSender.send(message);
      if (result.ok) {
        const successResult: DispatchResult = { ok: true, retryable: false };
        if (result.providerMessageId !== undefined) {
          successResult.providerMessageId = result.providerMessageId;
        }
        return successResult;
      }
      const failureResult: DispatchResult = {
        ok: false,
        retryable: isRetryable(result.errorMessage),
      };
      const errorMessage = sanitizeProviderError(result.errorMessage);
      if (errorMessage !== undefined) {
        failureResult.errorMessage = errorMessage;
      }
      return failureResult;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      const sanitized = sanitizeProviderError(errorMessage);
      const failureResult: DispatchResult = {
        ok: false,
        retryable: true,
      };
      if (sanitized !== undefined) {
        failureResult.errorMessage = sanitized;
      }
      return {
        ...failureResult,
      };
    }
  },
});
