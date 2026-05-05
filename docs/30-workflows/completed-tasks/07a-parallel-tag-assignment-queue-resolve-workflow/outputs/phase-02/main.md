# Phase 2: 設計 — outputs

state machine 図、tx 境界、handler signature、candidate 投入 hook、audit_log payload を確定した。
詳細は [tag-queue-state-machine.md](./tag-queue-state-machine.md) 参照。

## サマリー

- workflow 本体: `apps/api/src/workflows/tagQueueResolve.ts`
- candidate hook: `apps/api/src/workflows/tagCandidateEnqueue.ts`
- zod schema: `apps/api/src/schemas/tagQueueResolve.ts`
- handler: 既存 `apps/api/src/routes/admin/tags-queue.ts` を本 workflow 呼び出しに差し替え
- migration: `apps/api/migrations/0007_tag_queue_rejected_status.sql`（rejected status と reason の制約追加）

## 完了条件チェック

- [x] state machine 図が valid Mermaid（state-machine.md）
- [x] 書き込み境界に「guarded update 成功後のみ follow-up statement 実行」を明記
- [x] handler signature が TS で記述
- [x] candidate 投入 hook の interface 確定
- [x] audit payload structure 確定
