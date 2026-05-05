// 05b-B: callback route から API worker `/auth/magic-link/verify` を呼ぶ helper。
// 不変条件 #5: web は D1 を直接参照しない。verify は API worker に委譲する。
// AC-3: 失敗 reason は /login?error=<mapped> に対応する識別子へ正規化する。

const FALLBACK_INTERNAL_API = "http://127.0.0.1:8787";

const resolveApiBase = (override?: string): string => {
  const v = override ?? process.env["INTERNAL_API_BASE_URL"];
  if (v && v.length > 0) return v.replace(/\/$/, "");
  return FALLBACK_INTERNAL_API;
};

export interface VerifyMagicLinkUser {
  readonly email: string;
  readonly memberId: string;
  readonly responseId: string;
  readonly isAdmin: boolean;
  readonly authGateState: "active" | "rules_declined" | "deleted";
}

export type VerifyFailureReason =
  | "not_found"
  | "expired"
  | "already_used"
  | "resolve_failed"
  | "temporary_failure";

export type VerifyMagicLinkResult =
  | { readonly ok: true; readonly user: VerifyMagicLinkUser }
  | { readonly ok: false; readonly reason: VerifyFailureReason };

export interface VerifyMagicLinkInput {
  readonly token: string;
  readonly email: string;
  readonly apiBaseUrl?: string;
  readonly fetchImpl?: typeof fetch;
}

/** AC-3 mapping: API failure reason → /login?error=<key>. */
export const mapVerifyReasonToLoginError = (
  reason: VerifyFailureReason,
): string => {
  switch (reason) {
    case "not_found":
      return "invalid_link";
    case "expired":
      return "expired";
    case "already_used":
      return "already_used";
    case "resolve_failed":
      return "resolve_failed";
    case "temporary_failure":
      return "temporary_failure";
  }
};

const isValidUser = (v: unknown): v is VerifyMagicLinkUser => {
  if (v === null || typeof v !== "object") return false;
  const u = v as Partial<VerifyMagicLinkUser>;
  return (
    typeof u.email === "string" &&
    typeof u.memberId === "string" &&
    typeof u.responseId === "string" &&
    typeof u.isAdmin === "boolean" &&
    (u.authGateState === "active" ||
      u.authGateState === "rules_declined" ||
      u.authGateState === "deleted")
  );
};

const KNOWN_REASONS: ReadonlySet<VerifyFailureReason> = new Set([
  "not_found",
  "expired",
  "already_used",
  "resolve_failed",
]);

/**
 * API worker `POST /auth/magic-link/verify` を server-to-server で呼ぶ。
 * 通信失敗・想定外の shape は `temporary_failure` として fail-closed で返す。
 */
export const verifyMagicLink = async (
  input: VerifyMagicLinkInput,
): Promise<VerifyMagicLinkResult> => {
  const fetchImpl = input.fetchImpl ?? fetch;
  const url = `${resolveApiBase(input.apiBaseUrl)}/auth/magic-link/verify`;
  let res: Response;
  try {
    res = await fetchImpl(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: input.token, email: input.email }),
    });
  } catch {
    return { ok: false, reason: "temporary_failure" };
  }
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return { ok: false, reason: "temporary_failure" };
  }
  if (data === null || typeof data !== "object") {
    return { ok: false, reason: "temporary_failure" };
  }
  const obj = data as { ok?: unknown; user?: unknown; reason?: unknown };
  if (obj.ok === true && isValidUser(obj.user)) {
    return { ok: true, user: obj.user };
  }
  if (obj.ok === false && typeof obj.reason === "string") {
    if (KNOWN_REASONS.has(obj.reason as VerifyFailureReason)) {
      return { ok: false, reason: obj.reason as VerifyFailureReason };
    }
    return { ok: false, reason: "resolve_failed" };
  }
  return { ok: false, reason: "temporary_failure" };
};
