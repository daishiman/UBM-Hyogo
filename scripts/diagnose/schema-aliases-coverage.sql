-- Issue #299 coverage check:
-- List schema_questions rows that still have a non-placeholder stable_key
-- but do not have a matching schema_aliases alias row with the same stable_key.
--
-- Expected before fallback retirement: 0 rows in both production and staging.
SELECT
  q.question_id,
  q.stable_key AS schema_questions_stable_key,
  q.revision_id,
  a.stable_key AS schema_aliases_stable_key
FROM schema_questions q
LEFT JOIN schema_aliases a
  ON a.alias_question_id = q.question_id
 AND a.revision_id = q.revision_id
WHERE q.stable_key IS NOT NULL
  AND q.stable_key != 'unknown'
  AND (
    a.alias_question_id IS NULL
    OR a.stable_key != q.stable_key
  );
