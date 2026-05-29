-- H2 identity rebuild: restore member_identities from response rows.
-- Existing tag_assignment_queue rows carry the only current schema-level
-- member_id <-> response_id bridge. Rows without that bridge are left for
-- session-resolve auto-link, which can create a new identity from verified email.

WITH normalized AS (
  SELECT
    mr.response_id,
    lower(trim(mr.response_email)) AS response_email,
    mr.submitted_at,
    taq.member_id
  FROM member_responses mr
  JOIN tag_assignment_queue taq ON taq.response_id = mr.response_id
  WHERE mr.response_email IS NOT NULL
    AND trim(mr.response_email) <> ''
),
grouped AS (
  SELECT
    MIN(member_id) AS member_id,
    response_email,
    (
      SELECT n2.response_id
      FROM normalized n2
      WHERE n2.response_email = normalized.response_email
      ORDER BY n2.submitted_at DESC, n2.response_id DESC
      LIMIT 1
    ) AS current_response_id,
    (
      SELECT n3.response_id
      FROM normalized n3
      WHERE n3.response_email = normalized.response_email
      ORDER BY n3.submitted_at ASC, n3.response_id ASC
      LIMIT 1
    ) AS first_response_id,
    MAX(submitted_at) AS last_submitted_at
  FROM normalized
  GROUP BY response_email
)
INSERT OR IGNORE INTO member_identities (
  member_id,
  response_email,
  current_response_id,
  first_response_id,
  last_submitted_at,
  created_at,
  updated_at
)
SELECT
  grouped.member_id,
  grouped.response_email,
  grouped.current_response_id,
  grouped.first_response_id,
  grouped.last_submitted_at,
  datetime('now'),
  datetime('now')
FROM grouped
WHERE NOT EXISTS (
  SELECT 1 FROM member_identities mi WHERE mi.member_id = grouped.member_id
)
  AND NOT EXISTS (
    SELECT 1
    FROM member_identities mi
    WHERE lower(trim(mi.response_email)) = grouped.response_email
  );
