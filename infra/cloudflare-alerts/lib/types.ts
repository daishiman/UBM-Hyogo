/**
 * UT-17-Followup-004: Cloudflare Notification Policy IaC types
 *
 * 共通型定義。canonicalize / diff / resolve / quota-base / load / api-client / cli から参照される。
 */

export type Metric =
  | "workers_requests_per_day"
  | "d1_read_queries_per_day"
  | "d1_write_queries_per_day"
  | "pages_requests_per_month"
  | "r2_class_a_per_month"
  | "r2_class_b_per_month"
  | string;

export interface ConditionLeaf {
  metric: string;
  threshold: number;
}

export interface ConditionAnyOf {
  anyOf: ConditionLeaf[];
}

export type CanonicalConditions = ConditionLeaf | ConditionAnyOf;

export interface CanonicalPolicy {
  name: string;
  description: string;
  alert_type: "billing_usage_alert";
  enabled: boolean;
  conditions: CanonicalConditions;
  mechanisms: { webhooks: Array<{ name: string }> };
}

export interface CanonicalWebhook {
  name: string;
  type: "generic" | "slack";
  urlRef?: string;
  url?: string;
  secretHeader?: { name: string; valueRef?: string };
}

export interface PolicyTemplateLeaf {
  metric: string;
  percentage: number;
}
export interface PolicyTemplateAnyOf {
  anyOf: PolicyTemplateLeaf[];
}

export interface PolicyTemplate {
  name: string;
  description?: string;
  alert_type: "billing_usage_alert";
  enabled: boolean;
  conditions: PolicyTemplateLeaf | PolicyTemplateAnyOf;
  mechanisms: { webhooks: Array<{ name: string }> };
}

export interface QuotaBase {
  version: number;
  source: string;
  snapshotAt?: string;
  values: Record<string, number>;
}

export interface WebhookListEntry {
  id: string;
  name: string;
  type?: string;
  url?: string;
}
