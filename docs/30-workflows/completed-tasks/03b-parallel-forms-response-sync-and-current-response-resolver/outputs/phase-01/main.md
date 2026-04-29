# Phase 1 成果物: 要件定義（03b: forms-response-sync-and-current-response-resolver）

## 1. サマリ

`forms.responses.list` を経由した response 同期と、`current_response_id` 解決に責務を限定する。同期成果は `member_responses` / `response_sections` / `response_fields` / `member_identities` / `member_status`（consent snapshot のみ）/ `schema_diff_queue` / `sync_jobs` への書き込みであり、03a（schema sync）・04*（API 露出）・07*（tag / attendance）と境界を切る。`responseEmail` は system field、`publicConsent` / `rulesConsent` は唯一の consent キー名として扱う。

## 2. 上流引き渡し物（依存契約）

| 引き渡し元 | symbol | 戻り型 / 引数 | 本タスクでの用途 |
| --- | --- | --- | --- |
| 02a | `memberResponsesRepository.upsertByResponseId(input)` | `responseId` ベース upsert | 同 responseId の再取得時のみ本文を更新（不変条件 #4） |
| 02a | `responseSectionsRepository.upsertMany(responseId, sections[])` | section meta 保存 | section 単位の集計を 04a 用に保持 |
| 02a | `responseFieldsRepository.upsertKnown(responseId, stableKey, value)` | known field upsert | stableKey 解決済みのみ |
| 02a | `responseFieldsRepository.upsertExtra(responseId, rawQuestionId, value)` | unknown field upsert | `extra field row (`response_fields.stable_key=__extra__:<questionId>`)` に格納 |
| 02a | `memberIdentitiesRepository.upsertByResponseEmail({...})` | identity upsert | `current_response_id` / `last_submitted_at` を最新化 |
| 02a | `memberStatusRepository.applyConsentSnapshot(memberId, { publicConsent, rulesConsent })` | consent のみ更新 | `publish_state` / `is_deleted` は touch しない |
| 02b | `schemaQuestionsRepository.findStableKeyByQuestionId(questionId)` | stableKey or null | normalize 時に key 解決 |
| 02b | `schemaDiffQueueRepository.enqueueIfAbsent(questionId, diffKind)` | unknown を queue へ投入 | `ON CONFLICT(question_id) WHERE status='queued' DO NOTHING` |
| 01b | `googleFormsClient.listResponses(formId, { pageToken? })` | `{ responses[], nextPageToken? }` | cursor pagination |
| 共通 | `syncJobsRepository.acquireRunningLock('response_sync')` | 排他取得（既存 running があれば失敗） | AC-6（409 Conflict） |
| 共通 | `syncJobsRepository.completeWithCursor(jobId, cursor, status)` | ledger close | cursor 永続化 |

## 3. scope

### 3.1 scope in
- `forms.responses.list`（cursor pagination）実行: cron `*/15` と `POST /admin/sync/responses` 手動 trigger
- `member_responses` upsert（responseId 主キー）— 同 responseId のみ本文上書き許可
- `response_sections` / `response_fields` upsert
- stableKey 解決 → `answersByStableKey` を構築。`rawAnswersByQuestionId` を併記保持
- `responseEmail` を **system field** として `member_responses.response_email` 列に保存（`response_fields` に保存しない）
- `member_identities` upsert（`response_email` 自然キー → `memberId` brand）
- current_response 選定（`submittedAt` desc / `responseId` lexicographic 最大）
- unknown field を `response_fields.extra field row (`response_fields.stable_key=__extra__:<questionId>`)` と `schema_diff_queue` の **両方** に投入（重複 enqueue は no-op）
- `member_status.public_consent` / `rules_consent` の snapshot 反映（`publish_state` / `is_deleted` は触らない）
- `sync_jobs` ledger 書き込み（job_type=`response_sync`、metrics_json に `cursor` を保持）

### 3.2 scope out
- schema sync（03a の責務）
- 個別 member の current_response の admin 手動切替 UI（04c）
- `/me/profile` 等の本文編集 UI（不変条件 #4 で禁止）
- delete request 処理（04b）
- `publish_state` / `is_deleted` の自動操作（admin 操作専有）

## 4. 真の論点（true issue）

| # | 論点 | 結論 |
| --- | --- | --- |
| T-1 | `submittedAt` 同値タイ時の current_response 決定ルール | `responseId` lexicographic で最大採用 |
| T-2 | admin が触った `member_status` を consent snapshot で上書きしてよいか | snapshot は `public_consent` / `rules_consent` 列のみ。`publish_state` / `is_deleted` は不可侵 |
| T-3 | unknown field の二重 write の必要性 | `extra field row (`response_fields.stable_key=__extra__:<questionId>`)` だけでは admin が気付けない → `schema_diff_queue` 併記必須 |
| T-4 | `responseEmail` の正本化 | Forms API 上は metadata 扱いだが、ログイン照合の最重要キーのため `member_responses.response_email` に物理列としても保存（system field） |
| T-5 | full sync 経路 | cron は差分 sync 限定。full sync は `POST /admin/sync/responses?fullSync=true` の明示指定でのみ起動 |

## 5. 依存境界（含む / 含まない）

| 境界 | 含む | 含まない |
| --- | --- | --- |
| Forms API | `forms.responses.list` | `forms.get`（03a） |
| D1 write | `member_responses` / `response_sections` / `response_fields` / `member_identities` / `member_status`（consent 列のみ） / `schema_diff_queue` / `sync_jobs` | `schema_versions` / `schema_questions`（03a）、`tag_assignments`（07a）、`admin_notes`（02c/04c） |
| 公開 endpoint | `POST /admin/sync/responses` | `POST /admin/sync/schema`（03a） |
| 認可 | admin only | 公開 / 会員 |
| cron | `*/15`（response_sync） | `*/30` 等（03a / 07*） |

## 6. 価値とコスト

| 観点 | 内容 |
| --- | --- |
| 初回価値 | Form 再回答 = profile 更新の正規ルートを成立。MVP で UI 編集レス化 |
| 払わないコスト | profile 編集 UI、既存 response の本文 mutate、`ruleConsent` 旧名持ち込み、admin の publish_state 上書き |
| 残余リスク | Forms quota（429）、cron 過剰 write、cursor 失念、responseEmail 重複 |

## 7. 4 条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | Form 再回答を更新ルートに昇格させ UI 編集を不要化できるか | PASS | 03-data-fetching.md の正規ルート、MVP 認証方針（13-mvp-auth.md）と整合 |
| 実現性 | cron `*/15` + 無料枠で 1 日 96 回の write が成立するか | PASS | per sync write 上限 < 200 row（AC-10）、Forms API quota の余地内 |
| 整合性 | 03a / 04* / 07* と責務境界が衝突しないか | PASS | 03a は schema、04* は read、07* は post-hook。本タスクは write-only |
| 運用性 | 失敗時に retry / 排他 / 復旧が可能か | PASS | sync_jobs lock + cursor metrics_json + `fullSync=true` 経路 |

## 8. AC（quantitative 化）

| AC | 内容 | 計測条件 |
| --- | --- | --- |
| AC-1 | 同一 `responseEmail` の再回答について、最も新しい `submittedAt` を持つ response の `responseId` が `member_identities.current_response_id` に格納される。タイ時は `responseId` lexicographic 最大値を採用 | 2 件以上の同 email response が D1 に存在する状態で sync 実行 → `current_response_id = max(submittedAt, responseId)` |
| AC-2 | stableKey 未割当 question を含む response を sync すると、`response_fields.extra field row (`response_fields.stable_key=__extra__:<questionId>`)` に当該 raw answer が、`schema_diff_queue` に同じ `question_id` が **status=queued / diff_kind=unresolved** で 1 件 enqueue される。同 question を再受信しても enqueue は重複しない（`ON CONFLICT(question_id) WHERE status='queued' DO NOTHING`） | 同 question を 2 回受信 → queue 件数 = 1 |
| AC-3 | current response の `publicConsent` / `rulesConsent` の正規化値（`consented` / `declined` / `unknown` のいずれか）が `member_status.public_consent` / `member_status.rules_consent` に上書きされる。`publish_state` / `is_deleted` は変更されない | sync 前後の 2 列以外を SELECT 比較し差分なし |
| AC-4 | `responseEmail` は `member_responses.response_email` 列に保存され、`response_fields` には **保存されない**（`stable_key='responseEmail'` の row が 0 件） | `SELECT count(*) FROM response_fields WHERE stable_key='responseEmail'` = 0 |
| AC-5 | `POST /admin/sync/responses` は `?cursor=<token>` および `?fullSync=true` を受け付ける。`fullSync=true` 指定時は cursor を破棄して full sync、それ以外は前回 cursor から差分 sync | 200 OK + sync_jobs.metrics_json.cursor が更新される |
| AC-6 | `sync_jobs` に `job_type='response_sync' AND status='running'` の row が存在する状態で新規 sync を起動すると **409 Conflict** を返す（DB 書き込みは行われない） | 二重起動 1 回目 200 / 2 回目 409 |
| AC-7 | `responseId` と `memberId` が型レベルで混同されない: `type ResponseId = Brand<string,'ResponseId'>`, `type MemberId = Brand<string,'MemberId'>`。両者を取り違える代入は TypeScript で compile error | `tsc --noEmit` で代入互換が拒否される |
| AC-8 | 旧 `ruleConsent` 文字列が API request / D1 column / TypeScript symbol に登場しない。lint rule（grep ベース）で `ruleConsent` を検出すると CI fail。Forms 入力に `ruleConsent` が含まれた場合は extract-consent で `rulesConsent` に正規化 | grep `ruleConsent` 0 件 |
| AC-9 | `member_identities.is_deleted = true` の identity に対しては consent snapshot 更新を skip する（`UPDATE … WHERE is_deleted = 0` ガード）| 退会済み identity の `member_status` row が sync 前後で完全一致 |
| AC-10 | cron `*/15` 1 回（差分 sync）の D1 write 行数が 200 行未満。full sync は手動のみ。1 日（96 回 cron）累積で free tier write quota（5M / 月）を超過しない | 計測 SQL: `sync_jobs.metrics_json.write_count` を記録 |

## 9. 多角的チェック観点（不変条件マッピング）

| 不変条件 | 適用箇所 | この Phase での担保 |
| --- | --- | --- |
| #1 schema 固定禁止 | normalize-answer | stableKey は schema_questions の DB 引きで解決、コードに literal map を持たない |
| #2 consent キー統一 | extract-consent | `ruleConsent` 旧名は入力時点で `rulesConsent` に正規化、内部に持ち込まない |
| #3 responseEmail = system field | resolve-identity / member_responses | `member_responses.response_email` 列に保存、`response_fields` 非保存 |
| #4 profile 本文編集禁止 | member_responses upsert | 同期は新 responseId の追加のみ。同 responseId の再取得時に限り本文を上書き |
| #5 apps/web → D1 直接禁止 | apps/api/src/sync/responses/ | sync は apps/api に閉じる |
| #6 GAS prototype 非昇格 | implementation | Forms API + Workers のみ |
| #7 ResponseId/MemberId 混同禁止 | Brand 型 | AC-7 |
| #10 無料枠 | cursor + cron */15 | AC-10 で per-sync write 上限を 200 行未満に固定 |
| #14 schema 集約 | unknown → schema_diff_queue | AC-2 |

## 10. AC トレーサビリティ

| AC | 関係する不変条件 | 関係する真の論点 | 主要 module（Phase 2 にて確定） |
| --- | --- | --- | --- |
| AC-1 | #7 | T-1 | pick-current-response |
| AC-2 | #1, #14 | T-3 | normalize-answer + schema_diff_queue |
| AC-3 | #2 | T-2 | snapshot-consent |
| AC-4 | #3 | T-4 | resolve-identity / member_responses upsert |
| AC-5 | #10 | T-5 | forms-response-sync + cursor-store |
| AC-6 | — | — | _shared/ledger |
| AC-7 | #7 | — | brand types |
| AC-8 | #2 | — | extract-consent |
| AC-9 | #2, #4 | T-2 | snapshot-consent |
| AC-10 | #10 | T-5 | cron entry / cursor-store |

## 11. サブタスク完了状態

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 上流引き渡し物表化 | completed |
| 2 | scope in/out 確定 | completed |
| 3 | AC quantitative 化 | completed |
| 4 | 4 条件評価 | completed |
| 5 | 真の論点 / 依存境界 / 価値とコスト | completed |

## 12. 次 Phase 引き継ぎ

- Phase 2 入力: 本 main.md の §2（上流契約）/ §3（scope）/ §8（AC）/ §10（トレーサビリティ）
- Phase 2 で確定すべき事項: module 配置 / Mermaid / SQL 擬似 / dependency matrix
- ブロックなし
