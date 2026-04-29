# Phase 1 成果物: 要件定義 — forms-schema-sync-and-stablekey-alias-queue

## 概要

`forms.get` で実フォーム（formId=`119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg`、**31 項目 / 6 セクション**）の live schema を Cloudflare D1 へ同期し、`stableKey` 未割当の question を `schema_diff_queue` に積む。alias 解決は D1 に持ち、`stableKey` のコード直書きは禁止する。本フェーズでは `apps/api` 配下の sync 責務を確定し、03b（response sync） / 04c（admin endpoint） / 07b（alias resolve workflow）への引き渡し境界を定義する。

---

## 1. 上流引き渡し物（既存実装）の確定

| 上流タスク | モジュール / 関数 | 本タスクでの利用 |
| --- | --- | --- |
| 01b（forms client） | `packages/integrations/google/src/forms/client.ts` の `GoogleFormsClient.getForm(formId): Promise<FormSchema>` | forms.get 呼び出し本体 |
| 01b（mapper） | `packages/integrations/google/src/forms/mapper.ts`: `RawForm`, `RawFormItem`, `mapFormSchema` | `revisionId` / `items[]` / `sectionHeaderItem` / `questionItem.question.questionId` の解釈 |
| 01b（auth/backoff） | `auth.ts`（service account JWT）, `backoff.ts`（`RetryableError` + 指数 backoff） | 認証取得・retry 制御 |
| 02b（schema_versions repo） | `apps/api/src/repository/schemaVersions.ts`: `FormManifestRow`（`formId / revisionId / schemaHash / state / syncedAt / sourceUrl / fieldCount / unknownFieldCount`）と CRUD | `revisionId` キー upsert |
| 02b（schema_questions repo） | `apps/api/src/repository/schemaQuestions.ts`: `FormFieldRow`（`questionPk / revisionId / stableKey / questionId / itemId / sectionKey / sectionTitle / label / kind / position / required / visibility / searchable / status / choiceLabelsJson`） | item ごとの upsert（`stableKey` は `COALESCE`）|
| 02b（schema_diff_queue repo） | `apps/api/src/repository/schemaDiffQueue.ts`: `SchemaDiffQueueRow`（`diffId / revisionId / type='added\|changed\|removed' / questionId / stableKey / label / suggestedStableKey / status='queued\|resolved'`） | 未解決 question を `queued` で投入 |
| 02b（sync_jobs repo） | `apps/api/src/repository/syncJobs.ts`: `SyncJobRow` + `ALLOWED_TRANSITIONS`（`running -> succeeded\|failed` 一方向）+ `IllegalStateTransition` | job ledger と排他 |
| 02a（弱依存） | repository 共通 fixture | テスト用のみ |

> 注: `schema_diff_queue.type` は `added / changed / removed / unresolved`。stableKey 未解決 question は `type=unresolved` かつ `status=queued` で表現する。

---

## 2. 入力スキーマの正本（31 項目・6 セクション）

- 正本: `packages/integrations/google/src/forms/mapper.ts`（formId / responderUrl / 31 質問項目 / 6 セクション境界 / `publicConsent` `rulesConsent` 統一 / `responseEmail` は system field）
- live schema 形状: `mapper.ts#RawForm`
  - `revisionId: string`（schema バージョン識別子）
  - `items[]`: `questionItem`（質問）/ `sectionHeaderItem`（セクション境界）/ `pageBreakItem`（無視）
  - `questionItem.question.questionId`（live ID。安定保証なし）+ `title`（label）+ `choiceQuestion.options[]`

---

## 3. scope 確定

### scope in
- `forms.get(formId)` 実行（service account 認証、指数 backoff）
- `schema_versions` の `revisionId` キー upsert（schemaHash = items 並び SHA-256）
- 31 項目の flatten（`sectionHeaderItem` でセクション index 採番）
- alias テーブル + 既知 stableKey マップ（D1 側）経由の `resolveStableKey`
- `schema_questions` upsert（`stableKey` は `COALESCE` で既存値温存）
- 未解決 question を `schema_diff_queue` に `queued` で 1 件 = 1 row 投入
- `sync_jobs` の `running -> succeeded|failed` ledger
- `POST /admin/sync/schema`（admin only）
- Cloudflare Workers cron（1 日 1 回 = 03:00 JST）

### scope out
- `forms.responses.list` と response sync（03b）
- alias の admin UI 操作・resolve 確定（07b）
- `/admin/schema` 画面（06c）
- `POST /admin/sync/responses` の handler（04c → 03b）
- D1 schema migration 自体（01a）
- `members` / `member_responses` / `response_fields` への書き込み

---

## 4. AC（quantitative 化）

| ID | AC | 検証方法（Phase 4 引き継ぎ） |
| --- | --- | --- |
| AC-1 | `forms.get` 結果から **item count = 31** / **section count = 6** が `schema_questions` / `schema_versions.fieldCount` に保存される | `SELECT COUNT(*) FROM schema_questions WHERE revision_id=?` = 31, `SELECT COUNT(DISTINCT section_key)` = 6, `schema_versions.field_count` = 31 |
| AC-2 | 既知 stableKey マッピング外の新規 question は `schema_diff_queue` に **1 件 = 1 row** で `status='queued'` / `stableKey IS NULL` として積まれる | unknown question count == diff queue insert count |
| AC-3 | 07b の alias 確定後、当該 question の `schema_diff_queue.status='resolved'` となり、次回 sync で同一 questionId に対する unresolved row 増加 = 0 | 連続 sync で `WHERE status='queued' AND question_id=?` の delta = 0 |
| AC-4 | 同一 `revisionId` の再実行は **no-op**（`schema_versions` row 数不変） | 連続実行で `COUNT(*) WHERE revision_id=?` 不変 |
| AC-5 | `POST /admin/sync/schema` 実行で `sync_jobs` に `running -> succeeded`（or `failed`）の状態遷移が ledger される | `started_at` 設定 → `finished_at` 設定 / `status` 終端 |
| AC-6 | 同種 job（`job_type='schema_sync'`）が `running` のとき新規実行は **HTTP 409 Conflict** で拒否 | conflicting insert を試行 → repository が reject、route が 409 を返す |
| AC-7 | コードに stableKey 文字列リテラルを直書きしない（**lint rule で検出**） | ESLint custom rule（`no-stable-key-literal`）+ 既存 lint config に追加 |
| AC-8 | cron 1 日 1 回起動で stableKey 既知 31 項目に欠落がない | `SELECT COUNT(*) FROM schema_questions WHERE stable_key IS NOT NULL AND revision_id=latest` = 31（alias resolve 完了後）|

---

## 5. 真の論点（true issue）

1. **冪等性**: 同一 `revisionId` の再実行で `schema_versions` row が二重化しないこと。→ `ON CONFLICT(revision_id) DO UPDATE` で `synced_at` のみ更新。
2. **未割当退避先**: `stableKey` 未解決 question は `schema_diff_queue`（`status='queued'`、`stableKey IS NULL`）に退避し、コード側で例外化しない。
3. **alias は D1**: `stableKey` を JSON manifest でコードに同梱せず D1 alias テーブルに置く。コード再デプロイなしで運用に追従する（不変条件 #1）。
4. **排他**: `sync_jobs` に同種 `running` row があれば 409。03b（response_sync）とは job_type で衝突せず並列可。

---

## 6. 依存境界

| 境界 | 含む | 含まない |
| --- | --- | --- |
| Forms API | `forms.get(formId)` | `forms.responses.list`（03b） |
| D1 書き込み | `schema_versions` / `schema_questions` / `schema_diff_queue` / `sync_jobs` | `member_responses` / `response_fields` / `members`（03b / 02a） |
| 公開 endpoint | `POST /admin/sync/schema` | `POST /admin/sync/responses`（03b）, `GET /admin/schema/diff`（04c） |
| 認可 | admin only | 公開 / 会員 |
| 起動 | Workers cron 1 日 1 回 + admin 手動 | Forms watch / push 通知 |

---

## 7. 価値とコスト

| 観点 | 内容 |
| --- | --- |
| 初回価値 | form 改修に対するアプリ追従コストを **0 デプロイ化**（alias で吸収）/ 31 項目 hardcode 撲滅 |
| 払わないコスト | stableKey 直書き / retry 暴走 / cron 高頻度 / 二重起動 / responseId 汚染 |
| 残余リスク | Forms API quota（→ 1 日 1 回上限化）/ サービスアカウント鍵漏洩（→ Cloudflare Secrets）/ schema_versions 二重 row（→ revisionId UNIQUE）|

---

## 8. 4 条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | stableKey 直書き排除でアプリ改修コストを下げるか | **PASS** | alias D1 解決 = コード再デプロイ不要 |
| 実現性 | 無料枠 + サービスアカウント認証で成立するか | **PASS** | `forms.get` 1 日 1 回、D1 write < 100 行/日、Workers cron 無料枠内 |
| 整合性 | 03b / 07b / 04c と責務境界が衝突しないか | **PASS** | sync_jobs は job_type 区別、endpoint も分離、alias resolve は 07b 専属 |
| 運用性 | 失敗時に手動 + cron で復旧可能か | **PASS** | `POST /admin/sync/schema` で即時再実行、cron が翌日 retry |

---

## 9. 不変条件への適合

| # | 不変条件 | 適合方針 |
| --- | --- | --- |
| #1 | 実フォーム schema をコードに固定しすぎない | `stableKey` をコード直書きせず alias テーブル経由解決。lint rule（AC-7）で gate |
| #5 | `apps/web` から D1 直接アクセス禁止 | sync module は `apps/api/src/sync/schema/` 配下のみ。endpoint は `apps/api` 経由 |
| #6 | GAS prototype を本番仕様に昇格させない | sync は Forms API + Workers のみ。GAS 由来コードは持ち込まない |
| #7 | responseId と memberId の混同禁止 | 本タスクは schema 同期に閉じ、`responseId` / `memberId` に触れない |
| #10 | Cloudflare 無料枠内 | cron 1 日 1 回 + admin 手動上限。retry は backoff で指数抑制 |
| #14 | schema 変更は `/admin/schema` に集約 | 検出した diff を `schema_diff_queue` に集約。本タスクはその起点 |

---

## 10. サブタスク完了状態

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 上流 AC 引き渡し物の表化 | completed |
| 2 | scope in/out 確定 | completed |
| 3 | AC quantitative 化 | completed |
| 4 | 4 条件評価 | completed（全 PASS）|
| 5 | 真の論点 / 依存境界 / 価値とコスト | completed |

---

## 11. Phase 2 への引き継ぎ

- **採用 scope**: 上記 §3 を確定。
- **AC 集合**: AC-1〜AC-8（§4）。Phase 2 設計は全 AC をカバーする module 配置・SQL を提示すること。
- **依存固定**: 既存 `packages/integrations/google/src/forms/*` と `apps/api/src/repository/{schemaVersions,schemaQuestions,schemaDiffQueue,syncJobs}.ts` を **新規実装せず呼び出す**前提。
- **open question**:
  1. `schema_diff_queue.type` の `added / changed / removed` 区分と「unresolved（`stableKey IS NULL`）」の関係を Phase 2 で図示する。
  2. cron 起動時の lock 取得（`sync_jobs INSERT` の UNIQUE 競合 vs SELECT-then-INSERT）を Phase 2 で SQL 化する。
  3. `schemaHash` 計算は既存 `client.ts#defaultSchemaHash` を流用するか、SHA-256 へ差し替えるかを Phase 3 alternative で決定する。
- **次フェーズ blocker なし**（4 条件全 PASS）。
