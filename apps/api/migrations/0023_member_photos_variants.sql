-- 0023_member_photos_variants.sql
-- issue-1030: member photo の display/thumb variant pipeline（client-side / free-tier）
-- 後方互換 ADD COLUMN のみ（全列 nullable または DEFAULT 付き）。
-- SQLite の ALTER TABLE ... ADD COLUMN は既存行を再書き込みせず非破壊。
-- invariant #4: variant メタデータは admin-managed として member_photos に分離。
ALTER TABLE member_photos ADD COLUMN thumb_object_key  TEXT;
ALTER TABLE member_photos ADD COLUMN thumb_byte_size   INTEGER;
ALTER TABLE member_photos ADD COLUMN content_hash      TEXT;
ALTER TABLE member_photos ADD COLUMN processing_status TEXT NOT NULL DEFAULT 'none';
