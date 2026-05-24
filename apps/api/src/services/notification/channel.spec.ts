// Issue #55: NotificationChannel type contract
import { describe, it, expect } from "vitest";
import type { NotificationChannel } from "./channel";
import { createMailNotificationChannel } from "./channels/mail";

describe("NotificationChannel contract", () => {
  it("MailNotificationChannel exposes kind='mail' and dispatch()", () => {
    const channel: NotificationChannel = createMailNotificationChannel({
      mailSender: { async send() { return { ok: true, providerMessageId: "msg_x" }; } },
      fromAddress: "noreply@example.com",
      buildMessage: () => ({
        to: "u@example.com",
        from: "noreply@example.com",
        subject: "s",
        text: "t",
        html: "<p>t</p>",
      }),
    });
    expect(channel.kind).toBe("mail");
    expect(typeof channel.dispatch).toBe("function");
  });
});
