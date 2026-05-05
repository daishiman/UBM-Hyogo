/**
 * Shared sync ledger facade.
 *
 * Owner table: docs/30-workflows/_design/sync-shared-modules-owner.md
 * Owner: 03a / co-owner: 03b.
 */
export {
  ALLOWED_TRANSITIONS,
  IllegalStateTransition,
  SyncJobNotFound,
  fail,
  findLatest,
  listRecent,
  start,
  succeed,
} from "../../repository/syncJobs";

export type {
  SyncJobKind,
  SyncJobRow,
  SyncJobStatus,
} from "../../repository/syncJobs";
