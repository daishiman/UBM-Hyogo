# 型安全クエリ・マイグレーション データベース設計 / core specification

> 親仕様書: [database-implementation.md](database-implementation.md)
> 役割: core specification

## 型安全なクエリ実装

### Drizzle ORM使用時のベストプラクティス

1. **スキーマからの型推論を活用する**
   - `InferSelectModel`と`InferInsertModel`を使用して型を生成
   - 手動で型定義を二重管理しない

2. **リレーションを明示的に定義する**
   - `relations()`関数でテーブル間の関係を宣言
   - `with`オプションで関連データを一括取得し、N+1問題を回避

3. **JSON カラムにはZodスキーマを併用する**
   - `.$type<T>()`で型を指定しつつ、ランタイムバリデーションも行う
   - スキーマ変更時はZodスキーマも更新する

4. **クエリビルダーのメソッドチェーンを活用する**
   - `where()`, `orderBy()`, `limit()`などを適切に組み合わせる
   - 動的な条件は配列に集めて`and()`で結合

### トランザクション処理の注意点

1. **トランザクション境界を明確にする**
   - 複数テーブルへの書き込みは必ずトランザクション内で行う
   - `db.transaction()`のコールバック内で全操作を完結させる

2. **エラー時の自動ロールバック**
   - トランザクション内で例外が発生すると自動的にロールバックされる
   - catchブロックで部分的なコミットを試みない

3. **デッドロック対策**
   - 複数テーブルへのアクセス順序を統一する
   - リトライ処理を実装し、一時的な競合に対応する

### バッチ処理のベストプラクティス

1. **一括挿入を使用する**
   - ループ内での個別insertではなく、`values()`に配列を渡す
   - 大量データは1000件程度のチャンクに分割

2. **大量削除は段階的に行う**
   - `LIMIT`を使って少しずつ削除し、ロック時間を短縮
   - 本番環境では営業時間外に実行することを推奨

3. **集計クエリの最適化**
   - `sql`タグ付きテンプレートで集計関数を使用
   - カバリングインデックスを活用し、テーブルスキャンを回避

---

## Embedded Replicas とオフライン対応

### Embedded Replicasの仕組み

Turso の Embedded Replicas は、ローカルの SQLite ファイルとクラウドの Turso DB を自動同期する機能。デスクトップアプリのオフライン動作に最適。

### 初期化時の設定項目

| 設定項目     | 説明                   | 推奨値    |
| ------------ | ---------------------- | --------- |
| url          | ローカルDBファイルパス | file:パス |
| syncUrl      | 同期先のTurso URL      | libsql:// |
| authToken    | Turso認証トークン      | 環境変数  |
| syncInterval | 自動同期間隔（秒）     | 60        |

### 同期フロー

1. **オフライン時**: ローカルSQLiteファイルに対して読み書きを行う
2. **オンライン復帰時**: `client.sync()`を呼び出して差分をTursoに送信
3. **定期同期**: `syncInterval`で指定した間隔でバックグラウンド同期
4. **競合発生時**: 設定した競合解決戦略に従って解決

### 競合解決戦略

| 戦略            | 説明                       | 適用シーン                 |
| --------------- | -------------------------- | -------------------------- |
| last_write_wins | 最後に書き込まれた値を採用 | 設定値など、最新が正の場合 |
| manual          | ユーザーに選択を委ねる     | 重要データの競合           |
| merge           | フィールドごとにマージ     | 部分的な更新が可能な場合   |

### 同期状態の監視

- 同期の成功/失敗をUIに表示する
- 競合発生時はユーザーに通知する
- オフライン状態を明示的に表示する
- 同期エラーが続く場合は手動同期ボタンを提供する

### オフライン対応の注意点

1. **データ整合性**: オフライン中に作成されたIDが重複しないよう、UUIDを使用する
2. **タイムスタンプ**: クライアント時刻のずれに注意し、サーバー時刻での補正を検討
3. **同期順序**: 依存関係のあるデータは親→子の順序で同期する
4. **ストレージ容量**: ローカルDBのサイズを監視し、古いデータは定期的にクリーンアップ

---

## マイグレーション管理

### Drizzle Kit の使用方法

| コマンド                      | 用途                                      |
| ----------------------------- | ----------------------------------------- |
| `pnpm drizzle-kit generate`   | スキーマ変更からマイグレーションSQLを生成 |
| `pnpm drizzle-kit push`       | マイグレーションを直接DBに適用（開発用）  |
| `pnpm drizzle-kit migrate`    | マイグレーションを順次適用（本番用）      |
| `pnpm drizzle-kit studio`     | Web UIでDBを確認・操作                    |
| `pnpm drizzle-kit introspect` | 既存DBからスキーマを逆生成                |

### マイグレーション運用原則

1. **バージョン管理必須**
   - 生成されたマイグレーションファイルは必ずGit管理する
   - マイグレーションファイルを手動編集した場合はコメントで理由を記載

2. **ロールバック可能な設計**
   - 破壊的変更（カラム削除等）は段階的に行う
   - 旧カラムを一定期間残し、移行完了後に削除

3. **データ移行とスキーマ変更の分離**
   - 大量データの移行はマイグレーションとは別のスクリプトで行う
   - 本番適用前にステージング環境で十分にテスト

4. **ダウンタイム最小化**
   - カラム追加は即時反映可能（ダウンタイムなし）
   - カラム削除・型変更は慎重に計画

### 本番デプロイ時のチェックリスト

- [ ] ステージング環境でマイグレーションをテスト済み
- [ ] ロールバック手順を確認済み
- [ ] バックアップを取得済み
- [ ] 想定実行時間を見積もり済み
- [ ] 影響範囲をチームに共有済み

---

## テスト戦略

### ユニットテストでのDB設定

1. **インメモリDBを使用する**
   - `url: ':memory:'`でインメモリSQLiteを作成
   - テストごとにクリーンな状態から開始

2. **テスト前にマイグレーションを適用する**
   - `beforeEach`で毎回DBを初期化
   - 本番と同じスキーマでテスト

3. **テストデータはファクトリ関数で生成する**
   - 必要最小限のデータを動的に生成
   - ハードコードされたテストデータを避ける

### テストデータのシード

- 開発環境用のシードスクリプトを用意する
- 現実的なサンプルデータを生成する
- 外部APIキーなどの機密情報はダミー値を使用

### 統合テストの考慮事項

1. **テスト用DBの分離**: テストは専用のDBインスタンスを使用
2. **並列実行**: テスト間でデータが干渉しないよう設計
3. **クリーンアップ**: テスト後に作成したデータを削除

---

## UBM-Hyogo D1 Repository 契約（02b）

`apps/api/src/repository/` は D1 直接アクセス境界であり、後続の API / workflow / sync 実装は repository 公開 API 経由で D1 を操作する。

| ファイル | 主な契約 |
| --- | --- |
| `meetings.ts` | `meeting_sessions` の read と admin insert |
| `attendance.ts` | `member_attendance` の list/add/remove、削除済み除外済み候補一覧 |
| `tagDefinitions.ts` | tag 辞書 read only。write API は提供しない |
| `tagQueue.ts` | `queued -> reviewing -> resolved/rejected` の一方向状態遷移。07a resolve workflow は `queued/reviewing -> resolved/rejected` を guarded update で扱う |
| `schemaVersions.ts` | active manifest の latest 解決、version list、upsert、supersede |
| `schemaQuestions.ts` | form field upsert、stable key 更新 |
| `schemaDiffQueue.ts` | diff type 分類、queued list、resolve |

### 状態と結果型

| 契約 | 値 |
| --- | --- |
| `TagQueueStatus` | `queued` / `reviewing` / `resolved` |
| `ALLOWED_TRANSITIONS` | `queued -> reviewing`, `reviewing -> resolved`, `resolved -> []` |
| `DiffType` | `added` / `changed` / `removed` |
| `DiffStatus` | `queued` / `resolved` |
| `AddAttendanceResult.reason` | `duplicate` / `deleted_member` / `session_not_found` |

### Query ルール

- `schemaVersions.getLatestVersion(formId)` は `state='active' ORDER BY synced_at DESC LIMIT 1` を返す。
- `schemaDiffQueue.list(ctx)` は type 未指定時に `status='queued' ORDER BY created_at ASC` を返す。`type` は added/changed/removed の分類であり、未解決状態は `status='queued'` が正本。
- `schemaDiffQueue.resolve(ctx, diffId, by)` は存在しない `diffId` を成功扱いにせず not found error を返す。
- `attendance.addAttendance()` は `(member_id, session_id)` の PK 制約を重複防止の最終防衛線にする。削除済み除外は INSERT 前確認で行い、07c の API / audit 実装で操作直前の再確認と監査ログを担保する。07c API は candidates でも session 存在を確認し、不在時は `session_not_found` を返す。
- `attendance.listAttendableMembers()` の `fullName` / `occupation` は 02a の response 系統合まで placeholder であり、04c/07c では表示値を別契約で補完する。
- 07c の attendance audit は `audit_log.target_type='meeting'`, `target_id=sessionId` を正とする。付与時は `after_json`、解除時は `before_json` に attendance row を保存し、DELETE の session/member/row 不在は `attendance_not_found` に集約する。

### 検証

- `pnpm --filter @ubm-hyogo/api typecheck`
- `pnpm vitest run apps/api/src/repository`

---

## エラーハンドリング

### DB接続エラーへの対応

1. **リトライ処理を実装する**
   - 最大リトライ回数: 3回
   - 指数バックオフ: 1秒 → 2秒 → 4秒

2. **エラーの種類を分類する**
   - 接続エラー: リトライ対象
   - クエリエラー: 即座に失敗
   - タイムアウト: リトライ対象

3. **ユーザーへのフィードバック**
   - 接続エラー時は明確なメッセージを表示
   - リトライ中であることを示す

### デッドロック対応

- トランザクションの取得順序を統一する
- 競合が予想される操作にはリトライを実装
- 長時間のトランザクションを避ける

### データ整合性エラー

- 外部キー制約違反は適切にキャッチしてエラーメッセージを返す
- UNIQUE制約違反は重複チェックのロジックを見直す
- NOT NULL制約違反は入力バリデーションを強化

---

## Conversation DB 初期化パターン

## UBM-Hyogo Schema Sync Contract（03a）

`03a-parallel-forms-schema-sync-and-stablekey-alias-queue` の D1 書き込み契約。

| テーブル | 03a での責務 |
| -------- | ------------ |
| `schema_versions` | `revision_id` / `schema_hash` 単位の manifest upsert。`field_count=31`、`unknown_field_count` は stableKey 未解決件数を保存 |
| `schema_questions` | `question_pk = revisionId:questionId` で form question を upsert。既知 stableKey は `packages/integrations/google` の label map と既存 question alias から解決 |
| `schema_diff_queue` | stableKey 未解決 question を `type='unresolved'`, `status='queued'` で 1 question = 1 row 登録 |
| `sync_jobs` | `job_type='schema_sync'` の `running -> succeeded/failed` ledger。既に running があれば新規実行は 409 |

不変条件:

| # | 内容 |
| - | ---- |
| #1 | stableKey 文字列を同期実装へ直書きしない。既知 map / alias 解決経由に閉じる |
| #5 | D1 access は `apps/api` 内に閉じ、`apps/web` から直接読まない |
| #10 | schema cron は 1 日 1 回に制限する |
| #14 | schema 変更の人手解決は `/admin/schema` 系 workflow（後続 06c/07b）へ集約する |

### Schema Alias Resolution Contract（issue-191 / 07b wiring）

`issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring` で、07b alias assignment workflow の正本書き込み先を
`schema_questions.stable_key` 直更新から `schema_aliases` 専用テーブルへ分離する方針を固定する。現時点の workflow は
`spec_created / docs_only` であり、実 DDL 適用・repository 実装・03a/07b 配線は後続実装タスクで実施する。

`schema_aliases` 予定 DDL:

| カラム | 型 | 制約 / 用途 |
| --- | --- | --- |
| `id` | TEXT | PRIMARY KEY。ULID 推奨 |
| `stable_key` | TEXT | NOT NULL。解決後の正規 stableKey |
| `alias_question_id` | TEXT | NOT NULL。Google Forms の question_id。UNIQUE |
| `alias_label` | TEXT | 解決時点の question label snapshot |
| `source` | TEXT | NOT NULL DEFAULT `'manual'`。`manual` / `auto` / `migration` |
| `created_at` | TEXT | NOT NULL DEFAULT `datetime('now')` |
| `resolved_by` | TEXT | 07b 書き込み元の admin user id。manual resolve では必須、migration source のみ nullable |
| `resolved_at` | TEXT | 解決確定時刻 |

Index:

| 名称 | 対象 | 目的 |
| --- | --- | --- |
| `idx_schema_aliases_stable_key` | `schema_aliases(stable_key)` | stableKey 逆引きと監査 |

Repository 契約:

| 関数 | 役割 |
| --- | --- |
| `schemaAliasesRepository.lookup(questionId)` | `alias_question_id` から alias 行を取得 |
| `schemaAliasesRepository.insert(row)` | 07b の alias resolve 結果を追加。`schema_questions` は更新しない |
| `schemaAliasesRepository.update(id, patch)` | 誤登録修正などの管理操作用。監査情報を維持 |
| `schemaQuestionsRepository.findStableKeyById(questionId)` | 移行期間中のみ fallback として既存 stableKey を読む |

03a lookup 順序:

1. `schemaAliasesRepository.lookup(questionId)` が hit したら `schema_aliases.stable_key` を採用する。
2. miss の場合だけ `schema_questions.stable_key` を fallback として読む。
3. 両方 miss の場合は `schema_diff_queue` に unresolved として enqueue する。

07b 書き込み境界:

- 正規 path は既存 07b / 04c 契約と互換の `POST /admin/schema/aliases`。issue-191 以前の `schema_questions` direct update semantics は撤回し、同 endpoint の内部書き込み先を `schema_aliases` へ差し替える。
- 正常時は `schema_aliases` に 1 行を書き、対応する `schema_diff_queue.status` を `resolved` にする。
- `source='manual'` の INSERT は `resolved_by` を必須とし、auth middleware 由来の admin user id を記録する。
- `UPDATE schema_questions SET stable_key` は禁止。静的検査は Phase 9 の grep guard を起点に、後続実装で repository / AST guard へ強化する。

移行終端条件:

- `schema_questions.stable_key IS NOT NULL` の全行が `schema_aliases` にも存在する状態を確認する。
- 03a sync で unresolved 件数が事前比 1 件以上減少することを smoke evidence として保存する。
- 上記を満たした後、別タスクで `schema_questions.stable_key` fallback 廃止を判断する。

---

### Factory 関数群（conversationDatabase.ts）

| 関数 | 戻り値 | 用途 |
|------|--------|------|
| `initializeConversationDatabase(config?)` | `Database.Database` | DB初期化（冪等性保証） |
| `getConversationDatabase()` | `Database.Database` | 初期化済みインスタンス取得 |
| `isConversationDatabaseInitialized()` | `boolean` | 初期化状態確認 |
| `closeConversationDatabase()` | `void` | WALチェックポイント + クローズ |
| `_resetForTesting()` | `void` | テスト用状態リセット（P9対策） |

### pragma 設定

| pragma | 値 | 理由 |
|--------|---|------|
| journal_mode | WAL | 読み書き並行性向上 |
| foreign_keys | ON | chat_messages → chat_sessions 参照整合性 |
| busy_timeout | 5000 | 同時アクセス時のロック待機 |
| synchronous | NORMAL | WALモード推奨値 |

### ライフサイクル

```
app.whenReady() → initializeConversationDatabase()
app.on('will-quit') → closeConversationDatabase()
app.on('activate') → getConversationDatabase() (既存インスタンス再利用)
```

### 完了タスク

- TASK-FIX-CONVERSATION-DB-ROBUSTNESS-001 (2026-03-19)

---

## ベクトル検索実装（DiskANN）

### 概要

libSQLのDiskANNベクトルインデックスを使用したセマンティック検索機能。
RAGシステムの類似度検索基盤として実装。

**実装場所**: `packages/shared/src/db/queries/vector-search.ts`

### embeddingsテーブル

| カラム              | 型        | 制約                       | 説明               |
| ------------------- | --------- | -------------------------- | ------------------ |
| id                  | TEXT      | PRIMARY KEY                | 埋め込みID（UUID） |
| chunk_id            | TEXT      | UNIQUE, FK→chunks(id)      | チャンク参照       |
| vector              | BLOB      | NOT NULL                   | Float32Arrayバイナリ |
| model_id            | TEXT      | NOT NULL                   | 埋め込みモデルID   |
| dimensions          | INTEGER   | NOT NULL                   | ベクトル次元数     |
| normalized_magnitude| REAL      | NOT NULL                   | 正規化済みマグニチュード |
| created_at          | INTEGER   | DEFAULT unixepoch()        | 作成日時           |
| updated_at          | INTEGER   | DEFAULT unixepoch()        | 更新日時           |

**インデックス**:
- `embeddings_chunk_id_idx`: UNIQUE（高速ルックアップ）
- `embeddings_model_id_idx`: モデル別集計用
- `embeddings_vector_idx`: DiskANNベクトルインデックス

### ベクトル検索関数

| 関数                | 距離メトリクス | 用途                  |
| ------------------- | -------------- | --------------------- |
| searchByVector      | コサイン類似度 | セマンティック検索    |
| searchByVectorL2    | ユークリッド距離 | 空間的な類似検索    |
| searchByVectorDot   | 内積           | 正規化ベクトル向け    |

### Float32Array ⇔ BLOB 変換

ベクトルデータはFloat32Array形式でアプリケーション層で扱い、データベースにはBLOB（バイナリ）形式で保存する。変換はゼロコピー操作で効率的に行われる。

**変換制約**:
- 空のベクトルは禁止（要素数が1以上であること）
- BLOBのバイト長は4の倍数であること（Float32は4バイト単位）
- 変換時にNaN、Infinity、-Infinityが含まれていないことを検証

### バッチ挿入

大量の埋め込みを効率的に挿入するため、100件単位のバッチ処理を実装。トランザクション内で処理され、挿入前にすべてのベクトルがバリデーションされる。いずれかのベクトルが不正な場合は全体がロールバックされる。

### パフォーマンス目標

| データ規模   | 検索時間目標 | インデックス |
| ------------ | ------------ | ------------ |
| < 10,000件   | < 50ms       | 任意         |
| 10,000-100,000件 | < 100ms  | 推奨         |
| > 100,000件  | < 200ms      | 必須         |

---
