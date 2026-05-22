DELETE FROM schema_aliases
WHERE id LIKE 'seed-serial05-step03-%'
   OR alias_question_id LIKE 'serial05_step03_%';

DELETE FROM schema_diff_queue
WHERE diff_id LIKE 'seed-serial05-step03-%';

DELETE FROM schema_questions
WHERE question_pk LIKE 'seed-serial05-step03-%';

DELETE FROM schema_versions
WHERE revision_id = 'seed_serial05_step03_rev';
