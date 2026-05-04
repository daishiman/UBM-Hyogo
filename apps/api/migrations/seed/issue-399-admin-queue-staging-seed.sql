-- issue-399-admin-queue-staging-seed.sql
-- Staging-only synthetic seed for /admin/requests visual evidence capture.
-- All rows use the synthetic prefix `ISSUE399-` so cleanup can target them safely.
-- Tables touched (no ALTER): member_status, admin_member_notes
-- Invariant: never seed real PII; never run outside staging (see scripts/staging/seed-issue-399.sh).

BEGIN TRANSACTION;

-- 5 synthetic members (3 visibility-request, 2 delete-request).
INSERT OR REPLACE INTO member_status
  (member_id, public_consent, rules_consent, publish_state, is_deleted, hidden_reason, updated_by, updated_at)
VALUES
  ('ISSUE399-MEM-V1', 'consented', 'consented', 'member_only', 0, NULL, 'ISSUE399-SEED', datetime('now')),
  ('ISSUE399-MEM-V2', 'consented', 'consented', 'hidden',      0, NULL, 'ISSUE399-SEED', datetime('now')),
  ('ISSUE399-MEM-V3', 'consented', 'consented', 'member_only', 0, NULL, 'ISSUE399-SEED', datetime('now')),
  ('ISSUE399-MEM-D1', 'consented', 'consented', 'public',      0, NULL, 'ISSUE399-SEED', datetime('now')),
  ('ISSUE399-MEM-D2', 'consented', 'consented', 'member_only', 0, NULL, 'ISSUE399-SEED', datetime('now'));

-- Pending visibility_request rows (×3). The first carries a richer reason for the detail panel.
INSERT OR REPLACE INTO admin_member_notes
  (note_id, member_id, body, created_by, updated_by, note_type, request_status)
VALUES
  ('ISSUE399-NOTE-V1', 'ISSUE399-MEM-V1',
    json_object('reason', 'Synthetic visibility request for staging visual evidence (issue-399).',
                'payload', json_object('desiredState', 'public')),
    'ISSUE399-SEED', 'ISSUE399-SEED', 'visibility_request', 'pending'),
  ('ISSUE399-NOTE-V2', 'ISSUE399-MEM-V2',
    json_object('reason', 'Synthetic visibility request #2',
                'payload', json_object('desiredState', 'member_only')),
    'ISSUE399-SEED', 'ISSUE399-SEED', 'visibility_request', 'pending'),
  ('ISSUE399-NOTE-V3', 'ISSUE399-MEM-V3',
    json_object('reason', 'Synthetic visibility request #3',
                'payload', json_object('desiredState', 'hidden')),
    'ISSUE399-SEED', 'ISSUE399-SEED', 'visibility_request', 'pending');

-- Pending delete_request rows (×2).
INSERT OR REPLACE INTO admin_member_notes
  (note_id, member_id, body, created_by, updated_by, note_type, request_status)
VALUES
  ('ISSUE399-NOTE-D1', 'ISSUE399-MEM-D1',
    json_object('reason', 'Synthetic delete request for staging visual evidence (issue-399).',
                'payload', json_object()),
    'ISSUE399-SEED', 'ISSUE399-SEED', 'delete_request', 'pending'),
  ('ISSUE399-NOTE-D2', 'ISSUE399-MEM-D2',
    json_object('reason', 'Synthetic delete request #2',
                'payload', json_object()),
    'ISSUE399-SEED', 'ISSUE399-SEED', 'delete_request', 'pending');

COMMIT;
