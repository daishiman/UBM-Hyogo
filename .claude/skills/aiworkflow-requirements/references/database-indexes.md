# データベースインデックス設計

> 本ドキュメントは `database-schema.md` のインデックス一覧を責務分離した family file。

## ワークフロー関連

| テーブル | インデックス | カラム | 用途 |
|----------|--------------|--------|------|
| workflows | idx_workflows_status | status | ステータス検索 |
| workflows | idx_workflows_deleted_at | deleted_at | アクティブレコード取得 |
| workflow_steps | idx_steps_workflow_id | workflow_id | 親子関係の取得 |
| workflow_steps | idx_steps_order | workflow_id, order | 順序通りの取得 |
| workflow_executions | idx_executions_workflow_id | workflow_id | 履歴検索 |
| workflow_executions | idx_executions_status | status | 実行中/失敗の検索 |

## チャット関連

| テーブル | インデックス | カラム | 用途 |
|----------|--------------|--------|------|
| chat_sessions | idx_chat_sessions_user_id | user_id | ユーザー別セッション取得 |
| chat_sessions | idx_chat_sessions_created_at | created_at | 作成日時降順ソート |
| chat_sessions | idx_chat_sessions_is_pinned | user_id, is_pinned, pin_order | ピン留めセッション |
| chat_messages | idx_chat_messages_session_id | session_id | セッション別メッセージ |
| chat_messages | idx_chat_messages_timestamp | timestamp | 時系列検索 |
| chat_messages | idx_chat_messages_session_message | session_id, message_index | 順序一意性（UNIQUE） |

## RAG関連

| テーブル | インデックス | カラム | 用途 |
|----------|--------------|--------|------|
| files | files_hash_idx | hash | 重複ファイル検出（UNIQUE） |
| files | files_path_idx | path | ファイルパス検索 |
| files | files_mime_type_idx | mime_type | MIMEタイプフィルタ |
| chunks | idx_chunks_file_id | file_id | ファイル単位チャンク取得 |
| chunks | idx_chunks_hash | hash | 重複チャンク検出（UNIQUE） |
| chunks | idx_chunks_chunk_index | file_id, chunk_index | 順序付き取得 |

## Knowledge Graph関連

| テーブル | インデックス | カラム | 用途 |
|----------|--------------|--------|------|
| entities | entities_name_idx | name | 名前検索 |
| entities | entities_type_idx | type | 種別フィルタ |
| entities | entities_importance_idx | importance_score | 重要度ソート |
| entities | entities_deleted_at_idx | deleted_at | アクティブレコード取得 |
| relations | relations_source_idx | source_entity_id | 起点からの探索 |
| relations | relations_target_idx | target_entity_id | 終点からの探索 |
| relations | relations_type_idx | relation_type | 関係種別フィルタ |
| relations | relations_source_target_idx | source_entity_id, target_entity_id | 重複チェック |
| relations | relations_deleted_at_idx | deleted_at | アクティブレコード取得 |
| relation_evidence | relation_evidence_relation_idx | relation_id | リレーション別証拠取得 |
| relation_evidence | relation_evidence_chunk_idx | chunk_id | チャンク別証拠取得 |
| communities | communities_level_idx | level | 階層レベルフィルタ |
| communities | communities_parent_idx | parent_community_id | 親子関係探索 |
| entity_communities | entity_communities_entity_idx | entity_id | エンティティ別所属取得 |
| entity_communities | entity_communities_community_idx | community_id | コミュニティ別メンバー取得 |
| chunk_entities | chunk_entities_chunk_idx | chunk_id | チャンク別エンティティ取得 |
| chunk_entities | chunk_entities_entity_idx | entity_id | エンティティ別チャンク取得 |

## 関連ドキュメント

- [database-schema.md](./database-schema.md)
- [database-implementation.md](./database-implementation.md)
