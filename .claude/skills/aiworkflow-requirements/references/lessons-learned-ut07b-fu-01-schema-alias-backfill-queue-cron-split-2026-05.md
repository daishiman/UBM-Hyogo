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

## L-UT07B-FU01-007: 50k fixture の deterministic identity は prefix-based dedupe_key に固定する

50,000 行スケールの fixture では cleanup と trial isolation の決定論性が品質ゲートそのものになる。hash-only `dedupe_key` は人間可読な prefix が無いため、`WHERE dedupe_key LIKE` 系の selector で trial 範囲を一意に絞れず、cleanup 漏れと他 trial 干渉のリスクを残す。本ワークフローでは `ubm-test-fixture-50k-${index.toString().padStart(7,'0')}-${sha256(String(index)).slice(0,12)}` の prefix 統一を contract として固定し、`WHERE dedupe_key LIKE 'ubm-test-fixture-50k-%'` を seed/cleanup/count の唯一の selector として運用する。prefix を採用することで、deterministic な存在/非存在判定と、他 fixture との衝突回避を同時に満たせる。

## L-UT07B-FU01-008: production bulk INSERT/DELETE 禁止は script と API の二重 fail-closed で実装する

production D1 への bulk INSERT/DELETE 永久禁止は、運用 script 側だけで担保すると `wrangler` 直叩きや API 直接 POST で容易に bypass できてしまう。本ワークフローでは `seed-staging-50k.sh` / `cleanup-staging-50k.sh` 側で `--env staging --remote` のみ許容し、production 引数を検出した時点で fail-closed で abort する。同時に `POST /admin/schema/backfill/trigger` 側でも production 環境（`ENVIRONMENT === 'production'`）を検出した時点で 403 を返す。片側だけでは bypass 経路が残るため、script 側 guard と API 側 guard の二重 fail-closed を契約として固定する。

## L-UT07B-FU01-009: stress trial trigger は `cf.sh api-post` ではなく ADMIN_SESSION_JWT + 直接 curl を正本とする

`bash scripts/cf.sh api-post` は admin 認証 (`Authorization: Bearer ${ADMIN_SESSION_JWT}`) を介さずに API を叩く形になり、`/admin/schema/backfill/trigger` のような admin-protected endpoint は 401/403 で確実に失敗する。stress trial driver (`scripts/schema-alias-backfill/run-stress-trial.sh`) は `ADMIN_API_BASE_URL` と `ADMIN_SESSION_JWT` を必須環境変数として要求し、`curl --silent --show-error --fail-with-body` で `/admin/schema/backfill/trigger` を直接呼ぶ form を正本とする。runbook の例示 (`references/schema-alias-backfill-runbook.md`) も実装と一致する形に揃え、`cf.sh api-post` の言及は historical note としても残さない。

## L-UT07B-FU01-010: parent workflow 参照は spec creation 時に `test -f` で実体検証する

`indexes/resource-map.md` や `task-workflow-active.md` に parent workflow が登録されているからといって、参照先ディレクトリ／ファイルが filesystem 上に存在するとは限らない（rename / move / completed-tasks への relocation などで drift する）。本ワークフローでは Phase 12 close-out 時に path drift を検出した経験から、spec creation 時の dependency integrity check として「index 参照」と「`test -f`/`test -d` での filesystem 実体確認」の両方を必ず実施する規律を採用する。index 参照と実体検証の片側だけだと、index drift と filesystem drift のいずれかを必ず見落とす。
