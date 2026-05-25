import type {
  CanonicalSentryPolicy,
  SentryAlertAction,
  SentryAlertFilter,
} from "./types.ts";

const STRIP_KEYS = new Set([
  "$schema",
  "id",
  "dateCreated",
  "dateUpdated",
  "created",
  "modified",
  "actorId",
  "projectId",
  "organizationId",
  "dateModified",
  "createdBy",
  "originalAlertRuleId",
  "snooze",
  "status",
]);

function isObject(input: unknown): input is Record<string, unknown> {
  return input !== null && typeof input === "object" && !Array.isArray(input);
}

function sortKeys<T>(input: T): T {
  if (Array.isArray(input)) return input.map(sortKeys) as T;
  if (!isObject(input)) return input;
  return Object.fromEntries(
    Object.entries(input)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => [key, sortKeys(value)]),
  ) as T;
}

function canonicalFilter(input: unknown): SentryAlertFilter {
  if (!isObject(input)) throw new TypeError("filter is not object");
  const field = input.field ?? input.key;
  if (!["event", "scope", "runtime", "digest"].includes(String(field))) {
    throw new Error(`unsupported filter field: ${String(field)}`);
  }
  return { field: field as SentryAlertFilter["field"], value: String(input.value ?? "") };
}

function canonicalAction(input: unknown): SentryAlertAction {
  if (!isObject(input)) throw new TypeError("action is not object");
  const type = input.type ?? input.id;
  if (type !== "slack" && type !== "sentry.integrations.slack.notify_action.SlackNotifyServiceAction") {
    throw new Error(`unsupported action type: ${String(type)}`);
  }
  const tags = input.tags === undefined
    ? []
    : String(input.tags)
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .sort();
  return {
    type: "slack",
    target: String(input.target ?? input.channel ?? ""),
    workspace_id_env: String(input.workspace_id_env ?? "SENTRY_SLACK_WORKSPACE_ID"),
    ...(typeof input.channel_id_env === "string" ? { channel_id_env: input.channel_id_env } : {}),
    tags,
  };
}

function intervalToMinutes(input: unknown): number {
  if (typeof input === "number") return input;
  const value = String(input);
  const match = value.match(/^(\d+)(m|h|d|w)$/);
  if (!match) return Number(value);
  const amount = Number(match[1]);
  const unit = match[2];
  if (unit === "h") return amount * 60;
  if (unit === "d") return amount * 1440;
  if (unit === "w") return amount * 10080;
  return amount;
}

function minutesToInterval(minutes: number): string {
  if (minutes % 10080 === 0) return `${minutes / 10080}w`;
  if (minutes % 1440 === 0) return `${minutes / 1440}d`;
  if (minutes % 60 === 0) return `${minutes / 60}h`;
  return `${minutes}m`;
}

export function canonicalizeSentryPolicy(input: unknown): CanonicalSentryPolicy {
  if (!isObject(input)) throw new TypeError("policy is not object");
  const stripped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (!STRIP_KEYS.has(key)) stripped[key] = value;
  }

  const name = String(stripped.name ?? "");
  if (!name) throw new TypeError("policy missing name");
  const filters = (Array.isArray(stripped.filters) ? stripped.filters : [])
    .map(canonicalFilter)
    .sort((a, b) => `${a.field}:${a.value}`.localeCompare(`${b.field}:${b.value}`));
  const condition = Array.isArray(stripped.conditions)
    ? stripped.conditions.find((item) => isObject(item) && String(item.id).includes("EventFrequencyCondition"))
    : undefined;
  const frequency = isObject(stripped.frequency) ? stripped.frequency : {};
  const windowMinutes = Number(
    frequency.window_minutes ?? (isObject(condition) ? intervalToMinutes(condition.interval) : undefined),
  );
  const threshold = Number(frequency.threshold ?? (isObject(condition) ? condition.value : undefined));
  const actions = (Array.isArray(stripped.actions) ? stripped.actions : []).map(canonicalAction);

  return sortKeys({
    name,
    description: String(stripped.description ?? "").trimEnd(),
    environment: stripped.environment === "production" ? "production" : "staging",
    action_match: "all",
    filter_match: "all",
    filters,
    frequency: {
      window_minutes: windowMinutes,
      threshold,
    },
    actions,
    notification_interval_minutes: Number(
      stripped.notification_interval_minutes ??
        (!isObject(stripped.frequency) ? stripped.frequency : undefined) ??
        5,
    ),
  } satisfies CanonicalSentryPolicy);
}

export { minutesToInterval };
