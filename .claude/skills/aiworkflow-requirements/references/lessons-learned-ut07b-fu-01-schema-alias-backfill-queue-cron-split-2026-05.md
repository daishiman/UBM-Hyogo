# Lessons Learned: UT-07B-FU-01 Schema Alias Back-fill Queue/Cron Split

> Workflow root: `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/`
> Artifact inventory: `references/workflow-ut-07b-fu-01-schema-alias-backfill-queue-cron-split-artifact-inventory.md`
> Issue: #361 CLOSED (PR text uses `Refs #361` only)

## L-UT07B-FU01-001: Queue dedupe と DB unique 制約の責務分離

`schema_diff_queue` 行に対する重複防止は二層で扱う。Queue producer (`apps/api/src/workflows/schemaAliasEnqueue.ts`) は `dedupe_key` を生成して `producer.send` 前に予約することで、Cloudflare Queue 側の at-least-once 配送を吸収する。一方、DB 側の unique 制約 (`0014_schema_diff_queue_dedupe_failure.sql`) は最終整合性のための last-line guard として機能させる。dedupe_key の生成タイミングを producer 側に置く理由は、Queue にメッセージを送出する前に DB レコードと dedupe_key を確定しておかないと、consumer が起動した時点で dedupe 判定の根拠が無くなり、二重実行を吸収できないからである。

## L-UT07B-FU01-002: Cron 分割で軽量 enqueue と重量 batch を別 cron に分けないと CPU budget 切れで Queue 投入自体が失敗する

`apps/api/wrangler.toml` で軽量 enqueue（1 分間隔の発火）と重量 batch continuation（5 分間隔の継続実行）を別 cron として分離する。Cloudflare Workers の CPU time budget は 1 invocation あたりの上限が固定されており、enqueue と batch を同一 cron に同居させると、batch 側の D1 スキャン負荷で CPU budget を消費しきってしまい、後段の `producer.send` 自体が失敗する。enqueue は producer.send のみを担当し、batch は consumer 側で remaining-scan を継続する形に分離することで、各 invocation を独立した CPU budget 内に閉じ込める。

## L-UT07B-FU01-003: Public `backfill.status` と Internal `backfill_status` の値域不一致は API 契約境界で明示変換する

公開 API の `backfill.status` は `pending / running / exhausted / completed` の 4 値域、internal DB `schema_diff_queue.backfill_status` は `failed` を含む別値域を持つ。`apps/api/src/routes/admin/schema.ts` で `failed → exhausted` 等のマッピングを明示的に行い、`internalStatus: 'failed'` は metadata 側に退避することで、後方互換の `code: "backfill_cpu_budget_exhausted"` / `retryable: true` を `exhausted` と並存維持する。値域変換を repository 層に降ろすと、internal failure semantics が API 契約に漏れて contract drift を起こす。

## L-UT07B-FU01-004: remaining-scan vs cursor-pagination の選定理由

D1 のインデックス特性上、cursor-pagination は `(updated_at, id)` 複合 cursor の安全な往復を要し、retry / dedupe との交差で実装複雑度が高い。remaining-scan は「未処理行を都度 LIMIT で取得 → batch 処理 → UPDATE で消化」を繰り返す単純モデルで、idempotent UPDATE と組み合わせることで cursor 状態を持たない。本ワークフローでは batch あたりの行数を CPU budget 以内に収められる前提で remaining-scan を採用する。50,000+ rows fixture で remaining-scan が劣化した場合のみ cursor-pagination 移行を検討する（follow-up `cursor-semantics-migration` で追跡）。

## L-UT07B-FU01-005: idempotent 設計のため Queue 消費側で dedupe_key を再確認する

Cloudflare Queue は at-least-once delivery のため、同一メッセージが複数 consumer に配送される可能性がある。`apps/api/src/workflows/schemaAliasBackfillBatch.ts` 側で dedupe_key を再確認し、既に `last_processed_at` が更新されている場合は no-op で ack することで、二重実行を吸収する。dedupe を producer 側だけに置くと、Queue retry 時の重複が DB 状態を破壊するため、消費側の再確認は省略不可。

## L-UT07B-FU01-006: Phase 11 gate を「local implementation GO / runtime evidence pending」と明示する

staging 10,000+ rows での実測 evidence を取得する前に Phase 11 gate を bare `PASS` 宣言すると、staging 評価未済の状態が誤って production-ready と読み替えられる。本ワークフローでは Phase 11 gate を `local implementation GO / runtime evidence pending` として明示し、`outputs/phase-11/gate-decision.md` を唯一の判定点とする。runtime evidence が user 明示承認で取得されるまで、`PASS` 宣言は保留する。
