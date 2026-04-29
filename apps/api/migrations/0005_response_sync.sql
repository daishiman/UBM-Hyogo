-- 0005_response_sync.sql
-- 03b: forms-response-sync-and-current-response-resolver
-- 不変条件: #2 consent / #3 responseEmail = system field / #14 schema 集約
--
-- 1. schema_diff_queue.question_id の status='queued' 限定 partial UNIQUE INDEX
--    （AC-2: 同一 question_id の重複 enqueue を no-op 化）
-- 2. member_identities.response_email は 0001_init.sql で UNIQUE 済み（再宣言なし）

CREATE UNIQUE INDEX IF NOT EXISTS idx_schema_diff_queue_question_open
  ON schema_diff_queue(question_id)
  WHERE question_id IS NOT NULL AND status = 'queued';

-- response_fields に raw_value_json が無い既存 schema を補強する場合のための no-op INDEX
-- （PRIMARY KEY (response_id, stable_key) は 0001 で定義済み）
CREATE INDEX IF NOT EXISTS idx_response_fields_response
  ON response_fields(response_id);
