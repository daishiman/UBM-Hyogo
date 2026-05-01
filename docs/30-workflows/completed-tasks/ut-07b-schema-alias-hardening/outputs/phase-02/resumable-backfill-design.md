# Resumable Back-Fill Design

Status: spec_created

Alias confirmation and back-fill continuation are separate stages.

| Stage | Responsibility | State |
| --- | --- | --- |
| Stage 1 | confirm alias, update `schema_questions`, write audit log | immediate transaction |
| Stage 2 | back-fill `response_fields` in bounded batches | cursor/status persisted in queue state |

Idempotent rule: every retry processes only rows beyond the persisted cursor or rows still carrying the `__extra__:<questionId>` key. Already rewritten rows are not updated again.
