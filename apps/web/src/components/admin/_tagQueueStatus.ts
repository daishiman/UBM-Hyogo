import type { TagQueueStatus } from "./TagQueuePanel";

export interface TagQueueStatusTokenEntry {
  readonly label: string;
  readonly tokenVar: string;
}

export const TAG_QUEUE_STATUS_TOKEN: Record<TagQueueStatus, TagQueueStatusTokenEntry> = {
  queued: { label: "未対応", tokenVar: "var(--status-info-bg)" },
  reviewing: { label: "対応中", tokenVar: "var(--status-warn-bg)" },
  resolved: { label: "承認済", tokenVar: "var(--status-success-bg)" },
  rejected: { label: "却下", tokenVar: "var(--status-danger-bg)" },
  dlq: { label: "DLQ", tokenVar: "var(--status-neutral-bg)" },
};

export const TERMINAL_TAG_QUEUE_STATUSES: ReadonlySet<TagQueueStatus> = new Set([
  "resolved",
  "rejected",
  "dlq",
]);
