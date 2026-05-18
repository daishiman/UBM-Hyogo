// Issue #315: application audit_log PII redaction
// 単一の policy で「/admin/audit UI 表示」「R2 export」両方を賄う pure module。
// raw email / phone / address / actor_email を [REDACTED:<kind>] へ置換する。

export const REDACTION_POLICY_VERSION = "v1" as const;

export type RedactKind =
  | "email"
  | "phone"
  | "address"
  | "actor_email"
  | "unknown_pii";

export interface RedactedValue {
  redacted: true;
  kind: RedactKind;
}

// Email: RFC 5322 を厳密に解析せず、export gate 検知用の実用パターン
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

// 電話番号: 7 桁以上の数字列、ハイフン / スペース / 国コード許容
// 7桁以上の数字、または 3桁-4桁-4桁 / 2-4-4 等の日本国内形式
const PHONE_RE =
  /(?:\+?\d{1,3}[-\s]?)?(?:\(?\d{2,4}\)?[-\s]?)\d{2,4}[-\s]?\d{3,4}/g;

const PII_KEYS = new Set([
  "email",
  "mail",
  "phone",
  "tel",
  "telephone",
  "address",
  "addr",
  "streetaddress",
  "street_address",
  "postalcode",
  "postal_code",
  "zipcode",
  "zip_code",
  "zip",
  "住所",
  "fullname",
  "full_name",
  "displayname",
  "display_name",
  "mobile",
  "responseemail",
  "response_email",
  "actor_email",
  "actoremail",
  "actor_email",
]);

const kindForKey = (key: string): RedactKind => {
  const k = key.toLowerCase();
  if (k === "email" || k === "mail" || k === "responseemail" || k === "response_email") return "email";
  if (k === "phone" || k === "tel" || k === "telephone" || k === "mobile") return "phone";
  if (
    k === "address" ||
    k === "addr" ||
    k === "streetaddress" ||
    k === "street_address" ||
    k === "postalcode" ||
    k === "postal_code" ||
    k === "zipcode" ||
    k === "zip_code" ||
    k === "zip" ||
    k === "住所"
  ) return "address";
  if (k === "actoremail" || k === "actor_email") return "actor_email";
  return "unknown_pii";
};

const REDACTED_TAG_RE = /\[REDACTED:[a-z_]+\]/;
const ADDRESS_RE =
  /(?:〒\s*)?\d{3}-?\d{4}\s*[^\s,，。]*|(?:北海道|東京都|大阪府|京都府|.{2,3}県)[^\s,，。]{2,}(?:市|区|町|村)[^\s,，。]*/g;

export const redactString = (input: string): string => {
  if (typeof input !== "string" || input.length === 0) return input;
  // 既に redact 済の場合は idempotent
  let out = input;
  out = out.replace(EMAIL_RE, "[REDACTED:email]");
  out = out.replace(PHONE_RE, (m) => {
    // 既に置換済 token の数字部分は対象外（REDACTED tag 内）
    if (REDACTED_TAG_RE.test(m)) return m;
    // 短い数字 (4 桁未満連続) はスキップ
    const digits = m.replace(/\D/g, "");
    if (digits.length < 7) return m;
    return "[REDACTED:phone]";
  });
  out = out.replace(ADDRESS_RE, "[REDACTED:address]");
  return out;
};

export const redactJsonValue = (value: unknown): unknown => {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return redactString(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map((v) => redactJsonValue(v));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (PII_KEYS.has(k.toLowerCase())) {
        out[k] = { redacted: true, kind: kindForKey(k) } satisfies RedactedValue;
      } else {
        out[k] = redactJsonValue(v);
      }
    }
    return out;
  }
  return value;
};

export const redactAuditPayload = (
  payload: Record<string, unknown> | null,
): Record<string, unknown> | null => {
  if (payload === null) return null;
  return redactJsonValue(payload) as Record<string, unknown>;
};

export interface ExportRowInput {
  beforeJson: string | null;
  afterJson: string | null;
  actorEmail: string | null;
}

export interface ExportRowRedacted {
  beforeJson: string | null;
  afterJson: string | null;
  actorEmailMasked: string | null;
}

const redactJsonString = (s: string | null): string | null => {
  if (s === null || s === "") return s;
  try {
    const parsed = JSON.parse(s) as unknown;
    const redacted = redactJsonValue(parsed);
    return JSON.stringify(redacted);
  } catch {
    // fallback: 文字列として redact
    return redactString(s);
  }
};

export const redactForExport = (row: ExportRowInput): ExportRowRedacted => ({
  beforeJson: redactJsonString(row.beforeJson),
  afterJson: redactJsonString(row.afterJson),
  actorEmailMasked: row.actorEmail === null ? null : "[REDACTED:actor_email]",
});
