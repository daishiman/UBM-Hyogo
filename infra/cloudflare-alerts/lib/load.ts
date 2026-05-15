/**
 * UT-17-Followup-004: load
 *
 * `infra/cloudflare-alerts/` 配下の JSON を読み込み、quota-base 適用 + canonical 化済みの
 * expected を返す。CLI / diff / apply の入口で利用される。
 */
import fs from "node:fs";
import path from "node:path";
import type {
  CanonicalPolicy,
  CanonicalWebhook,
  PolicyTemplate,
  QuotaBase,
} from "./types.ts";
import { applyQuotaBase } from "./quota-base.ts";
import { canonicalizePolicy, canonicalizeWebhook } from "./canonicalize.ts";

function readJson<T = unknown>(p: string): T {
  const raw = fs.readFileSync(p, "utf-8");
  return JSON.parse(raw) as T;
}

function listJsonFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => path.join(dir, f));
}

export interface ExpectedSet {
  policies: CanonicalPolicy[];
  webhooks: CanonicalWebhook[];
  quotaBase: QuotaBase;
}

export function loadExpected(repoRoot: string): ExpectedSet {
  const base = readJson<QuotaBase>(
    path.join(repoRoot, "infra/cloudflare-alerts/quota-base.json"),
  );
  const policyFiles = listJsonFiles(path.join(repoRoot, "infra/cloudflare-alerts/policies"));
  const webhookFiles = listJsonFiles(path.join(repoRoot, "infra/cloudflare-alerts/webhooks"));

  const policies = policyFiles.map((f) => {
    const tpl = readJson<PolicyTemplate>(f);
    const applied = applyQuotaBase(tpl, base);
    // 既に canonical form だが念のため canonicalize を通して description trim / sort 等を統一
    return canonicalizePolicy(applied);
  });
  const webhooks = webhookFiles.map((f) => canonicalizeWebhook(readJson(f)));
  return { policies, webhooks, quotaBase: base };
}
