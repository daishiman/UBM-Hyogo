# Phase 1: 要件定義 — main.md

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-04 D1 データスキーマ設計 |
| Phase | 1 / 13（要件定義） |
| 作成日 | 2026-04-29 |
| 状態 | spec_created |
| visualEvidence | NON_VISUAL |
| docsOnly | true |
| 既存 migration | `apps/api/migrations/0001_init.sql` 〜 `0006_admin_member_notes_type.sql`（変更しない） |

## 真の論点 (true issue)

「テーブルを作ること」ではなく、「Google Forms / Sheets schema 変動・SQLite 型制約・FK デフォルト無効・migration 番号管理という 4 大リスクを抱えた状態でも、後続 UT-09（Sheets→D1 同期）と UT-21（audit endpoint）が確定 schema に依存できる契約を提供すること」が本タスクの本質。

副次論点として、`docs/01-infrastructure-setup/03-serial-data-source-and-storage-contract` の data-contract.md と本タスク schema-design.md の役割境界を明示し、source-of-truth の二重管理を避ける。本タスクは canonical table set（`member_responses` / `member_identities` / `member_status` / `response_fields` / `schema_diff_queue` / `sync_jobs`）を正本とする `database-schema.md` の現行モデルを実装 refinement する位置づけ。

## visualEvidence の確定

| 項目 | 値 | 根拠 |
| --- | --- | --- |
| visualEvidence | NON_VISUAL | 成果物は DDL / migration SQL / runbook MD のみで UI スクリーンショット対象なし |
| 物理形態 | テキスト（既存 `apps/api/migrations/*.sql` + `outputs/phase-XX/*.md`） | DDL は既存、本タスクは docs のみ |
| 検証方法 | `bash scripts/cf.sh d1 migrations apply` 実行ログ・SQL lint・schema 整合性レビュー | Phase 11 manual smoke で実機確認 |

artifacts.json の `metadata.visualEvidence` は `NON_VISUAL` で確定。

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | 03-serial-data-source-and-storage-contract | data-contract.md（Sheets / D1 source-of-truth） | schema-design.md は data-contract の implementation refinement |
| 上流 | 02-serial-monorepo-runtime-foundation | Wrangler 環境・D1 binding 定義 | binding `DB` を migration コマンドに反映 |
| 上流 | 01b-parallel-cloudflare-base-bootstrap | dev / production の D1 instance 作成済 | `ubm-hyogo-db-dev` / `ubm-hyogo-db-prod` を runbook に記載 |
| 並列 | UT-01（同期方式定義） | 差分 vs 全件の判断 | unique key（`schema_diff_queue.question_id` partial UNIQUE 等）の設計に反映 |
| 下流 | UT-09（同期ジョブ実装） | 確定 DDL（既存 migration） | upsert 対象 schema を提供 |
| 下流 | UT-21（audit endpoint） | `audit_log` / `sync_job_logs` の有無 | 監査・ジョブログ系テーブルの位置づけ提供 |
| 下流 | UT-06（本番デプロイ） | production 適用 runbook | `bash scripts/cf.sh d1 migrations apply --env production` を提供 |

## テーブル候補一覧（実 migration 反映後の確定値）

| 区分 | テーブル | 由来 migration | 役割 |
| --- | --- | --- | --- |
| Forms response（canonical） | `member_responses` | 0001_init.sql | Forms 回答の正本（response_id 単位） |
| Forms response（canonical） | `member_identities` | 0001_init.sql | response_email 単位の同一人物束ね |
| Forms response（canonical） | `member_status` | 0002_admin_managed.sql | consent / publish_state 等の admin-managed 状態 |
| Forms response（canonical） | `response_fields` | 0001_init.sql | (response_id, stable_key) の値ストア |
| Schema sync（canonical） | `schema_diff_queue` | 0001_init.sql + 0005_response_sync.sql | Forms schema 差分キュー |
| Schema sync（canonical） | `sync_jobs` | 0003_auth_support.sql | schema_sync / response_sync ジョブログ |
| 補助（in scope） | `schema_versions` / `schema_questions` / `response_sections` | 0001_init.sql | Forms schema スナップショット |
| 補助（in scope） | `member_field_visibility` / `meeting_sessions` / `member_attendance` / `tag_definitions` / `member_tags` / `tag_assignment_queue` / `admin_member_notes` / `deleted_members` | 0002_admin_managed.sql / 0006 | admin-managed data |
| 補助（in scope） | `admin_users` / `magic_tokens` / `audit_log` | 0003_auth_support.sql | 認証・監査 |
| 補助（in scope） | `sync_locks` / `sync_job_logs` | 0002_sync_logs_locks.sql | UT-09 ジョブ運用 |
| view | `members` | 0001_init.sql | `member_identities` JOIN `member_responses` の閲覧用 view |

> 旧仕様書テンプレの `members`（テーブル）は本タスクでは採用せず、view として実装済（0001_init.sql）。canonical table set は database-schema.md の現行モデルを正本とする。

## 想定カラム制約候補（canonical 6 テーブル）

| テーブル | カラム | 型 | NOT NULL | UNIQUE / PK | INDEX |
| --- | --- | --- | --- | --- | --- |
| member_responses | response_id | TEXT | YES | PK | - |
| member_responses | form_id / revision_id / schema_hash | TEXT | YES | - | - |
| member_responses | response_email | TEXT | NO | - | (email, submitted_at) 複合 |
| member_responses | submitted_at | TEXT (ISO 8601) | YES | - | (email, submitted_at) |
| member_responses | answers_json / raw_answers_json / extra_fields_json / unmapped_question_ids_json | TEXT (JSON) | YES（DEFAULT 付） | - | - |
| member_responses | search_text | TEXT | YES (DEFAULT '') | - | - |
| member_identities | member_id | TEXT | YES | PK | - |
| member_identities | response_email | TEXT | YES | UNIQUE | - |
| member_identities | current_response_id / first_response_id | TEXT | YES | - | - |
| member_identities | last_submitted_at / created_at / updated_at | TEXT (ISO 8601) | YES | - | - |
| member_status | member_id | TEXT | YES | PK | - |
| member_status | public_consent / rules_consent | TEXT | YES (DEFAULT 'unknown') | - | (public_consent, publish_state, is_deleted) |
| member_status | publish_state | TEXT | YES (DEFAULT 'member_only') | - | 同上 |
| member_status | is_deleted | INTEGER (0/1) | YES (DEFAULT 0) | - | 同上 |
| member_status | hidden_reason / last_notified_at / updated_by | TEXT | NO | - | - |
| member_status | updated_at | TEXT (ISO 8601) | YES | - | - |
| response_fields | response_id / stable_key | TEXT | YES | PK 複合 | (response_id) |
| response_fields | value_json / raw_value_json | TEXT (JSON) | NO | - | - |
| schema_diff_queue | diff_id | TEXT | YES | PK | - |
| schema_diff_queue | revision_id / type / label | TEXT | YES | - | - |
| schema_diff_queue | question_id / stable_key / suggested_stable_key | TEXT | NO | partial UNIQUE(question_id WHERE status='queued') | - |
| schema_diff_queue | status | TEXT | YES (DEFAULT 'queued') | - | (status, created_at) |
| schema_diff_queue | resolved_by / resolved_at | TEXT | NO | - | - |
| schema_diff_queue | created_at | TEXT (ISO 8601, DEFAULT) | YES | - | - |
| sync_jobs | job_id | TEXT | YES | PK | - |
| sync_jobs | job_type | TEXT (schema_sync/response_sync) | YES | - | - |
| sync_jobs | started_at / finished_at | TEXT (ISO 8601) | started_at: YES | - | - |
| sync_jobs | status | TEXT (DEFAULT 'running') | YES | - | - |
| sync_jobs | error_json / metrics_json | TEXT (JSON) | metrics: YES (DEFAULT '{}') | - | - |

## Schema / migration ownership

| 物理位置 | ownership | reader | writer |
| --- | --- | --- | --- |
| `apps/api/migrations/*.sql` | UT-04 | UT-09 / UT-21 / UT-06 | UT-04（追加変更は別 migration を新規追加） |
| `outputs/phase-02/schema-design.md` | UT-04 | 後続全タスク | UT-04 |
| `outputs/phase-02/sheets-d1-mapping.md` | UT-04 | UT-09 mapper 実装 | UT-04 |
| `outputs/phase-02/migration-strategy.md` | UT-04 | UT-06 / UT-09 | UT-04 |

不変条件 #5 に従い `apps/web` は schema を直接参照しない。

## 価値とコスト

- 価値: Sheets 正本主義のもと、UT-09 / UT-21 / UT-06 が確定 schema に対してコードを書ける状態を提供。schema 不確定状態での実装スタート（手戻り）を防止。
- コスト: 既存 migration 7 ファイル（0001〜0006）の docs 化のみ。実 DDL は既存で適用済のため追加実装コストなし。
- 機会コスト: 過剰正規化を選んだ場合、SQLite 性能と運用複雑性が上がる。Phase 3 で正規化レベル（base case = 案 A）を確定する。

## 4条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 後続 UT-09 / UT-21 / UT-06 が依存できる確定 schema を、既存 migration の docs 化という最小コストで提供 |
| 実現性 | PASS | 既存 `apps/api/migrations/*.sql` が稼働中。`scripts/cf.sh` 経由の適用フローが確立 |
| 整合性 | PASS | 不変条件 #1 (schema 固定回避) / #4 (admin-managed data 分離) / #5 (apps/api 限定) を全て満たす設計が既存実装に内包 |
| 運用性 | PASS | 連番 migration 規約 (`NNNN_<verb>_<target>.sql`) と runbook で dev / production 双方の再現性を担保 |

## 受入条件（AC-1〜AC-12, index.md と完全一致）

- AC-1: D1 テーブル定義（DDL）が `outputs/phase-02/schema-design.md` として文書化されている
- AC-2: Wrangler マイグレーションファイル（`apps/api/migrations/0001_init.sql` 等）が作成され、構文エラーなく適用可能である
- AC-3: Google Sheets の入力項目と D1 カラムのマッピング表が `outputs/phase-02/sheets-d1-mapping.md` として作成されている
- AC-4: dev 環境でマイグレーション適用が成功する（`bash scripts/cf.sh d1 migrations apply <DB> --env dev --local`）
- AC-5: production 環境向けのマイグレーション適用手順が runbook として文書化されている
- AC-6: PRIMARY KEY / NOT NULL / UNIQUE / FOREIGN KEY / INDEX が AC として明示された各テーブルに適切に定義されている
- AC-7: `03-serial-data-source-and-storage-contract` の data-contract.md と schema が整合し、source-of-truth の矛盾がゼロである
- AC-8: 連番マイグレーション規約（`NNNN_<verb>_<target>.sql`）が `outputs/phase-02/migration-strategy.md` で明文化されている
- AC-9: DATETIME を ISO 8601 TEXT 形式で統一する仕様が明文化されている
- AC-10: `PRAGMA foreign_keys = ON;` の取り扱い方針が確定している
- AC-11: 4条件（価値性 / 実現性 / 整合性 / 運用性）の最終判定が PASS である
- AC-12: 不変条件 #5 が schema 設計内で侵食されていない（migration が `apps/api/migrations/` に固定）

## 多角的チェック観点

- 不変条件 #1: Sheets schema の列名はコード直書きではなく、`schema_questions.stable_key` に正規化済（0001_init.sql）。
- 不変条件 #4: admin-managed data は `member_status` / `meeting_sessions` / `admin_member_notes` 等の専用テーブルに分離（0002_admin_managed.sql / 0006）。
- 不変条件 #5: 全 migration が `apps/api/migrations/` 配下。`apps/web` から schema 参照は不要。
- SQLite 型: 全 DATETIME が TEXT 型。`(datetime('now'))` または ISO 8601 文字列で書き込み。
- FK: 0001〜0006 は明示 FOREIGN KEY 宣言なし。`PRAGMA foreign_keys = ON;` の取り扱いは migration-strategy.md に記述。
- migration 番号: `0002_admin_managed.sql` と `0002_sync_logs_locks.sql` の 2 ファイル併存に注意（Wrangler 適用順は辞書順で確定）。Phase 2 で運用注意事項を明記する。

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | visualEvidence = NON_VISUAL の確定 | spec_created | artifacts.json と同期 |
| 2 | 真の論点を「契約提供 + 4 大リスク管理」に再定義 | spec_created | 本ファイル冒頭 |
| 3 | 依存境界（上流 3 / 並列 1 / 下流 3）の固定 | spec_created | UT-09 / UT-21 と整合 |
| 4 | テーブル候補（canonical 6 + 補助）の暫定列挙 | spec_created | 既存 migration 反映 |
| 5 | カラム制約候補表の作成 | spec_created | canonical 6 テーブル |
| 6 | Schema / migration ownership 宣言 | spec_created | apps/api/migrations/ 限定 |
| 7 | 4条件評価 PASS 確定 | spec_created | 全件 PASS |
| 8 | AC-1〜AC-12 の確定 | spec_created | index.md と完全一致 |

## 次 Phase への引き渡し

- 次 Phase: 2 (設計)
- 引き継ぎ事項:
  - 真の論点 = 契約提供 + 4 大リスク管理
  - canonical table set 6 個 + 補助テーブル群を docs 化対象とする
  - 既存 migration（0001〜0006）から実 CREATE TABLE 文を schema-design.md に転記する
  - DATETIME は TEXT (ISO 8601) で統一
  - migration ownership は `apps/api/migrations/` に固定
- ブロック条件:
  - 4条件のいずれかが MINOR / MAJOR
  - AC-1〜AC-12 が index.md と乖離
  - visualEvidence が NON_VISUAL 以外で誤確定
