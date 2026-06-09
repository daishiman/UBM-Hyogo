-- Remove issue-1125 bulk tag result visual baseline fixtures.
-- Invariant: every DELETE targets only the `e2e_test_issue1125_%` synthetic prefix.
-- D1 remote executes --file as a batch; do not add explicit BEGIN/COMMIT here.

DELETE FROM member_tags WHERE member_id LIKE 'e2e_test_issue1125_%';
DELETE FROM audit_log WHERE target_id LIKE 'e2e_test_issue1125_%';
DELETE FROM member_status WHERE member_id LIKE 'e2e_test_issue1125_%';
DELETE FROM member_identities WHERE member_id LIKE 'e2e_test_issue1125_%';
DELETE FROM member_responses WHERE response_id LIKE 'e2e_test_issue1125_%';
DELETE FROM tag_definitions WHERE tag_id LIKE 'e2e_test_issue1125_%';
