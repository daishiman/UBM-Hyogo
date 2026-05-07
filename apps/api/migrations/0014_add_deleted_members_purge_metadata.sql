-- 0014_add_deleted_members_purge_metadata.sql
-- Issue #402: retention purge job のための metadata 列追加
-- deleted_members は audit minimum tombstone として残す方針なので row 自体は削除せず、
-- purged_at / retention_policy_version で物理削除済みマーカーを保持する。
-- purged_at は nullable に保ち、既存 row を即時 purge 済みにしない（DEFAULT 0 は禁止）。

ALTER TABLE deleted_members ADD COLUMN purged_at TEXT;
ALTER TABLE deleted_members ADD COLUMN retention_policy_version TEXT;

CREATE INDEX IF NOT EXISTS idx_deleted_members_purge_due
  ON deleted_members (deleted_at, purged_at);
