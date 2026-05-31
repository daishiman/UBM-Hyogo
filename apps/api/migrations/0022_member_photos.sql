-- 0022_member_photos.sql
-- issue-983: admin-managed member photo metadata
-- invariant #4: Google Form schema 外データを admin-managed として分離する。
-- member_id は member_identities と論理 FK（D1 は application 層で整合、FK 制約なし）。
CREATE TABLE IF NOT EXISTS member_photos (
  member_id    TEXT    PRIMARY KEY,
  object_key   TEXT    NOT NULL,
  content_type TEXT    NOT NULL,
  byte_size    INTEGER NOT NULL,
  uploaded_by  TEXT    NOT NULL,
  uploaded_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
