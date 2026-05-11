// UT-17: Cloudflare Notifications generic webhook の固定シークレット検証。
// Cloudflare → relay Worker 間の認証は `cf-webhook-auth` header を
// `CF_WEBHOOK_AUTH_SECRET` と単純比較する固定シークレット方式とする。
// （body HMAC や timestamp 署名は Cloudflare 公式契約として未公開のため不採用 — Phase 02 設計）

export type CfWebhookAuthResult =
  | { ok: true }
  | { ok: false; reason: "missing-secret" | "missing-header" | "mismatch" };

function timingSafeEqualString(a: string, b: string): boolean {
  const maxLength = Math.max(a.length, b.length);
  let mismatch = a.length ^ b.length;
  for (let i = 0; i < maxLength; i += 1) {
    mismatch |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return mismatch === 0;
}

export function verifyCfWebhookAuth(
  headerValue: string | null | undefined,
  expectedSecret: string | null | undefined,
): CfWebhookAuthResult {
  if (!expectedSecret) return { ok: false, reason: "missing-secret" };
  if (!headerValue) return { ok: false, reason: "missing-header" };
  if (!timingSafeEqualString(headerValue, expectedSecret)) {
    return { ok: false, reason: "mismatch" };
  }
  return { ok: true };
}
