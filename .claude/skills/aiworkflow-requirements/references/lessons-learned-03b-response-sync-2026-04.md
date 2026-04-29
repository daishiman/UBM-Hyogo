# lessons-learned: 03b Forms response sync 苦戦箇所（2026-04-29）

> 対象タスク: `docs/30-workflows/03b-parallel-forms-response-sync-and-current-response-resolver/`
> Wave: 3 / parallel / implementation_non_visual
> 関連 references: `api-endpoints.md`（§管理同期 API）, `database-schema.md`（§UBM 会員 Forms 同期テーブル 03b）, `deployment-cloudflare.md`（§API Worker cron / Forms response sync 03b）, `environment-variables.md`（§Cloudflare Workers / Google Forms 同期）

将来同様のタスクを簡潔に解決するための知見をまとめる。

## L-03B-001: `sync_jobs.metrics_json.cursor` は Google API の `pageToken` ではない

**苦戦箇所**: 当初 `forms.responses.list` の `pageToken` を `sync_jobs.metrics_json` に保存して再開しようとしたが、`pageToken` は単一実行内のページングトークンで、cron 跨ぎでは無効になる。

**解決方針**: cursor は処理済み response の **high-water mark（`submittedAt|responseId`）** として扱い、次回 cron では `forms.responses.list` の timestamp filter（`responseDate`）に渡す。`pageToken` は実行内ループでだけ使う。

**適用先**: 同種の外部 API → D1 同期では「外部の continuation token」と「自分が記録する high-water mark」を分けて設計する。

## L-03B-002: 同 `submittedAt` 時の current_response 切替は `responseId` 降順で tie-break

**苦戦箇所**: 同一メールで同 `submittedAt` の応答が複数届いた際、current_response の選択が unstable になり Phase 7 の AC-1 テストが flaky になった。

**解決方針**: `decideShouldUpdate(prev, next)` で `submittedAt` 同値時は `responseId` 降順で決定的に比較する。Google Forms の responseId は時系列を厳密には保証しないが、同 `submittedAt` 内では十分な tie-break になる。

**適用先**: 「最新を選ぶ」タイプのドメイン更新では、必ず deterministic な tie-break key を入れる。

## L-03B-003: unknown field の重複 enqueue は partial UNIQUE で no-op 化

**苦戦箇所**: 同じ `question_id` の unknown field が cron 毎に重複 enqueue され、`schema_diff_queue` が膨張した。`INSERT OR IGNORE` だけでは `status` の異なる行と衝突する。

**解決方針**: D1 migration で `schema_diff_queue (question_id) WHERE status='queued'` の **partial UNIQUE index** を張る。これで `queued` 状態で同 `question_id` が複数行存在することを物理的に禁止し、`INSERT OR IGNORE` が正しく no-op になる。

**適用先**: queue / outbox 系テーブルでの「未処理重複の防止」は partial UNIQUE が最も簡潔。

## L-03B-004: cron 無料枠は per-sync write 上限で守る

**苦戦箇所**: 初回 full sync で `member_responses` / `response_fields` への大量 write が走り、D1 free tier の 1 日 100k write を 1 cron で消費しかける動きをした。

**解決方針**: `runResponseSync` に **per-sync write cap = 200 行** を入れ、超過したら次回 cron に持ち越す。`metrics_json.cursor` で再開できるので部分実行で安全。`cron */15 * * * *` × 200 cap で 1 日上限を予測可能にする。

**適用先**: Workers cron で D1 / KV / R2 を扱う際は、必ず per-execution の上限値を runbook と guide に明記する。

## L-03B-005: `responseEmail` は system field、`response_fields` には保存しない

**苦戦箇所**: Google Form の `responseEmail` を他の form 項目と同列に `response_fields` に書こうとしたが、不変条件 #3（`responseEmail` は system field として扱う）に違反した。

**解決方針**: `SYSTEM_STABLE_KEYS` 定数に `responseEmail` を含め、normalize 時にスキップして `member_responses.response_email` 列に直接保存する。`member_identities.response_email` は identity 主キーとして UNIQUE 制約を持つ。

**適用先**: form 由来データのうち identity / system 列に昇格すべきものは、normalize レイヤーで明示的に分離する。

## L-03B-006: 二重起動防止は同種 job_type の `running` 行検査で 409 を返す

**苦戦箇所**: cron と手動 `POST /admin/sync/responses` が同時起動して `member_identities.current_response_id` の更新順序が壊れた。

**解決方針**: `sync_jobs` から `job_type='response_sync' AND status='running'` の行を検査し、存在すれば 409 Conflict で即時 reject。lock TTL 超過時の手動解除手順は unassigned-task `03b-response-sync-followups.md` に follow-up として登録した。

**適用先**: Workers の cron + 手動エンドポイントの併用では、必ず ledger ベースの相互排他を最初に設計する。

## L-03B-007: 旧 `ruleConsent` 表記の混入は入口で `rulesConsent` へ正規化

**苦戦箇所**: GAS prototype 由来の `ruleConsent`（s なし）が Google Forms タイトルや旧 fixture に残存していて、API / DB に流入する経路があった。

**解決方針**: `extractConsent` の入口で `ruleConsent → rulesConsent` の alias 解決を行う。lint rule 化は follow-up（`task-skill-improvement-anchor-establishment-001` 等で扱う）。

**適用先**: 不変条件として「キー名統一」を持つドメインでは、必ず入口の normalize レイヤーで alias を吸収する。
