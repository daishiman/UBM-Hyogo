# Phase 8 成果物: DRY 化 / リファクタリング サマリ

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-04 D1 データスキーマ設計 |
| Phase | 8 / 13 (DRY 化 / リファクタリング) |
| 作成日 | 2026-04-29 |
| 状態 | spec_created |
| docsOnly | true（実 DDL は既存・変更不要） |
| 前提 | Phase 1〜7 仕様確定 / index.md Canonical Schema Registry 確定 |

## エグゼクティブサマリ

Phase 1〜7 で確定した schema 仕様（DDL・マッピング・runbook・AC マトリクス）を横断レビューし、命名・型・パス・migration 番号規約の一貫性を担保した。`migrations/*.sql` を **唯一の正本** とする schema-as-source-of-truth 原則を再確認し、TS 型 / マッピング表 / mapper 実装 / runbook を派生資産として扱う構造を確定。redundancy 6 件を抽出し共通テンプレ化方針を決定、navigation drift 0 を確認した。

## 1. 命名揺れの洗い出しと統一

### 1.1 表記揺れ抽出結果

| # | 揺れ対象 | 揺れパターン | 採用名 | 採用根拠 |
| --- | --- | --- | --- | --- |
| 1 | 主テーブル | `members` / `member_responses` / `responses` | `member_responses` | 不変条件 #7（Form 再回答が本人更新の正式経路）と整合。index.md Canonical Schema Registry の正本扱い |
| 2 | 同期ジョブ履歴 | `sync_logs` / `sync_job_logs` / `syncJobs` | `sync_jobs` | Canonical Schema Registry の Schema sync 区分に準拠 |
| 3 | スキーマ差分キュー | `sync_locks` / `schema_diff_queue` | `schema_diff_queue` | 03a/03b 同期契約に準拠（locks 案は Legacy） |
| 4 | 監査ログ | `audit` / `audit_log` / `audit_logs` | `audit_logs` | UT-21 audit hook と命名共有（UT-04 では容量見積もりのみ） |
| 5 | Form 由来正規化 | `member_identity` / `member_identities` | `member_identities` | 複数形 + snake_case 統一 |
| 6 | ステータス | `memberStatus` / `member_status` | `member_status` | snake_case 統一 |
| 7 | 動的フィールド | `responseFields` / `response_fields` | `response_fields` | snake_case 統一 |
| 8 | business unique | `id`（PK 兼用） / `response_id` 混在 | `id`（surrogate INTEGER PK） + `response_id`（business UNIQUE） | Sheets Form response ID を business key 化 |
| 9 | timestamp | `createdAt` / `created_at` | `created_at` / `updated_at` | D1 は snake_case、TS 側 camelCase 変換は repository 層 |

### 1.2 Legacy 名取り扱いルール

| Legacy 名 | 扱い | 採用後の置換先 |
| --- | --- | --- |
| `members` | 文書中の参照のみ可、新規 DDL/コードでの使用禁止 | `member_responses` |
| `sync_job_logs` | 同上 | `sync_jobs` |
| `sync_locks` | 同上 | `schema_diff_queue` |

> Phase 2 以降の outputs では正本名のみを記述し、Legacy 名は「読み替え注記」のみ残す。

## 2. Before / After 比較テーブル

### 2.1 命名規則

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| 主テーブル | 揺れあり | `member_responses` | 不変条件 #7 整合 |
| 同期ジョブ | 揺れあり | `sync_jobs` | Canonical Schema Registry |
| 差分キュー | 揺れあり | `schema_diff_queue` | 03a/03b 契約 |
| 監査ログ | 揺れあり | `audit_logs` | UT-21 共有 |
| primary key | `id` / `response_id` 混在 | `id` (surrogate) + `response_id` (business UNIQUE) | upsert 基準明確化 |
| timestamp | camelCase / snake_case 混在 | `created_at` / `updated_at` | D1 snake_case 規約 |

### 2.2 型定義（schema-as-source-of-truth）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| schema 正本 | DDL / TS 型 / Zod / マッピング表で複数定義 | `migrations/*.sql` 唯一正本、TS は `apps/api/src/db/schema.ts` で再 export のみ | 不変条件 #1 整合 |
| 共通カラム | テーブル毎個別記述 | `id INTEGER PRIMARY KEY AUTOINCREMENT` / `created_at TEXT NOT NULL DEFAULT (datetime('now'))` / `updated_at TEXT NOT NULL DEFAULT (datetime('now'))` をテンプレ化 | DDL 重複削減 |
| 日時型 | `DATETIME` / `TIMESTAMP` 混在 | `TEXT` (ISO 8601 UTC) | SQLite 制約 + 苦戦箇所 #2 |
| 真偽値 | `BOOLEAN` / `INTEGER 0/1` 混在 | `INTEGER` + `CHECK (col IN (0,1))` | SQLite に BOOLEAN 型なし |
| consent flag | テーブル毎再定義 | `public_consent` / `rules_consent` 統一 | 不変条件 #2 完全整合 |

### 2.3 パス（migration / docs ディレクトリ）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| migration ファイル | `apps/api/migrations/` / `apps/api/src/migrations/` 混在想定 | `apps/api/migrations/0001_init.sql` 形式に固定 | wrangler.toml `migrations_dir` 規約 + 不変条件 #5 |
| schema TS 再 export | adhoc | `apps/api/src/db/schema.ts` | repository 層 import 単一経路 |
| マッピング表 | 各 Phase で再記述 | `outputs/phase-02/sheets-d1-mapping.md` 単一正本、他 Phase はリンク参照 | DRY |
| runbook | 各 Phase に分散 | `outputs/phase-05/implementation-runbook.md` 単一正本 | 適用手順の単一化 |

### 2.4 Migration 番号規約

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| 番号フォーマット | `001_` / `0001_` / `20260429_` 揺れ | `0001_init.sql`（4 桁ゼロ埋め） | wrangler 推奨 + 苦戦箇所 #3 |
| dev / production 整合 | 個別管理 | dev / production 共通連番（環境差は data 投入のみ） | 苦戦箇所 #3 対策 |
| 命名規約 | snake_case / kebab-case 混在 | snake_case（`0002_add_audit_logs.sql`） | wrangler 慣習 |

## 3. 共通 DDL 部品化（重複コードの抽出）

| # | 重複候補 | 抽出方針 | 適用範囲 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | `created_at` / `updated_at` カラム | 「共通カラムテンプレ」として index.md と phase-02 schema-design に列挙、各 migration が文言コピーで再現 | 全テーブル | DDL は静的のため部品化ではなくテンプレ参照固定 |
| 2 | `PRAGMA foreign_keys = ON;` | `0001_init.sql` 冒頭に 1 回のみ記述、後続 migration では原則不要（D1 が session 単位評価） | 全 migration | 苦戦箇所 #4 対策 |
| 3 | index 命名規約 | `idx_<table>_<col>` 単一 / `idx_<table>_<colA>_<colB>` 複合 | 全 index | 検索性確保 |
| 4 | UNIQUE 制約 | `response_id` / `email` 等 business key には必ず `UNIQUE` | member_responses 等 | 冪等性（UT-09 AC-3）の DB 側担保 |
| 5 | TS 側 schema 型 | `apps/api/src/db/schema.ts` で `export type MemberResponseRow = {...}` を一元定義 | 全 repository | UT-09 phase-08 共通化と整合 |
| 6 | マッピング表 | `outputs/phase-02/sheets-d1-mapping.md` 唯一正本、phase-03/04/05 は link 参照のみ | 全 phase | DRY |

## 4. schema-as-source-of-truth 原則

| レイヤ | 役割 | 派生方法 |
| --- | --- | --- |
| `apps/api/migrations/*.sql` | **唯一の正本**（DDL / 制約 / index） | 直接編集のみ。手書き禁止経路なし |
| `apps/api/src/db/schema.ts` | TS 型再 export | migration から手動 transcribe（差分は CI で検出予定） |
| `outputs/phase-02/sheets-d1-mapping.md` | Sheets ↔ D1 マッピング正本 | 仕様書側、他 Phase はリンク参照のみ |
| `outputs/phase-05/implementation-runbook.md` | 適用 runbook 正本 | scripts/cf.sh コマンド列挙の単一箇所 |
| `index.md` Canonical Schema Registry | 名前体系の正本 | 命名揺れ発生時の最終裁定権 |

## 5. Navigation Drift 確認

| チェック項目 | 確認方法 | 結果 |
| --- | --- | --- |
| artifacts.json `phases[*].outputs` × 各 phase-XX.md 成果物 path | 仕様書記述照合 | 一致（drift 0） |
| index.md `Phase 一覧` 表 file 列 × 実ファイル | ls で照合 | 一致（phase-01〜13.md 全存在） |
| index.md `主要成果物` 表 path | 仕様書照合 | 一致 |
| phase-XX.md 内の `../phase-YY.md` 相対参照 | 全件確認 | リンク切れ 0 |
| 原典 unassigned-task | `docs/30-workflows/unassigned-task/UT-04-d1-schema-design.md` | 実在確認済 |
| Skill reference path | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | 実在確認済 |
| UT-09 引き渡し path | `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/index.md` | 実在確認済 |
| GitHub Issue link | `https://github.com/daishiman/UBM-Hyogo/issues/53` | 仕様書記載一致 |

> drift 件数: **0 件**

## 6. 共通化パターンの確定

- 命名: snake_case（DB） / camelCase（TS 変数） / PascalCase（型） / kebab-case（ファイル）の住み分けを徹底
- schema-as-source-of-truth: `migrations/*.sql` を唯一正本、TS / マッピング表 / runbook はすべて参照のみ
- 4条件は「価値性 → 実現性 → 整合性 → 運用性」の順序固定
- consent キーは `public_consent` / `rules_consent` を **必ず** 使う（不変条件 #2）
- AC ID は `AC-1`〜`AC-N` のハイフン区切りで全 Phase 統一

## 7. 削除対象

| 対象 | 理由 | 残置時の影響 |
| --- | --- | --- |
| `temp_members` / `debug_responses` 等仮命名 | 実装フェーズに残らない確認 | 命名揺れ復活リスク |
| `wrangler.toml` 内不要 binding コメントアウト | cleanup | drift 源 |
| GAS prototype 由来命名（`sheetData` / `formResponse` 直訳） | 不変条件「GAS prototype を本番仕様に昇格させない」 | 規約違反 |
| 重複マッピング表 | phase-02 単一正本へ集約 | DRY 違反 |
| Legacy 名（`members` / `sync_job_logs` / `sync_locks`） の新規使用 | Canonical Schema Registry 違反 | UT-09 整合崩壊 |

## 8. UT-09 への引き渡し（命名整合）

| 項目 | UT-04 採用名 | UT-09 phase-08 想定 | 整合 |
| --- | --- | --- | --- |
| 主テーブル | `member_responses` | `members`（旧案） | UT-09 側 DRY で更新申し送り（Phase 12 unassigned-task 候補へ） |
| 同期ジョブ | `sync_jobs` | `sync_jobs` | 一致 |
| 差分キュー | `schema_diff_queue` | `schema_diff_queue` | 一致 |
| business key | `response_id` | `response_id` | 一致 |
| timestamp | TEXT (ISO 8601 UTC) | 同左 | 一致 |
| consent | `public_consent` / `rules_consent` (INTEGER 0/1) | 同左 | 一致（不変条件 #2 共通） |

## 9. 完了条件チェック

- [x] Before / After 比較テーブルが 4 区分（命名 / 型 / path / migration 番号）で網羅
- [x] 共通 DDL 部品化箇所 6 件を抽出
- [x] navigation drift 0 を確認
- [x] schema-as-source-of-truth 原則を明文化
- [x] migration 番号規約 `0001_init.sql`（4 桁）で全 Phase 一致
- [x] 本ファイル `outputs/phase-08/main.md` を作成

## 10. Phase 9 への引き渡し

| 引き継ぎ事項 | 内容 |
| --- | --- |
| DRY 化済みテーブル名 | `member_responses` / `member_identities` / `member_status` / `response_fields` / `schema_diff_queue` / `sync_jobs` / `audit_logs`（容量見積もりのみ） |
| 共通 DDL 部品化方針 | Phase 9 storage 見積もり時に index 数 4 個以内制約として参照 |
| schema-as-source-of-truth 原則 | Phase 9 link 検証で再確認 |
| navigation drift 0 状態 | Phase 9 link 検証の前提として維持 |
| UT-09 命名乖離 | Phase 10 での申し送り計画として継承 |

## 11. 多角的チェック観点（4 条件）

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | DRY 化により Phase 5 migration 実装時の手戻り削減、命名一貫性により会員データ管理の意図が明確 |
| 実現性 | PASS | 共通 DDL 部品化が wrangler 連番 migration と矛盾しない（`0001_` 4 桁規約遵守） |
| 整合性 | PASS | 不変条件 #1 / #2 / #4 / #5 すべて維持、Canonical Schema Registry に準拠 |
| 運用性 | PASS | 命名一貫性で runbook / log 検索性向上、scripts/cf.sh 経由の操作で揺れなし |
