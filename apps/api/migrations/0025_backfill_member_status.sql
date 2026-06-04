-- 0025_backfill_member_status.sql
-- Backfill default member_status rows for identities created without the
-- admin-managed status companion row.

INSERT OR IGNORE INTO member_status (member_id)
SELECT mi.member_id
FROM member_identities mi
LEFT JOIN member_status ms ON ms.member_id = mi.member_id
WHERE ms.member_id IS NULL;
