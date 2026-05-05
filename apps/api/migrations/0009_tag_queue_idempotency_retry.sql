-- 0009_tag_queue_idempotency_retry.sql
-- ut-02a-tag-assignment-queue-management:
--   tag_assignment_queue を idempotency / retry / DLQ 用途に拡張する。
--   既存 0002_admin_managed.sql で作成済の table に列を追加するのみ（破壊的変更なし）。
--
--   状態遷移は既存 (queued / reviewing / resolved / rejected) に dlq を追加。
--   CHECK 制約は SQLite では既存 table への ALTER で追加できないため、application 層で enforce する。

ALTER TABLE tag_assignment_queue ADD COLUMN idempotency_key TEXT;
ALTER TABLE tag_assignment_queue ADD COLUMN attempt_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tag_assignment_queue ADD COLUMN last_error TEXT;
ALTER TABLE tag_assignment_queue ADD COLUMN next_visible_at TEXT;
ALTER TABLE tag_assignment_queue ADD COLUMN dlq_at TEXT;

-- partial unique index: idempotency_key が NULL でない行のみ重複防止
CREATE UNIQUE INDEX IF NOT EXISTS idx_tag_queue_idempotency
  ON tag_assignment_queue(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- listPending 用: status + next_visible_at で索引
CREATE INDEX IF NOT EXISTS idx_tag_queue_visible
  ON tag_assignment_queue(status, next_visible_at);

-- listDlq 用: dlq 行を高速取得
CREATE INDEX IF NOT EXISTS idx_tag_queue_dlq
  ON tag_assignment_queue(status, dlq_at);
