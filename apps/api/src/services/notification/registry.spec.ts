// Issue #55: NotificationChannelRegistry behaviour
import { describe, it, expect } from "vitest";
import { createNotificationChannelRegistry } from "./registry";
import type { NotificationChannel } from "./channel";

const stubMail: NotificationChannel = {
  kind: "mail",
  async dispatch() {
    return { ok: true, retryable: false };
  },
};

describe("NotificationChannelRegistry", () => {
  it("resolve('mail') returns the registered mail channel", () => {
    const reg = createNotificationChannelRegistry({ mail: stubMail });
    expect(reg.resolve("mail")).toBe(stubMail);
  });

  it("resolve unknown kind returns undefined", () => {
    const reg = createNotificationChannelRegistry({ mail: stubMail });
    expect(reg.resolve("line")).toBeUndefined();
  });

  it("empty registry resolves nothing", () => {
    const reg = createNotificationChannelRegistry({});
    expect(reg.resolve("mail")).toBeUndefined();
    expect(reg.kinds()).toEqual([]);
  });

  it("kinds() returns registered kinds", () => {
    const reg = createNotificationChannelRegistry({ mail: stubMail });
    expect(reg.kinds()).toEqual(["mail"]);
  });
});
