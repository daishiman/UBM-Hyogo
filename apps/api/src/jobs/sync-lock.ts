// UT-09: sync_locks テーブルを使った TTL 付き二重実行防止。
// expired lock は強制 release し、新しい holder で取得する。

export interface SyncLock {
  readonly id: string;
  readonly holder: string;
  readonly acquiredAt: string;
  readonly expiresAt: string;
}

export interface AcquireOptions {
  readonly lockId?: string;
  readonly holder: string;
  readonly triggerType: "cron" | "admin" | "backfill";
  readonly ttlMs: number;
  readonly now?: () => Date;
}

const DEFAULT_LOCK_ID = "sheets-to-d1";

export async function acquireSyncLock(
  db: D1Database,
  options: AcquireOptions,
): Promise<SyncLock | null> {
  const now = (options.now ?? (() => new Date()))();
  const lockId = options.lockId ?? DEFAULT_LOCK_ID;
  const acquiredAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + options.ttlMs).toISOString();

  // expired lock を先に削除する
  await db
    .prepare("DELETE FROM sync_locks WHERE id = ?1 AND expires_at < ?2")
    .bind(lockId, acquiredAt)
    .run();

  try {
    await db
      .prepare(
        "INSERT INTO sync_locks (id, acquired_at, expires_at, holder, trigger_type) VALUES (?1, ?2, ?3, ?4, ?5)",
      )
      .bind(lockId, acquiredAt, expiresAt, options.holder, options.triggerType)
      .run();
  } catch (_err) {
    return null;
  }

  return {
    id: lockId,
    holder: options.holder,
    acquiredAt,
    expiresAt,
  };
}

export async function releaseSyncLock(
  db: D1Database,
  lock: SyncLock,
): Promise<void> {
  await db
    .prepare("DELETE FROM sync_locks WHERE id = ?1 AND holder = ?2")
    .bind(lock.id, lock.holder)
    .run();
}
