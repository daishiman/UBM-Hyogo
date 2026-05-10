// 05b: issueMagicLink use-case test
// AC-4: ok 状態時に token 発行 + mail 1 通
// AC-1〜AC-3: 各 blocked 状態では token 発行しない / mail 送らない
// 不変条件 #10: mail 失敗時 token rollback

// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../../repository/__tests__/_setup";
import { issueMagicLink } from "../issue-magic-link";
import type {
  MailSender,
  MailMessage,
} from "../../../services/mail/magic-link-mailer";
import {
  seedValidMember,
  seedRulesDeclinedMember,
  seedDeletedMember,
  VALID_EMAIL,
  RULES_DECLINED_EMAIL,
  DELETED_EMAIL,
  UNKNOWN_EMAIL,
} from "./_seed";

class RecordingSender implements MailSender {
  readonly messages: MailMessage[] = [];
  ok = true;
  errorMessage = "boom";
  async send(message: MailMessage) {
    this.messages.push(message);
    if (this.ok) return { ok: true as const };
    return { ok: false as const, errorMessage: this.errorMessage };
  }
}

const countTokens = async (env: InMemoryD1): Promise<number> => {
  const r = await env.db
    .prepare("SELECT COUNT(*) AS c FROM magic_tokens")
    .first<{ c: number }>();
  return r?.c ?? 0;
};

const buildInput = (
  env: InMemoryD1,
  email: string,
  sender: MailSender,
) => ({
  ctx: env.ctx,
  email,
  ttlSec: 900,
  mail: {
    sender,
    fromAddress: "no-reply@example.com",
    buildLinkUrl: (token: string, e: string) => `https://x.test/cb?token=${token}&email=${e}`,
  },
});

describe("issueMagicLink", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
  });

  it("AC-1: unregistered は token 発行 0 件 / mail 0 通", async () => {
    const sender = new RecordingSender();
    const r = await issueMagicLink(buildInput(env, UNKNOWN_EMAIL, sender));
    expect(r.state).toBe("unregistered");
    expect(await countTokens(env)).toBe(0);
    expect(sender.messages).toHaveLength(0);
  });

  it("AC-2: rules_declined は token 発行 0 件 / mail 0 通", async () => {
    await seedRulesDeclinedMember(env);
    const sender = new RecordingSender();
    const r = await issueMagicLink(buildInput(env, RULES_DECLINED_EMAIL, sender));
    expect(r.state).toBe("rules_declined");
    expect(await countTokens(env)).toBe(0);
    expect(sender.messages).toHaveLength(0);
  });

  it("AC-3: deleted は token 発行 0 件 / mail 0 通", async () => {
    await seedDeletedMember(env);
    const sender = new RecordingSender();
    const r = await issueMagicLink(buildInput(env, DELETED_EMAIL, sender));
    expect(r.state).toBe("deleted");
    expect(await countTokens(env)).toBe(0);
    expect(sender.messages).toHaveLength(0);
  });

  it("AC-4: 有効 user は token 発行 1 件 + mail 1 通 + state=sent", async () => {
    await seedValidMember(env);
    const sender = new RecordingSender();
    const r = await issueMagicLink(buildInput(env, VALID_EMAIL, sender));
    expect(r.state).toBe("sent");
    expect(await countTokens(env)).toBe(1);
    expect(sender.messages).toHaveLength(1);
    const m = sender.messages[0]!;
    expect(m.to).toBe(VALID_EMAIL);
    expect(m.text).toContain("https://x.test/cb?token=");
    expect(m.html).toContain("https://x.test/cb?token=");
  });

  it("F-11: mail 送信失敗時は token を rollback (DELETE) する", async () => {
    await seedValidMember(env);
    const sender = new RecordingSender();
    sender.ok = false;
    sender.errorMessage = "provider_5xx";
    const r = await issueMagicLink(buildInput(env, VALID_EMAIL, sender));
    expect(r.state).toBe("mail_failed");
    expect(await countTokens(env)).toBe(0);
  });
});
