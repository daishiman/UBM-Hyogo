export type SentryAlertFilterField = "event" | "scope" | "runtime" | "digest";

export interface SentryAlertFilter {
  field: SentryAlertFilterField;
  value: string;
}

export interface SentryAlertFrequency {
  window_minutes: number;
  threshold: number;
}

export interface SentryAlertAction {
  type: "slack";
  target: string;
  workspace_id_env: string;
  channel_id_env?: string;
  tags: string[];
}

export interface CanonicalSentryPolicy {
  name: string;
  description: string;
  environment: "staging" | "production";
  action_match: "all";
  filter_match: "all";
  filters: SentryAlertFilter[];
  frequency: SentryAlertFrequency;
  actions: SentryAlertAction[];
  notification_interval_minutes: number;
}

export interface SentryRuleListEntry extends Partial<CanonicalSentryPolicy> {
  id?: string;
  name: string;
}
