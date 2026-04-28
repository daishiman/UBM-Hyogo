# Lessons Learned — 03a Parallel Forms Schema Sync (2026-04-29)

出典: `docs/30-workflows/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/outputs/phase-12/system-spec-update-summary.md`

03a-parallel-forms-schema-sync-and-stablekey-alias-queue（POST /admin/sync/schema、cron `0 18 * * *` UTC、D1 4 tables: `schema_versions` / `schema_questions` / `schema_diff_queue` / `sync_jobs`、env `SYNC_ADMIN_TOKEN` / `GOOGLE_FORM_ID` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY`）の Phase 12 実装で得られた苦戦箇所と再発防止策。

---

## L-03a-001: Service Account JWT 有効期限監視運用の欠落

- 症状: `sync_jobs.reason` に JWT expired / signature invalid が出ても、Service Account 鍵 / Google private key の有効期限を周期的に検査する仕組みが未整備で、失敗時に初めて気付く運用になっていた。
- 対応: 9b infrastructure タスクで Cloudflare KV に rotation timestamp を保存し、cron sync 起動時に `now - rotation_at > TTL` 判定を入れる。
- 再発防止: `sync_jobs.failed` を検知する failure alert に「JWT TTL チェック」項目を追加し、9b の rotation 設計とセットでデプロイする。

## L-03a-002: no-op (AC-4: revisionId 同一時) の検証漏れリスク

- 症状: revisionId が前回と同一なら新規バージョン INSERT を行わない契約だが、assert なしで通すと将来のリファクタで黙って二重登録される潜在バグが残る。
- 対応: テストで `schema_versions` への `INSERT` query count = 0 を assertion し、no-op が事実として成立していることを保証する。
- 再発防止: PR review checklist に「no-op 経路を query count または writer spy で assert しているか」を追加する。

## L-03a-003: schema_diff_queue.unresolved の半端な責務境界

- 症状: 03a は diff の登録だけ、解決は 07b に委譲する設計だが、unresolved status が長期残留しても 03a 側にも責任があるように読めてしまう。
- 対応: 04c / 06c / 07b 接合 spec で「03a は登録、07b は解決」の ownership 推移を明確化する仕様文を整備する。
- 再発防止: `schema_diff_queue.unresolved = 'queued'` の不変条件 #14 と一緒に、ownership 表（登録: 03a / 解決: 07b）を quick-reference に常時併記する。

## L-03a-004: AC-7 stableKey 直書き禁止の事前防止策の欠如

- 症状: wave 8b の ESLint rule で stableKey 直書きを静的検出する仕組みが完成する前に開発が進むため、その間に直書きが混入するリスクが残る。
- 対応: `apps/api/src/sync/__tests__/form-schema-sync.test.ts` に literal 検出の security test を追加し、ESLint 完成前でもテストレベルで直書きを検知できるようにする。
- 再発防止: 8b ESLint rule デプロイまで「security test を必須」と PR テンプレートに明記し、rule 完成後はテストを保険に格下げする。

## L-03a-005: Google Forms API quota 枯渇リスク（free tier）

- 症状: Google Forms API の free tier quota は薄く、複数 sync job が並列に走ると枯渇しやすいが、09a 単体テストでは検出されにくい。
- 対応: 9b smoke test で 409 (already running) と rate-limit (429) のレスポンス経路を含めて検証し、quota 枯渇時の挙動を再現する。
- 再発防止: cron + 手動 entry point の同時起動を 409 で防ぐ排他制御を `sync_jobs` の running ロックで明示し、quota observability を 05a / UT-08 monitoring 側に紐付ける。
