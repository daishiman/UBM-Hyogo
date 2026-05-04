# データベーススキーマ設計

> 本ドキュメントは統合システム設計仕様書の一部です。
> 管理: .claude/skills/aiworkflow-requirements/

## 概要

Turso統一アーキテクチャにおけるテーブル設計とインデックス戦略。
基盤アーキテクチャについては [database-architecture.md](./database-architecture.md) を参照。

## テーブル一覧

| テーブル | 用途 | 実装状況 |
|----------|------|----------|
| member_responses | Google Forms response 履歴 | ✅ 実装済み |
| member_identities | responseEmail 単位の会員 identity と current response | ✅ 実装済み |
| member_status | consent snapshot / 公開状態 / 退会状態 | ✅ 実装済み |
| response_fields | response ごとの stableKey / extra question 値 | ✅ 実装済み |
| schema_diff_queue | unknown / changed question の管理キュー | ✅ 実装済み |
| schema_aliases | 07b manual alias resolution の正本書き込み先（issue-191） | ✅ production applied（詳細は §Schema aliases write target） |
| sync_jobs | schema / response sync の ledger | ✅ 実装済み |
| workflows | ワークフロー定義 | 設計済み |
| workflow_steps | ワークフローステップ | 設計済み |
| workflow_executions | 実行履歴 | 設計済み |
| user_settings | ユーザー設定 | 設計済み |
| user_profiles | ユーザープロフィール（Supabase） | ✅ 実装済み |
| api_keys | APIキー管理 | 設計済み |
| audit_logs | 監査ログ | 設計済み |
| sync_metadata | 同期メタデータ | 設計済み |
| system_prompt_templates | システムプロンプトテンプレート | ✅ 実装済み |
| chat_sessions | チャットセッション | ✅ 実装済み |
| chat_messages | チャットメッセージ | ✅ 実装済み |
| files | RAGファイルメタデータ | ✅ 実装済み |
| chunks | RAGチャンク + FTS5 | ✅ 実装済み |
| conversions | ファイル変換履歴 | ✅ 実装済み |
| conversion_logs | 変換処理ログ | 設計済み |
| entities | Knowledge Graphノード | ✅ 実装済み |
| relations | Knowledge Graphエッジ | ✅ 実装済み |
| relation_evidence | 関係の証拠チャンク | ✅ 実装済み |
| communities | Leidenクラスター | ✅ 実装済み |
| entity_communities | エンティティ-コミュニティ中間 | ✅ 実装済み |
| chunk_entities | チャンク-エンティティ中間 | ✅ 実装済み |

## UBM 会員 Forms 同期テーブル（03b）

03b response sync は Google Forms `forms.responses.list` の response を D1 に冪等 upsert する。

| テーブル | 03b の責務 |
| --- | --- |
| `member_responses` | `response_id` 単位の履歴。`response_email` は system field として列に保存し、`answers_json` / `raw_answers_json` / `extra_fields_json` も保持する。`response_email` 列に UNIQUE 制約は付与しない（履歴行のため同値重複を許容する。正本 UNIQUE は `member_identities.response_email` 側） |
| `member_identities` | `response_email` ごとの identity。最新 `submitted_at`、同値時は `response_id` 降順で `current_response_id` を更新する。`response_email` は本テーブルにて `NOT NULL UNIQUE`（`apps/api/migrations/0001_init.sql` で宣言）であり、システム全体の **正本 UNIQUE** 所在である |
| `member_status` | current response から `public_consent` / `rules_consent` を snapshot。`is_deleted=1` の identity は更新しない |
| `response_fields` | known は `stable_key` 行、unknown は `stable_key='__extra__:<questionId>'` の extra row として保存する |
| `schema_diff_queue` | unknown question を `status='queued'` で enqueue。`question_id` + queued の partial unique index で重複を no-op にする |
| `sync_jobs` | `job_type='response_sync'` の ledger。`metrics_json.cursor` は `submittedAt|responseId` の high-water mark。`job_type` enum / `metrics_json` schema / lock TTL / cursor 意味論 / PII 拒否 / owner-co-owner 境界の論理正本は `docs/30-workflows/_design/sync-jobs-spec.md`、runtime SSOT は `apps/api/src/jobs/_shared/sync-jobs-schema.ts`（1-hop 参照） |

## Schema aliases write target（issue-191 / UT-07B）

`schema_aliases` は issue-191 以降の manual alias write target である。07b `POST /admin/schema/aliases` は `schema_questions.stable_key` を直接更新せず、この table に alias 行を INSERT する。03a は `schema_aliases` first、miss の場合のみ `schema_questions.stable_key` fallback とする。Production D1 apply は **2026-05-01 10:59:35 UTC に migration `0008_create_schema_aliases.sql` が適用済み**であり、Phase 13 evidence (`docs/30-workflows/completed-tasks/task-issue-191-production-d1-schema-aliases-apply-001/outputs/phase-13/`) で PRAGMA table_info / index_list が required shape と一致することを確認済み。

UT-07B hardening では、`schema_aliases` の正本 write target を前提に back-fill を再開可能にする。`schema_questions.stable_key` への partial UNIQUE は fallback retirement 前の互換制約としてのみ評価し、正本 write target を direct update に戻さない。

実 migration `apps/api/migrations/0008_create_schema_aliases.sql` の正本 DDL:

- `schema_aliases(id, revision_id, stable_key, alias_question_id, alias_label, source, created_at, resolved_by, resolved_at)`
- `idx_schema_aliases_stable_key`
- `idx_schema_aliases_revision_stablekey_unique`: `stable_key IS NOT NULL AND stable_key != 'unknown' AND stable_key NOT LIKE '__extra__:%'`
- `idx_schema_aliases_revision_question_unique`

実 migration `apps/api/migrations/0008_schema_alias_hardening.sql` の正本 DDL: `schema_diff_queue.backfill_cursor` / `schema_diff_queue.backfill_status`。Production D1 ledger では `0008_schema_alias_hardening.sql` が `2026-05-01 08:21:04 UTC`、`0008_create_schema_aliases.sql` が `2026-05-01 10:59:35 UTC` に記録され、先行適用出所監査は `docs/30-workflows/unassigned-task/task-issue-359-production-d1-out-of-band-apply-audit-001.md` で扱う。

## Sheets→D1 sync enum canonicalization（U-UT01-08 / spec_created）

U-UT01-08 は docs-only 契約として、既存 `sync_job_logs` 移行時の値ドメインを次の候補に固定する。これは `spec_created` の契約であり、D1 migration / runtime literal rewrite / shared Zod 実装は UT-04 / UT-09 / U-UT01-10 が適用証跡を持つまで `impl_applied` と扱わない。

| 軸 | canonical set | 既存値の扱い | 実装 owner |
| --- | --- | --- | --- |
| `status` | `pending` / `in_progress` / `completed` / `failed` / `skipped` | `running -> in_progress`, `success -> completed`, `skipped -> skipped` | UT-04 / UT-09 |
| `trigger_type` | `manual` / `cron` / `backfill` | `admin -> manual`。actor 情報は `triggered_by='admin'` へ分離 | UT-04 / UT-09 |
| shared contract | `SyncStatus`, `SyncTriggerType` + Zod schema | 型と runtime validation を併設 | U-UT01-10 |

参照 workflow: `docs/30-workflows/u-ut01-08-sync-enum-canonicalization/`。

## Legacy Sheets sync transition note（U-UT01-09）

UT-01 legacy Sheets→D1 sync の retry / offset 方針は `docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/` を設計判断記録とする。現行 Forms response sync の `sync_jobs.metrics_json.cursor` 契約は上書きしない。


| 項目 | U-UT01-09 canonical |
| --- | --- |
| retry max | 3（`SYNC_MAX_RETRIES` で staging override 可） |
| backoff | base 1s, factor 2, cap 32s, jitter ±20% |
| `processed_offset` | `sync_job_logs.processed_offset INTEGER NOT NULL DEFAULT 0` を UT-09 / U-UT01-07 で追加予定 |
| offset unit | chunk index（chunk = 100 行）。Sheets 行削除 / 挿入 / 並べ替えを検知した場合は offset を無効化し full backfill または stable response high-water 方式へ退避する |
| current implementation drift | `apps/api/src/jobs/sync-sheets-to-d1.ts` の `DEFAULT_MAX_RETRIES=5` と `apps/api/migrations/0002_sync_logs_locks.sql` の `processed_offset` 不在は UT-09 追補で解消する |

## Schema alias assignment workflow（07b）

07b 固有の schema 差分確定・stableKey 更新・response back-fill・audit 境界は、500 行制限に従い [database-schema-07b-schema-alias-assignment.md](database-schema-07b-schema-alias-assignment.md) に分離する。

## ワークフロー関連テーブル

### workflows（ワークフロー定義）

| カラム | 型 | NULL | 説明 |
|--------|------|------|------|
| id | TEXT | NO | UUID主キー |
| name | TEXT | NO | ワークフロー名 |
| description | TEXT | YES | 説明文 |
| config | JSON | NO | トリガー設定、変数などの構造化データ |
| status | TEXT | NO | draft / active / paused / archived |
| created_at | TEXT | NO | 作成日時（ISO8601形式） |
| updated_at | TEXT | NO | 更新日時（ISO8601形式） |
| deleted_at | TEXT | YES | 削除日時（ソフトデリート用） |

### workflow_steps（ワークフローステップ）

| カラム | 型 | NULL | 説明 |
|--------|------|------|------|
| id | TEXT | NO | UUID主キー |
| workflow_id | TEXT | NO | 親ワークフローへの外部キー（CASCADE DELETE） |
| name | TEXT | NO | ステップ名 |
| type | TEXT | NO | agent_task / approval / condition / loop / parallel |
| order | INTEGER | NO | 実行順序（1から連番） |
| config | JSON | NO | ステップ固有の設定 |
| created_at | TEXT | NO | 作成日時 |

### workflow_executions（実行履歴）

| カラム | 型 | NULL | 説明 |
|--------|------|------|------|
| id | TEXT | NO | UUID主キー |
| workflow_id | TEXT | NO | 実行したワークフローへの外部キー |
| status | TEXT | NO | pending / running / completed / failed / cancelled |
| started_at | TEXT | NO | 実行開始日時 |
| completed_at | TEXT | YES | 実行完了日時 |
| result | JSON | YES | 実行結果（output または error） |
| context | JSON | NO | 実行時のコンテキスト情報 |

## ユーザー関連テーブル

### user_profiles（Supabase）

| カラム | 型 | NULL | 説明 |
|--------|------|------|------|
| id | TEXT | NO | UUID主キー（auth.users.id と同一） |
| display_name | TEXT | NO | 表示名（3-30文字） |
| email | TEXT | NO | メールアドレス |
| avatar_url | TEXT | YES | アバター画像URL |
| plan | TEXT | NO | プラン（free/pro/enterprise） |
| timezone | TEXT | YES | タイムゾーン（デフォルト: Asia/Tokyo） |
| locale | TEXT | YES | ロケール（デフォルト: ja） |
| notification_settings | JSON | YES | 通知設定 |
| preferences | JSON | YES | ユーザー設定（拡張用） |
| created_at | TEXT | NO | 作成日時 |
| updated_at | TEXT | NO | 更新日時 |
| deleted_at | TEXT | YES | 削除日時（ソフトデリート用） |

### api_keys（APIキー管理）

| カラム | 型 | NULL | 説明 |
|--------|------|------|------|
| id | TEXT | NO | UUID主キー |
| user_id | TEXT | NO | user_settingsへの外部キー |
| name | TEXT | NO | キーの用途識別名 |
| key_hash | TEXT | NO | 暗号化されたAPIキー |
| service | TEXT | NO | anthropic / openai / google / other |
| scopes | JSON | NO | 権限スコープ配列 |
| expires_at | TEXT | YES | 有効期限 |
| last_used_at | TEXT | YES | 最終使用日時 |
| revoked_at | TEXT | YES | 無効化日時 |
| created_at | TEXT | NO | 作成日時 |

## システムプロンプト関連テーブル

> **実装**: `packages/shared/src/repositories/system-prompt-repository.ts`
> **マイグレーション**: `apps/desktop/src/main/migration/electron-store-migration.ts`
> **タスク**: TASK-CHAT-SYSPROMPT-DB-001（2026-01-22完了）

### system_prompt_templates（システムプロンプトテンプレート）

ユーザーのシステムプロンプトテンプレートを永続化。プリセットテンプレートとカスタムテンプレートを管理し、オフライン対応とクラウド同期を実現。

| カラム | 型 | NULL | 説明 |
|--------|------|------|------|
| id | TEXT | NO | UUID主キー（v4形式） |
| user_id | TEXT | NO | 所有者のユーザーID |
| name | TEXT | NO | テンプレート名（1-50文字） |
| content | TEXT | NO | プロンプト内容（1-4000文字） |
| is_preset | INTEGER | NO | プリセットフラグ（0=カスタム, 1=プリセット） |
| created_at | TEXT | NO | 作成日時（ISO8601形式） |
| updated_at | TEXT | NO | 更新日時（ISO8601形式） |

**インデックス**:

| インデックス | カラム | 用途 |
|--------------|--------|------|
| system_prompt_templates_user_id_idx | user_id | ユーザー別テンプレート取得 |
| system_prompt_templates_name_idx | name | 名前検索 |
| system_prompt_templates_is_preset_idx | is_preset | プリセットフィルタ |
| system_prompt_templates_user_name_unq | user_id, name | 名前重複防止（UNIQUE） |

**制約**:

- PRIMARY KEY (id): UUID形式の一意識別子
- NOT NULL (user_id, name, content): 必須項目
- UNIQUE (user_id, name): 同一ユーザー内で名前の重複を禁止

## チャット関連テーブル

### chat_sessions（チャットセッション）

| カラム | 型 | NULL | 説明 |
|--------|------|------|------|
| id | TEXT | NO | UUID主キー（v4） |
| user_id | TEXT | NO | ユーザーID |
| title | TEXT | NO | セッションタイトル（3〜100文字） |
| created_at | TEXT | NO | 作成日時（ISO 8601形式、UTC） |
| updated_at | TEXT | NO | 最終更新日時 |
| message_count | INTEGER | NO | メッセージ総数（非正規化） |
| is_favorite | INTEGER | NO | お気に入りフラグ（0/1） |
| is_pinned | INTEGER | NO | ピン留めフラグ（0/1） |
| pin_order | INTEGER | YES | ピン留め時の表示順序（1〜10） |
| last_message_preview | TEXT | YES | 最終メッセージのプレビュー（最大50文字） |
| metadata | JSON | NO | 拡張メタデータ |
| deleted_at | TEXT | YES | 削除日時（ソフトデリート用） |

### chat_messages（チャットメッセージ）

| カラム | 型 | NULL | 説明 |
|--------|------|------|------|
| id | TEXT | NO | UUID主キー（v4） |
| session_id | TEXT | NO | 親セッションID（ON DELETE CASCADE） |
| role | TEXT | NO | メッセージロール（user / assistant） |
| content | TEXT | NO | メッセージ本文（1〜100,000文字） |
| message_index | INTEGER | NO | セッション内の順序（0から連番） |
| timestamp | TEXT | NO | メッセージ送信日時 |
| llm_provider | TEXT | YES | LLMプロバイダー名 |
| llm_model | TEXT | YES | LLMモデル名 |
| llm_metadata | JSON | YES | トークン使用量、応答時間等 |
| attachments | JSON | NO | 添付ファイル情報 |
| system_prompt | TEXT | YES | システムプロンプト |
| metadata | JSON | NO | 拡張メタデータ |

## RAG関連テーブル

### files（RAGファイルメタデータ）

| カラム | 型 | NULL | 説明 |
|--------|------|------|------|
| id | TEXT | NO | 主キー（ULID形式推奨） |
| name | TEXT | NO | ファイル名 |
| path | TEXT | NO | ファイルの絶対パス |
| mime_type | TEXT | NO | MIMEタイプ |
| category | TEXT | NO | ファイルカテゴリ |
| size | INTEGER | NO | ファイルサイズ（バイト） |
| hash | TEXT | NO | SHA-256ハッシュ（UNIQUE） |
| encoding | TEXT | NO | 文字エンコーディング |
| last_modified | INTEGER | NO | 最終更新日時 |
| metadata | JSON | NO | カスタムメタデータ |
| created_at | INTEGER | NO | 作成日時（UNIX時刻） |
| updated_at | INTEGER | NO | 更新日時 |
| deleted_at | INTEGER | YES | 削除日時（ソフトデリート） |

### chunks（RAGチャンク + FTS5）

| カラム | 型 | NULL | 説明 |
|--------|------|------|------|
| id | TEXT | NO | UUID主キー |
| file_id | TEXT | NO | 親ファイルID（CASCADE DELETE） |
| content | TEXT | NO | チャンク本文（FTS5同期） |
| contextual_content | TEXT | YES | コンテキスト付きテキスト |
| chunk_index | INTEGER | NO | ファイル内順序 |
| start_line | INTEGER | YES | 開始行番号 |
| end_line | INTEGER | YES | 終了行番号 |
| parent_header | TEXT | YES | 親見出しテキスト |
| strategy | TEXT | NO | チャンキング戦略 |
| token_count | INTEGER | YES | トークン数 |
| hash | TEXT | NO | SHA-256ハッシュ（UNIQUE） |
| prev_chunk_id | TEXT | YES | 前のチャンクID |
| next_chunk_id | TEXT | YES | 次のチャンクID |
| overlap_tokens | INTEGER | NO | オーバーラップトークン数 |
| metadata | JSON | YES | 拡張メタデータ |
| created_at | INTEGER | NO | 作成日時 |
| updated_at | INTEGER | NO | 更新日時 |

## Knowledge Graph関連テーブル

> **実装**: `packages/shared/src/db/schema/graph/`
> **マイグレーション**: `packages/shared/drizzle/migrations/0003_spotty_callisto.sql`

GraphRAG基盤となるKnowledge Graphを構成する6テーブル群。エンティティ（ノード）、リレーション（エッジ）、コミュニティ（クラスター）を管理し、RAGチャンクとの関連付けを実現。

### entities（エンティティ/ノード）

| カラム | 型 | NULL | 説明 |
|--------|------|------|------|
| id | TEXT | NO | 主キー（UUID） |
| name | TEXT | NO | エンティティ名 |
| type | TEXT | NO | エンティティ種別（Person, Organization等） |
| description | TEXT | YES | エンティティの説明 |
| embedding | BLOB | YES | ベクトル埋め込み（将来実装） |
| importance_score | REAL | YES | 重要度スコア（0.0-1.0） |
| mention_count | INTEGER | NO | 出現回数（デフォルト: 1） |
| first_seen_at | INTEGER | YES | 初回検出日時 |
| last_seen_at | INTEGER | YES | 最終検出日時 |
| metadata | JSON | YES | 拡張メタデータ |
| created_at | INTEGER | NO | 作成日時（UNIX時刻） |
| updated_at | INTEGER | NO | 更新日時 |
| deleted_at | INTEGER | YES | 削除日時（ソフトデリート） |

**インデックス**:

| インデックス | カラム | 用途 |
|--------------|--------|------|
| entities_name_idx | name | 名前検索 |
| entities_type_idx | type | 種別フィルタ |
| entities_importance_idx | importance_score | 重要度ソート |
| entities_deleted_at_idx | deleted_at | アクティブレコード取得 |

### relations（リレーション/エッジ）

| カラム | 型 | NULL | 説明 |
|--------|------|------|------|
| id | TEXT | NO | 主キー（UUID） |
| source_entity_id | TEXT | NO | 起点エンティティID（CASCADE DELETE） |
| target_entity_id | TEXT | NO | 終点エンティティID（CASCADE DELETE） |
| relation_type | TEXT | NO | 関係種別（WORKS_FOR, LOCATED_IN等） |
| description | TEXT | YES | 関係の説明 |
| weight | REAL | YES | 関係の強さ（0.0-1.0） |
| evidence_count | INTEGER | NO | 根拠チャンク数（デフォルト: 1） |
| metadata | JSON | YES | 拡張メタデータ |
| created_at | INTEGER | NO | 作成日時 |
| updated_at | INTEGER | NO | 更新日時 |
| deleted_at | INTEGER | YES | 削除日時（ソフトデリート） |

**インデックス**:

| インデックス | カラム | 用途 |
|--------------|--------|------|
| relations_source_idx | source_entity_id | 起点からの探索 |
| relations_target_idx | target_entity_id | 終点からの探索 |
| relations_type_idx | relation_type | 関係種別フィルタ |
| relations_source_target_idx | source_entity_id, target_entity_id | 重複チェック |
| relations_deleted_at_idx | deleted_at | アクティブレコード取得 |

### relation_evidence（関係の証拠）

| カラム | 型 | NULL | 説明 |
|--------|------|------|------|
| id | TEXT | NO | 主キー（UUID） |
| relation_id | TEXT | NO | リレーションID（CASCADE DELETE） |
| chunk_id | TEXT | NO | 根拠チャンクID（SET NULL） |
| confidence | REAL | YES | 信頼度スコア（0.0-1.0） |
| extracted_text | TEXT | YES | 抽出テキスト |
| created_at | INTEGER | NO | 作成日時 |

**インデックス**:

| インデックス | カラム | 用途 |
|--------------|--------|------|
| relation_evidence_relation_idx | relation_id | リレーション別証拠取得 |
| relation_evidence_chunk_idx | chunk_id | チャンク別証拠取得 |

### communities（コミュニティ/クラスター）

| カラム | 型 | NULL | 説明 |
|--------|------|------|------|
| id | TEXT | NO | 主キー（UUID） |
| name | TEXT | NO | コミュニティ名 |
| summary | TEXT | YES | コミュニティ要約 |
| level | INTEGER | NO | 階層レベル（デフォルト: 0） |
| parent_community_id | TEXT | YES | 親コミュニティID（SET NULL） |
| embedding | BLOB | YES | ベクトル埋め込み（将来実装） |
| entity_count | INTEGER | NO | 所属エンティティ数（デフォルト: 0） |
| metadata | JSON | YES | 拡張メタデータ |
| created_at | INTEGER | NO | 作成日時 |
| updated_at | INTEGER | NO | 更新日時 |

**インデックス**:

| インデックス | カラム | 用途 |
|--------------|--------|------|
| communities_level_idx | level | 階層レベルフィルタ |
| communities_parent_idx | parent_community_id | 親子関係探索 |

### entity_communities（エンティティ-コミュニティ中間テーブル）

| カラム | 型 | NULL | 説明 |
|--------|------|------|------|
| entity_id | TEXT | NO | エンティティID（CASCADE DELETE） |
| community_id | TEXT | NO | コミュニティID（CASCADE DELETE） |

**制約**: 複合主キー（entity_id, community_id）

**インデックス**:

| インデックス | カラム | 用途 |
|--------------|--------|------|
| entity_communities_entity_idx | entity_id | エンティティ別所属取得 |
| entity_communities_community_idx | community_id | コミュニティ別メンバー取得 |

### chunk_entities（チャンク-エンティティ中間テーブル）

| カラム | 型 | NULL | 説明 |
|--------|------|------|------|
| chunk_id | TEXT | NO | チャンクID（CASCADE DELETE） |
| entity_id | TEXT | NO | エンティティID（CASCADE DELETE） |
| mention_count | INTEGER | NO | チャンク内出現回数（デフォルト: 1） |
| positions | JSON | YES | 出現位置情報 |

**制約**: 複合主キー（chunk_id, entity_id）

**インデックス**:

| インデックス | カラム | 用途 |
|--------------|--------|------|
| chunk_entities_chunk_idx | chunk_id | チャンク別エンティティ取得 |
| chunk_entities_entity_idx | entity_id | エンティティ別チャンク取得 |

## 変換処理関連テーブル

### conversions（ファイル変換履歴）

> **実装**: `packages/shared/src/db/schema/conversions.ts`
> **サービス**: `packages/shared/src/services/history/`

ファイルをMarkdownやプレーンテキストに変換した履歴を記録。変換結果のキャッシング、バージョン管理、エラー追跡に使用。

| カラム | 型 | NULL | 説明 |
|--------|------|------|------|
| id | TEXT | NO | 主キー（ULID形式推奨） |
| file_id | TEXT | NO | filesテーブルへの外部キー（CASCADE DELETE） |
| status | TEXT | NO | 変換ステータス（pending / processing / completed / failed） |
| converter_id | TEXT | NO | 変換エンジン識別子（例: "markdown-converter-v1"） |
| input_hash | TEXT | NO | 入力ファイルのハッシュ値（キャッシュ判定用） |
| output_hash | TEXT | YES | 出力結果のハッシュ値（変換完了時） |
| duration | INTEGER | YES | 変換処理時間（ミリ秒） |
| input_size | INTEGER | YES | 入力ファイルサイズ（バイト） |
| output_size | INTEGER | YES | 出力ファイルサイズ（バイト） |
| error | TEXT | YES | エラーメッセージ（failed時） |
| error_details | JSON | YES | エラー詳細（スタックトレース等） |
| created_at | INTEGER | NO | 作成日時（UNIX時刻） |
| updated_at | INTEGER | NO | 更新日時（UNIX時刻） |

**インデックス**:

| インデックス | カラム | 用途 |
|--------------|--------|------|
| conversions_file_id_idx | file_id | ファイル単位履歴取得 |
| conversions_status_idx | status | ステータス検索 |
| conversions_input_hash_idx | input_hash | キャッシュヒット判定 |
| conversions_created_at_idx | created_at | 時系列ソート |
| conversions_file_status_idx | file_id, status | 複合検索 |

### conversion_logs（変換処理ログ）

> **実装予定**: CONV-05-02 (LogRepository実装タスク)
> **詳細設計**: `docs/30-workflows/logging-service/`

| カラム | 型 | NULL | 説明 |
|--------|------|------|------|
| id | TEXT | NO | UUID主キー |
| file_id | TEXT | NO | 対象ファイルID |
| level | TEXT | NO | ログレベル（info / warn / error） |
| message | TEXT | NO | ログメッセージ |
| metadata | JSON | YES | 追加メタデータ |
| error_stack | TEXT | YES | エラー時のスタックトレース |
| timestamp | TEXT | NO | ログ記録日時（ISO8601形式） |
| created_at | TEXT | NO | 作成日時 |

**インデックス計画**:

| インデックス | カラム | 用途 |
|--------------|--------|------|
| idx_conversion_logs_file_id | file_id | ファイル単位ログ取得 |
| idx_conversion_logs_level | level | レベルフィルタ |
| idx_conversion_logs_timestamp | timestamp | 日付範囲検索 |

## インデックス設計

詳細な index catalogue は [database-schema-indexes.md](database-schema-indexes.md) に分離した。UBM-Hyogo 用の追加 index は [database-indexes.md](./database-indexes.md) も参照する。

## 関連ドキュメント / 変更履歴
関連ドキュメントと旧変更履歴は [database-schema-index.md](database-schema-index.md) に分離。

---

## DDL 同期テンプレ

> 由来: UT-04 skill-feedback-report に基づく改善（2026-04-29）。テンプレ本体は責務分離のため [database-schema-ddl-template.md](./database-schema-ddl-template.md) に分離。本ファイルから新規テーブル追記時はそちらの雛形を参照する。

- [データベースアーキテクチャ](./database-architecture.md)
- [データベース実装](./database-implementation.md)
- [データベースインデックス](./database-schema-indexes.md)
- [コアインターフェース](./interfaces-converter.md)
- [システムプロンプトインターフェース](./interfaces-system-prompt.md)
- [チャット履歴インターフェース](./interfaces-chat-history.md)

変更履歴は `indexes/resource-map.md` と git history を正とする。
