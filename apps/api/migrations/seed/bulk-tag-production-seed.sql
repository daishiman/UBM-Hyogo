-- Production-only synthetic seed for issue-1137 bulk tag runtime smoke.
-- All rows use the synthetic prefix `e2e_test_prod_tagbulk_` so cleanup can target them safely.
-- Tables touched (no ALTER): member_responses, member_identities, member_status, tag_definitions.
-- Invariant: never seed real PII; never run without the production runner's dual approval markers.

BEGIN TRANSACTION;

DELETE FROM member_tags WHERE member_id LIKE 'e2e_test_prod_tagbulk_%';
DELETE FROM audit_log WHERE target_id LIKE 'e2e_test_prod_tagbulk_%';

INSERT OR REPLACE INTO member_responses
  (response_id, form_id, revision_id, schema_hash, response_email, submitted_at, answers_json)
VALUES
  ('e2e_test_prod_tagbulk_resp_1', 'e2e_test_prod_tagbulk_form', 'rev1', 'hash1',
   'e2e_test_prod_tagbulk_mem_1@example.test', datetime('now'), '{}'),
  ('e2e_test_prod_tagbulk_resp_2', 'e2e_test_prod_tagbulk_form', 'rev1', 'hash1',
   'e2e_test_prod_tagbulk_mem_2@example.test', datetime('now'), '{}');

INSERT OR REPLACE INTO member_identities
  (member_id, response_email, current_response_id, first_response_id, last_submitted_at)
VALUES
  ('e2e_test_prod_tagbulk_mem_1', 'e2e_test_prod_tagbulk_mem_1@example.test',
   'e2e_test_prod_tagbulk_resp_1', 'e2e_test_prod_tagbulk_resp_1', datetime('now')),
  ('e2e_test_prod_tagbulk_mem_2', 'e2e_test_prod_tagbulk_mem_2@example.test',
   'e2e_test_prod_tagbulk_resp_2', 'e2e_test_prod_tagbulk_resp_2', datetime('now'));

INSERT OR REPLACE INTO member_status
  (member_id, public_consent, rules_consent, publish_state, is_deleted, updated_by, updated_at)
VALUES
  ('e2e_test_prod_tagbulk_mem_1', 'consented', 'consented', 'member_only', 0, 'e2e_test_prod_tagbulk_seed', datetime('now')),
  ('e2e_test_prod_tagbulk_mem_2', 'consented', 'consented', 'member_only', 0, 'e2e_test_prod_tagbulk_seed', datetime('now'));

INSERT OR REPLACE INTO tag_definitions
  (tag_id, code, label, category, source_stable_keys_json, active)
VALUES
  ('e2e_test_prod_tagbulk_tag_1', 'e2e_test_prod_tagbulk_code_1', 'issue1137 production smoke tag 1', 'e2e_test_prod_tagbulk', '[]', 1),
  ('e2e_test_prod_tagbulk_tag_2', 'e2e_test_prod_tagbulk_code_2', 'issue1137 production smoke tag 2', 'e2e_test_prod_tagbulk', '[]', 1);

COMMIT;
