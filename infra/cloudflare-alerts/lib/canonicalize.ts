/**
 * UT-17-Followup-004: canonicalize
 *
 * Cloudflare API response と repo 上の JSON を「同じ canonical form」に変換する純関数。
 * Phase 7 §7-2 C1〜C8 を満たす。
 */
import type { CanonicalPolicy, CanonicalWebhook, CanonicalConditions } from "./types.ts";

const POLICY_STRIP_KEYS = new Set([
  "id",
  "created",
  "modified",
  "account_id",
  "$schema",
]);

const WEBHOOK_STRIP_KEYS = new Set([
  "id",
  "created",
  "created_at",
  "modified",
  "account_id",
  "secret",
  "$schema",
]);

function isObject(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}

function sortKeys<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(sortKeys) as unknown as T;
  }
  if (isObject(obj)) {
    const sorted: Record<string, unknown> = {};
    for (const k of Object.keys(obj).sort()) {
      sorted[k] = sortKeys((obj as Record<string, unknown>)[k]);
    }
    return sorted as unknown as T;
  }
  return obj;
}

function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) {
    return Number(v);
  }
  throw new TypeError(`expected number, got: ${JSON.stringify(v)}`);
}

function normalizeLeaf(leaf: unknown): { metric: string; threshold: number } {
  if (!isObject(leaf)) throw new TypeError("condition leaf is not object");
  const metric = String(leaf.metric ?? "");
  if (!metric) throw new TypeError("condition leaf missing metric");
  // threshold は number 化 (API は string で返すことがある)
  // percentage が来た場合 (template) は触らず別経路で処理される想定なので、
  // ここでは threshold が無ければそのまま渡す。
  if (leaf.threshold !== undefined) {
    return { metric, threshold: toNumber(leaf.threshold) };
  }
  if (leaf.percentage !== undefined) {
    // template 由来 — canonicalize は通常 quota-base 適用後に呼ばれるため
    // ここに来るのは異常系 (template を直接 canonicalize した) 想定。
    throw new Error(
      `canonicalize received template (percentage=${String(leaf.percentage)}) for metric=${metric}; apply quota-base first`,
    );
  }
  throw new TypeError(`condition leaf missing threshold for metric=${metric}`);
}

function normalizeConditions(c: unknown): CanonicalConditions {
  if (!isObject(c)) throw new TypeError("conditions is not object");
  if (Array.isArray(c.anyOf)) {
    return { anyOf: c.anyOf.map(normalizeLeaf) };
  }
  return normalizeLeaf(c);
}

export function canonicalizePolicy(
  input: unknown,
  webhookIdToName?: Record<string, string>,
): CanonicalPolicy {
  if (!isObject(input)) {
    throw new TypeError("policy is not object");
  }
  // shallow clone — strip server-generated keys
  const o: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (!POLICY_STRIP_KEYS.has(k)) o[k] = v;
  }

  const name = String(o.name ?? "");
  if (!name) throw new TypeError("policy missing name");

  const mechanismsRaw = isObject(o.mechanisms) ? o.mechanisms : {};
  const webhooksRaw = Array.isArray(mechanismsRaw.webhooks) ? mechanismsRaw.webhooks : [];
  const webhooks = webhooksRaw.map((w: unknown) => {
    if (!isObject(w)) throw new TypeError("webhook ref is not object");
    if (typeof w.name === "string" && w.name) return { name: w.name };
    if (typeof w.id === "string" && webhookIdToName?.[w.id]) {
      return { name: webhookIdToName[w.id] };
    }
    throw new Error(`cannot resolve webhook ref: ${JSON.stringify(w)}`);
  });

  const conditions = normalizeConditions(o.conditions);
  const description = String(o.description ?? "").trimEnd();
  const alertType = o.alert_type === "billing_usage_alert"
    ? "billing_usage_alert"
    : (() => {
        throw new Error(`unsupported alert_type: ${String(o.alert_type)}`);
      })();
  const enabled = Boolean(o.enabled);

  return sortKeys({
    name,
    description,
    alert_type: alertType,
    enabled,
    conditions,
    mechanisms: { webhooks },
  } satisfies CanonicalPolicy);
}

export function canonicalizeWebhook(input: unknown): CanonicalWebhook {
  if (!isObject(input)) throw new TypeError("webhook is not object");
  const o: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (!WEBHOOK_STRIP_KEYS.has(k)) o[k] = v;
  }
  const name = String(o.name ?? "");
  if (!name) throw new TypeError("webhook missing name");
  const type = (o.type === "slack" ? "slack" : "generic") as "generic" | "slack";

  // canonical form は name + type のみで比較可能にする (D8 の url 比較は
  // 明示的に url を含む 2 entry の比較時のみ起きるよう、戻り値で表す)。
  // urlRef は repo 由来 (write-only) なので diff 対象外。
  // actual 側の url は drift 表示には残すが diff 比較からは除外する。
  const out: CanonicalWebhook = { name, type };
  if (typeof o.url === "string") out.url = o.url;
  if (typeof o.urlRef === "string") out.urlRef = o.urlRef;
  if (isObject(o.secretHeader)) {
    const sh = o.secretHeader;
    out.secretHeader = {
      name: String(sh.name ?? ""),
      ...(typeof sh.valueRef === "string" ? { valueRef: sh.valueRef } : {}),
    };
  }
  return sortKeys(out);
}
