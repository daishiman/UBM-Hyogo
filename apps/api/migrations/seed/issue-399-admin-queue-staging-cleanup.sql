-- issue-399-admin-queue-staging-cleanup.sql
-- Reverses issue-399-admin-queue-staging-seed.sql.
-- Idempotent: targets only synthetic ISSUE399- prefixed rows.

BEGIN TRANSACTION;
DELETE FROM audit_log
 WHERE target_id LIKE 'ISSUE399-%'
    OR actor_email = 'issue399-seed@example.invalid';
DELETE FROM deleted_members WHERE member_id LIKE 'ISSUE399-%';
DELETE FROM admin_member_notes WHERE note_id LIKE 'ISSUE399-%';
DELETE FROM member_status      WHERE member_id LIKE 'ISSUE399-%';
COMMIT;

-- Verification (must return 0 / 0 / 0 / 0).
SELECT count(*) AS remaining_audit   FROM audit_log WHERE target_id LIKE 'ISSUE399-%';
SELECT count(*) AS remaining_deleted FROM deleted_members WHERE member_id LIKE 'ISSUE399-%';
SELECT count(*) AS remaining_notes   FROM admin_member_notes WHERE note_id  LIKE 'ISSUE399-%';
SELECT count(*) AS remaining_members FROM member_status      WHERE member_id LIKE 'ISSUE399-%';
