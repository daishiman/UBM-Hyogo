// u-04: 既存 jobs/sync-lock.ts を sync layer の正本 mutex として再 export。
// SQL は変更せず、unique INSERT による単文排他を継承する。

export {
  acquireSyncLock,
  releaseSyncLock,
  type SyncLock,
  type AcquireOptions,
} from "../jobs/sync-lock";
