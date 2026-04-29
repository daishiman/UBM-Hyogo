# Phase 3 成果物: 設計レビュー（03b: forms-response-sync-and-current-response-resolver）

## 1. サマリ

Phase 2 の設計に対し、cursor 永続化先と cron 戦略の組み合わせで 4 つの alternative を比較した。採用は **案 A: cursor=`sync_jobs.metrics_json` / cron `*/15` / consent snapshot は public/rules 列のみ**。総合判定は **PASS**（自己整合・不変条件・上下流境界・無料枠すべて適合）。リスクは 8 件登録し、Phase 4（テスト戦略）/ Phase 6（異常系）に引き渡す。

## 2. alternative 列挙

### 2.1 案 A（採用）: cursor を `sync_jobs.metrics_json` に保存、cron `*/15` 差分 sync、consent snapshot は `public_consent` / `rules_consent` 限定
- 既存 `sync_jobs` テーブルを再利用、新規インフラなし
- ledger と cursor を 1 表で原子的に管理
- 03a と `_shared/ledger.ts` を共有可能

### 2.2 案 B: cursor を専用テーブル `sync_cursors` に分離
- (job_type, cursor, updated_at) の独立 1 行で管理
- ledger と cursor が物理分離するため、JOIN/2 段書き込みが必要

### 2.3 案 C: cursor 不使用、cron `*/5` で毎回全件 list（full sync）
- nextPageToken 管理不要で実装最小
- cron 頻度 3 倍 + 全件 list で D1 write が線形に増加

### 2.4 案 D: cursor を Workers KV に保存
- KV の eventual consistency（最大 60s）に依存
- KV binding 追加が必要、race condition リスク

## 3. 比較表

| 観点 | A: sync_jobs.metrics_json, cron */15（採用） | B: sync_cursors テーブル | C: cursor 不使用 cron */5 全件 | D: KV cursor |
| --- | --- | --- | --- | --- |
| インフラ追加 | なし | テーブル 1 件 + migration | なし | KV namespace + binding |
| 無料枠（不変条件 #10） | 適合（per sync < 200 row × 96/日） | 適合 | **危険**（毎回 full sync で write 量が会員数 × 288 倍/日）| 適合 |
| consent キー（#2） | 適合 | 適合 | 適合 | 適合 |
| 排他性（AC-6） | sync_jobs lock で 1 表内原子化 | sync_jobs lock + cursor 表で 2 段、原子性に注意 | sync_jobs lock | KV race（read-modify-write 非原子） |
| 復旧性 | `SELECT metrics_json FROM sync_jobs WHERE job_type='response_sync' ORDER BY started_at DESC LIMIT 1` で確認可 | テーブル参照 | cursor がないため部分失敗から復旧不能（再度 full） | KV inspect が必要 |
| 03a との共通化 | `_shared/ledger.ts` に集約しやすい | 03a も別テーブル参照を強いる | 共通化対象なし | KV を 03a も使うとさらに binding 増 |
| 実装コスト | 低 | 中（migration + repo） | 低 | 高（KV binding + 失敗系設計） |
| 履歴性 | sync_jobs に試行履歴が残る | cursor は最新のみ（履歴別途） | 履歴なし | 履歴なし |
| 採用否 | **採用** | 不採用（重複・複雑化） | 不採用（無料枠 / 復旧不能） | 不採用（KV 増 / race） |

## 4. PASS-MINOR-MAJOR 判定

| 項目 | 判定 | 根拠 |
| --- | --- | --- |
| 設計の自己整合 | PASS | module 配置 / Mermaid / SQL が AC-1〜AC-10 を漏れなくカバー |
| 不変条件適合 | PASS | #1, #2, #3, #4, #5, #6, #7, #10, #14 すべて Phase 2 §9 でマッピング済み |
| 上下流境界 | PASS | 03a / 04* / 07* との責務境界を Phase 2 §6 で明文化、衝突なし |
| 無料枠（#10） | PASS | per-sync writeCap 200 行 + cursor 持ち越し + 03a と同 cron 競合なし |
| 総合 | **PASS** | MAJOR / MINOR 指摘なし。下記リスク R-1〜R-8 を Phase 4 / 6 へ |

## 5. リスク登録

| ID | リスク | 重大度 | 関連 AC / 不変条件 | 緩和策 | 引き継ぎ Phase |
| --- | --- | --- | --- | --- | --- |
| R-1 | cursor lost（`sync_jobs.metrics_json` 破損 / JSON 不正）| 中 | AC-5 / AC-10 | `POST /admin/sync/responses?fullSync=true` で手動 full sync。metrics_json schema を Zod で validate し、parse 失敗時は cursor=null にフォールバック | Phase 6 |
| R-2 | Forms API 429（quota / rate limit）| 中 | AC-10 | exponential backoff（1s/2s/4s 最大 3 回）+ 次 cron 再試行。sync_jobs.status='failed' を立てて alert | Phase 6 |
| R-3 | `responseEmail` 重複（複数 identity が同 email を持つ）| 高 | AC-1 / 不変条件 #3 | `member_identities.response_email` に UNIQUE 制約。INSERT 違反検出時は admin alert に積み、当該 response の identity 解決を skip（other 列の sync は継続） | Phase 6 |
| R-4 | unknown field の diff queue 投入忘れ | 中 | AC-2 / 不変条件 #14 | unit test で `normalize → unknownQuestionIds` と `enqueue 呼び出し回数` を 1:1 assert。integration test で queue 件数を実測 | Phase 4 |
| R-5 | 二重起動（cron + 手動 / 連続 cron）| 中 | AC-6 | sync_jobs lock を `WHERE NOT EXISTS` で原子化。changes()=0 のとき 409 | Phase 4 / 6 |
| R-6 | **consent snapshot で admin が触った `publish_state` / `is_deleted` を上書きする事故** | 高 | AC-3 / AC-9 / 不変条件 #2, #4 | `UPDATE member_status` の SET 句を `public_consent` / `rules_consent` の **2 列に物理限定**（コードレビュー + lint で SET 句を grep）。さらに `WHERE EXISTS … is_deleted=0` ガードで退会済みは skip。E2E で admin による `publish_state` 設定が sync 後も保持されることを verify | Phase 4 / 6 |
| R-7 | `submittedAt` 同値タイ時の current_response 不安定 | 低 | AC-1 | `responseId` lexicographic 最大採用ルールを SQL `CASE` で決定的に書く。同タイ test を unit に追加 | Phase 4 |
| R-8 | `ruleConsent` 旧名混入（外部入力 / 古い code 流入）| 中 | AC-8 / 不変条件 #2 | `extract-consent` で alias 正規化（入力時点で `rulesConsent` に書き換え）+ CI に `grep -rn 'ruleConsent\b'` の lint rule を追加（hit すれば fail） | Phase 4 / 9 |

## 6. consent snapshot リスクの詳細整理（R-6）

| 観点 | 内容 |
| --- | --- |
| 想定事故 | admin が `member_status.publish_state='hidden'` を設定済みの会員に対し、sync が `publish_state='visible'` で上書きしてしまう |
| 防止策 1（コード）| `snapshot-consent.ts` の `UPDATE` 文の SET 句を `public_consent`, `rules_consent` の 2 列に物理限定する。`apps/api/src/repository/status.ts` 側でも `applyConsentSnapshot` の引数を `{ publicConsent, rulesConsent }` の 2 フィールドに型限定 |
| 防止策 2（DB）| `is_deleted=true` の identity は `WHERE EXISTS … is_deleted=0` ガードで snapshot skip（AC-9） |
| 防止策 3（テスト）| Phase 4 に「admin 操作後の publish_state 不変」E2E を追加 |
| 防止策 4（lint）| `apps/api/src/sync/responses/snapshot-consent.ts` 内に `publish_state` / `is_deleted` 文字列が登場しないことを CI で grep |

## 7. 採用案の詳細仕様（A 案 final）

| 項目 | 値 |
| --- | --- |
| cursor 保存先 | `sync_jobs.metrics_json.cursor`（JSON） |
| cron | `*/15 * * * *`（差分 sync） |
| full sync 経路 | `POST /admin/sync/responses?fullSync=true`（admin only） |
| 排他 | `sync_jobs` の `WHERE NOT EXISTS … job_type='response_sync' AND status='running'` |
| consent snapshot 範囲 | `member_status.public_consent` / `rules_consent` の 2 列のみ |
| writeCap | 1 回の sync で 200 行を超える場合、cursor を保存して次 cron に持ち越す |
| 03a との共通点 | `_shared/ledger.ts`（lock / cursor 永続化 / status 遷移）を共有 |

## 8. AC トレーサビリティ（Phase 3 視点）

| AC | 採用案 A の対応 | リスク |
| --- | --- | --- |
| AC-1 | submittedAt + responseId lex max（SQL CASE）| R-7 |
| AC-2 | `extra field row (`response_fields.stable_key=__extra__:<questionId>`)` + `schema_diff_queue` 二重 write、`ON CONFLICT WHERE status='queued'` で重複排除 | R-4 |
| AC-3 | `member_status` SET 句を 2 列に限定 | R-6 |
| AC-4 | `member_responses.response_email` 列保存、`response_fields` から除外 | R-3 |
| AC-5 | `?cursor=` / `?fullSync=true` 両対応 | R-1 |
| AC-6 | sync_jobs lock（`WHERE NOT EXISTS`） | R-5 |
| AC-7 | brand 型（`ResponseId` / `MemberId`） | — |
| AC-8 | `extract-consent` alias + CI grep | R-8 |
| AC-9 | `is_deleted=0` ガード | R-6 |
| AC-10 | writeCap 200 行 + cursor 持ち越し | R-2 |

## 9. サブタスク完了状態

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | alternative 列挙（A/B/C/D）| completed |
| 2 | 比較表（採用否 + 理由）| completed |
| 3 | PASS 判定 + 理由 | completed |
| 4 | リスク登録（8 件 / 6 件以上）| completed |

## 10. 次 Phase 引き継ぎ

- Phase 4（テスト戦略）入力: 採用案 A の §7 詳細仕様 + リスク R-1〜R-8
- Phase 4 で必須カバーするテスト:
  - AC-1: submittedAt 同値タイの decisive 動作（R-7）
  - AC-2: unknown 投入の 1:1 一致（R-4）
  - AC-3 / AC-9: admin の publish_state 不変 E2E（R-6）
  - AC-6: 二重起動 409（R-5）
  - AC-8: ruleConsent 旧名混入の CI grep（R-8）
- Phase 6（異常系）入力: R-1（cursor 破損）/ R-2（429）/ R-3（email UNIQUE 違反）
- ブロック: なし
