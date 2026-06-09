-- Staging-only synthetic seed for issue-1125 bulk tag result visual baselines.
-- All rows use the synthetic prefix `e2e_test_issue1125_` so cleanup can target them safely.
-- D1 remote executes --file as a batch; do not add explicit BEGIN/COMMIT here.
-- Tables touched (no ALTER): member_responses, member_identities, member_status, tag_definitions.

DELETE FROM member_tags WHERE member_id LIKE 'e2e_test_issue1125_%';
DELETE FROM audit_log WHERE target_id LIKE 'e2e_test_issue1125_%';
DELETE FROM member_status WHERE member_id LIKE 'e2e_test_issue1125_%';
DELETE FROM member_identities WHERE member_id LIKE 'e2e_test_issue1125_%';
DELETE FROM member_responses WHERE response_id LIKE 'e2e_test_issue1125_%';
DELETE FROM tag_definitions WHERE tag_id LIKE 'e2e_test_issue1125_%';

INSERT OR REPLACE INTO member_responses
  (response_id, form_id, revision_id, schema_hash, response_email, submitted_at, answers_json, search_text)
VALUES
  ('e2e_test_issue1125_resp_all_1', 'e2e_test_issue1125_form', 'rev1', 'hash1',
   'e2e_test_issue1125_all_1@example.test', datetime('now'),
   '{"fullName":"e2e_test_issue1125_all_success_1","occupation":"visual baseline","ubmZone":"north","ubmMembershipType":"member"}',
   'e2e_test_issue1125 all success 1'),
  ('e2e_test_issue1125_resp_all_2', 'e2e_test_issue1125_form', 'rev1', 'hash1',
   'e2e_test_issue1125_all_2@example.test', datetime('now'),
   '{"fullName":"e2e_test_issue1125_all_success_2","occupation":"visual baseline","ubmZone":"north","ubmMembershipType":"member"}',
   'e2e_test_issue1125 all success 2'),
  ('e2e_test_issue1125_resp_partial_active', 'e2e_test_issue1125_form', 'rev1', 'hash1',
   'e2e_test_issue1125_partial_active@example.test', datetime('now'),
   '{"fullName":"e2e_test_issue1125_partial_active","occupation":"visual baseline","ubmZone":"north","ubmMembershipType":"member"}',
   'e2e_test_issue1125 partial active'),
  ('e2e_test_issue1125_resp_partial_deleted', 'e2e_test_issue1125_form', 'rev1', 'hash1',
   'e2e_test_issue1125_partial_deleted@example.test', datetime('now'),
   '{"fullName":"e2e_test_issue1125_partial_deleted","occupation":"visual baseline","ubmZone":"north","ubmMembershipType":"member"}',
   'e2e_test_issue1125 partial deleted');

INSERT OR REPLACE INTO member_identities
  (member_id, response_email, current_response_id, first_response_id, last_submitted_at)
VALUES
  ('e2e_test_issue1125_mem_all_1', 'e2e_test_issue1125_all_1@example.test',
   'e2e_test_issue1125_resp_all_1', 'e2e_test_issue1125_resp_all_1', datetime('now')),
  ('e2e_test_issue1125_mem_all_2', 'e2e_test_issue1125_all_2@example.test',
   'e2e_test_issue1125_resp_all_2', 'e2e_test_issue1125_resp_all_2', datetime('now')),
  ('e2e_test_issue1125_mem_partial_active', 'e2e_test_issue1125_partial_active@example.test',
   'e2e_test_issue1125_resp_partial_active', 'e2e_test_issue1125_resp_partial_active', datetime('now')),
  ('e2e_test_issue1125_mem_partial_deleted', 'e2e_test_issue1125_partial_deleted@example.test',
   'e2e_test_issue1125_resp_partial_deleted', 'e2e_test_issue1125_resp_partial_deleted', datetime('now'));

INSERT OR REPLACE INTO member_status
  (member_id, public_consent, rules_consent, publish_state, is_deleted, updated_by, updated_at)
VALUES
  ('e2e_test_issue1125_mem_all_1', 'consented', 'consented', 'member_only', 0, 'e2e_test_issue1125_seed', datetime('now')),
  ('e2e_test_issue1125_mem_all_2', 'consented', 'consented', 'member_only', 0, 'e2e_test_issue1125_seed', datetime('now')),
  ('e2e_test_issue1125_mem_partial_active', 'consented', 'consented', 'member_only', 0, 'e2e_test_issue1125_seed', datetime('now')),
  ('e2e_test_issue1125_mem_partial_deleted', 'consented', 'consented', 'member_only', 1, 'e2e_test_issue1125_seed', datetime('now'));

INSERT OR REPLACE INTO tag_definitions
  (tag_id, code, label, category, source_stable_keys_json, active)
VALUES
  ('e2e_test_issue1125_tag_all', 'e2e_test_issue1125_tag_all', 'issue1125 result all-success', 'e2e_test_issue1125', '[]', 1),
  ('e2e_test_issue1125_tag_partial', 'e2e_test_issue1125_tag_partial', 'issue1125 result partial-failure', 'e2e_test_issue1125', '[]', 1);
