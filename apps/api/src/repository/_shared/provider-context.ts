import type { AttendanceProvider } from "../attendance";
import type { AdminNotesProvider } from "../adminNotes";
import type { AdminMemberNoteRow, ListPendingRequestsCursor } from "../adminNotes";
import type { AuditLogProvider } from "../auditLog";
import type { AuditLogListRow } from "../auditLog";
import type { MemberTagsProvider } from "../memberTags";
import type { NotificationOutboxRepository, NotificationOutboxRow } from "../notificationOutbox";
import type { TagDefinitionsProvider } from "../tagDefinitions";
import type { TagQueueProvider } from "../tagQueue";
import type { TagAssignmentQueueRow, TagQueueStatus } from "../tagQueue";
import type { DbCtx } from "./db";

export type AttendanceProviderVariables = {
  attendanceProvider: AttendanceProvider;
};

export type WriteTagNoteProviderVariables = {
  adminNotesProvider: AdminNotesProvider;
  auditLogProvider: AuditLogProvider;
  notificationOutboxProvider: NotificationOutboxRepository;
  tagDefinitionsProvider: TagDefinitionsProvider;
  tagQueueProvider: TagQueueProvider;
  memberTagsProvider: MemberTagsProvider;
};

export type RepositoryProviderVariables =
  AttendanceProviderVariables & Partial<WriteTagNoteProviderVariables>;

export type RepositoryProviderCtx = DbCtx & {
  readonly var: RepositoryProviderVariables;
};

export type WriteTagNoteProviderCtx = DbCtx & {
  readonly var: WriteTagNoteProviderVariables;
};

export type WriteTagNoteProviderBundle = WriteTagNoteProviderVariables;

export type {
  AdminMemberNoteRow,
  AuditLogListRow,
  ListPendingRequestsCursor,
  MemberTagsProvider,
  NotificationOutboxRepository,
  NotificationOutboxRow,
  TagAssignmentQueueRow,
  TagQueueStatus,
};

export function requireProvider<T>(provider: T | undefined, name: string): T {
  if (!provider) throw new Error(`${name} not bound to context`);
  return provider;
}
