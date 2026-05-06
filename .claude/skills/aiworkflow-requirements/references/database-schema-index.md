# Database Schema Index

> Parent: [database-schema.md](database-schema.md)

## 関連ドキュメント

- [データベースアーキテクチャ](./database-architecture.md)
- [データベース実装](./database-implementation.md)
- [データベースインデックス設計](./database-indexes.md)
- [コアインターフェース](./interfaces-converter.md)
- [システムプロンプトインターフェース](./interfaces-system-prompt.md)
- [チャット履歴インターフェース](./interfaces-chat-history.md)

## 変更履歴

| バージョン | 日付 | 変更内容 |
| --- | --- | --- |
| 1.4.0 | 2026-05-06 | `deleted_members` に `purged_at` / `retention_policy_version` / `idx_deleted_members_purge_due` を追加（migration `0014_add_deleted_members_purge_metadata.sql`、issue-402、SSOT: [data-retention-policy.md](./data-retention-policy.md)） |
| 1.3.0 | 2026-04-29 | DDL 同期テンプレ節を追加（UT-04 skill-feedback-report 反映） |
| 1.2.0 | 2026-01-24 | chat_sessions/chat_messages Repository/IPC実装完了 |
| 1.1.0 | 2026-01-22 | system_prompt_templates テーブル追加 |
| 1.0.0 | - | 初版作成 |
