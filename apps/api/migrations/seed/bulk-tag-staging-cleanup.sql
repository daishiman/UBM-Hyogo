-- Remove issue-1081 bulk tag smoke fixtures.
-- Invariant: every DELETE targets only the `e2e_test_issue1081_%` synthetic prefix.

BEGIN TRANSACTION;

DELETE FROM member_tags WHERE member_id LIKE 'e2e_test_issue1081_%';
DELETE FROM audit_log WHERE target_id LIKE 'e2e_test_issue1081_%';
DELETE FROM member_status WHERE member_id LIKE 'e2e_test_issue1081_%';
DELETE FROM member_identities WHERE member_id LIKE 'e2e_test_issue1081_%';
DELETE FROM member_responses WHERE response_id LIKE 'e2e_test_issue1081_%';
DELETE FROM tag_definitions WHERE tag_id LIKE 'e2e_test_issue1081_%';

COMMIT;
