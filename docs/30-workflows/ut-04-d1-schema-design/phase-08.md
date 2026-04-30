# Phase 8: DRY 化 / リファクタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | D1 データスキーマ設計 (UT-04) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 / リファクタリング |
| 作成日 | 2026-04-29 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | spec_created |
| タスク分類 | specification-design（refactoring / dry） |

## 目的

Phase 1〜7 で確定した schema DDL / マッピング / runbook / AC マトリクスに対し、命名・型・パス・migration 番号の一貫性を担保する DRY 化を行う。**schema-as-source-of-truth** 原則に基づき、`migrations/*.sql` を唯一の正本とし、TS 型・マッピング表・mapper 実装・runbook の各箇所で重複定義が発生しないようにする。下流の UT-09（Sheets→D1 同期ジョブ）が schema 引き渡しを前提として走るため、ここで揺れを残すと AC 全体に波及する。

## 実行タスク

1. Phase 1〜7 の仕様書 / outputs path / artifacts.json を横断 grep し、命名揺れ（例: `members` vs `member_responses` vs `responses`、`response_id` vs `responseId`）を洗い出す（完了条件: 揺れ件数が表化されている）。
2. Migration ファイル間の共通 DDL（`created_at` / `updated_at` / `PRAGMA foreign_keys = ON;` / index 命名規約）を共通部品方針として明文化する（完了条件: 共通カラム / PRAGMA / index 命名規約が確定）。
3. Sheets→D1 マッピング定義の重複を排除し、`outputs/phase-02/sheets-d1-mapping.md` を単一正本として他 Phase は参照のみとするルートを確定する（完了条件: マッピング表の重複定義 0）。
4. Migration 番号規約（`0001_init.sql` の連番プレフィックス、dev / production 共通）を全 Phase で統一する（完了条件: 番号規約が全 phase で一致）。
5. artifacts.json の outputs path と各 phase-XX.md の参照 path が一致するか確認する（完了条件: 不一致 0）。
6. doc 内リンク（`docs/30-workflows/.../phase-XX.md`、`docs/30-workflows/unassigned-task/UT-04-...`、UT-09 への引き渡し path）を全部辿り、リンク切れが無いか確認する（完了条件: navigation drift 0）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/phase-01.md 〜 phase-07.md | DRY 化対象 |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/artifacts.json | path 整合の起点 |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/index.md | 用語・命名の正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | テーブル名・カラム名規約 |
| 必須 | docs/30-workflows/unassigned-task/UT-04-d1-schema-design.md | 原典・苦戦箇所 |
| 参考 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/phase-08.md | DRY 化観点の参照事例 |

## Before / After 比較テーブル

### 命名規則

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| 主テーブル | `members` / `member_responses` / `responses` 表記揺れ想定 | `member_responses`（フォーム回答正本）に統一 | 不変条件 #7（Form 再回答が本人更新の正式経路）と整合 |
| 同期ログ | `syncLogs` / `sync_log` | `sync_jobs` を UT-04 正本 ledger とし、既存 `sync_job_logs` は UT-09 owned transition table として分離 | 正本と移行支援テーブルの責務を分ける |
| 同期ロック | `syncLock` / `sync_lock` | `sync_locks` は UT-09 owned transition table として扱い、UT-04 正本 6 テーブルには含めない | lock 実装は UT-09 の同期方式責務 |
| 監査ログ | `audit` / `audit_log` | `audit_logs` | UT-21 audit hook と命名統一 |
| primary key | `id` / `response_id` 混在 | `id`（surrogate）+ `response_id`（business unique） | Sheets の Form response ID を business key 化 |
| timestamp | `createdAt` / `created_at` | `created_at` / `updated_at`（D1 は snake_case） | TS 側で camelCase 変換は repository 層で実施 |

### 型定義（schema-as-source-of-truth）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| schema 正本 | DDL / TS 型 / Zod スキーマ / マッピング表で複数定義 | `migrations/*.sql` を唯一正本、TS 側は `apps/api/src/db/schema.ts` で再 export のみ | 不変条件 #1（schema を mapper 層に閉じる）と整合 |
| 共通カラム | 各テーブルで個別記述 | `id INTEGER PRIMARY KEY AUTOINCREMENT` / `created_at TEXT NOT NULL DEFAULT (datetime('now'))` / `updated_at TEXT NOT NULL DEFAULT (datetime('now'))` を「共通カラムテンプレ」として index.md に列挙 | DDL 重複削減 |
| 日時型 | `DATETIME` / `TIMESTAMP` 混在 | `TEXT` (ISO 8601 UTC) で統一 | SQLite 制約 + 苦戦箇所メモと整合 |
| 真偽値 | `BOOLEAN` / `INTEGER 0/1` 混在 | `INTEGER` (0/1) + `CHECK (col IN (0,1))` | SQLite に BOOLEAN 型なし |
| consent flag | 各テーブルで再定義 | `public_consent` / `rules_consent` 命名で統一（不変条件 #2） | spec 不変条件 #2 と完全整合 |

### パス（migration / docs ディレクトリ整理）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| migration ファイル | `apps/api/migrations/` / `apps/api/src/migrations/` 混在 | 既存 `apps/api/migrations/0001_init.sql`〜`0006_admin_member_notes_type.sql` を維持し、次回追加は `0007_<verb>_<target>.sql` 以降 | wrangler.toml `migrations_dir` 規約 |
| schema TS 再 export | adhoc | `apps/api/src/db/schema.ts` | repository 層からの import 単一経路 |
| マッピング表 | 各 Phase で再記述 | `outputs/phase-02/sheets-d1-mapping.md` を単一正本、他 Phase はリンク参照のみ | 重複削減 |
| runbook | 各 Phase に分散 | `outputs/phase-05/implementation-runbook.md` を単一正本 | 適用手順の単一化 |

### Migration 番号規約

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| 番号フォーマット | `001_` / `0001_` / `20260429_` 揺れ | `0001_init.sql` 形式（4 桁ゼロ埋め） | wrangler 推奨 + 苦戦箇所メモと整合 |
| dev / production 整合 | 個別管理 | dev / production 共通の連番（環境差分は data 投入のみ） | 苦戦箇所「dev/main 間整合性管理」対策 |
| 命名規約 | snake_case / kebab-case 混在 | snake_case（`0002_add_audit_logs.sql`） | wrangler 慣習 |

## 重複コードの抽出箇所（共通 DDL 部品化）

| # | 重複候補 | 抽出方針 | 適用範囲 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | `created_at` / `updated_at` カラム | 「共通カラムテンプレ」として index.md に列挙、各 migration が文言コピーで再現（DDL は静的なため部品化は行わない） | 全テーブル | コピー元を index.md に固定 |
| 2 | `PRAGMA foreign_keys = ON;` | `0001_init.sql` 冒頭に 1 回のみ記述、後続 migration では原則不要（D1 が session 単位で評価） | 全 migration | 苦戦箇所「FK 制約デフォルト無効」対策 |
| 3 | index 命名規約 | `idx_<table>_<col>` 形式に統一、複合 index は `idx_<table>_<colA>_<colB>` | 全 index | 検索性確保 |
| 4 | UNIQUE 制約 | `response_id` / `email` 等の business key には必ず `UNIQUE` を付与 | member_responses 等 | 冪等性（UT-09 AC-3）の DB 側担保 |
| 5 | TS 側 schema 型 | `apps/api/src/db/schema.ts` で `export type MemberResponseRow = {...}` を一元定義、各 repository / mapper は import のみ | 全 repository | UT-09 phase-08 の `MemberRow` 共通化と整合 |
| 6 | マッピング表 | `outputs/phase-02/sheets-d1-mapping.md` を唯一正本とし、phase-03 / phase-04 / phase-05 は link のみ | 全 phase | DRY |

## navigation drift の確認

| チェック項目 | 確認方法 | 想定結果 |
| --- | --- | --- |
| artifacts.json `phases[*].outputs` と各 phase-XX.md の成果物 path 一致 | grep `outputs/phase-` | 完全一致 |
| index.md `Phase 一覧` 表の file 列と実ファイル名 | ls で照合 | 完全一致 |
| index.md `主要成果物` 表のパス | artifacts.json と突き合わせ | 完全一致 |
| phase-XX.md 内の他 phase 参照リンク | `../phase-YY.md` を全件確認 | リンク切れ 0 |
| 原典 unassigned-task への参照 | `docs/30-workflows/unassigned-task/UT-04-d1-schema-design.md` 実在確認 | 実在 |
| Skill reference path | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | 実在 |
| UT-09 への引き渡し path | `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/` 実在確認 | 実在 |

## 共通化パターン

- 命名: snake_case（DB） / camelCase（TS 変数） / PascalCase（型） / kebab-case（ファイル）の住み分けを徹底。
- schema-as-source-of-truth: `migrations/*.sql` を唯一正本、TS / マッピング表 / runbook はすべて参照のみ。
- 4条件は「価値性 / 実現性 / 整合性 / 運用性」の順序固定。
- consent キーは `public_consent` / `rules_consent` を **必ず** 使う（不変条件 #2）。
- AC ID は `AC-1`〜`AC-N` のハイフン区切りで全 Phase 統一。

## 削除対象一覧

- Phase 5/6 等で残った仮命名（例: `temp_members`、`debug_responses` 等）。
- `wrangler.toml` 内の不要 binding コメントアウト（実装フェーズで cleanup）。
- 旧 GAS prototype に由来する命名（`sheetData` / `formResponse` 直訳等）。
- 重複したマッピング表（phase-02 を残し、他は link 参照のみへ書き換え）。

## 実行手順

### ステップ 1: 命名揺れの洗い出し
- `grep -rn 'members\|member_responses\|responses' docs/30-workflows/ut-04-d1-schema-design/` を実行。
- 表記揺れを表に整理。

### ステップ 2: Before / After 比較テーブルの作成
- 4 区分（命名 / 型 / path / migration 番号）で記述。

### ステップ 3: 共通 DDL 部品化方針の特定
- 6 件以上の抽出候補を列挙、schema-as-source-of-truth 原則と整合確認。

### ステップ 4: navigation drift 確認
- artifacts.json と各 phase-XX.md の path を照合。
- リンク切れ 0 を確認。UT-09 への引き渡し path も含める。

### ステップ 5: outputs/phase-08/main.md に集約
- 上記すべてを 1 ドキュメントに統合。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | DRY 化済み命名・path を品質保証チェックリストの前提に使用 |
| Phase 10 | navigation drift 0 を GO/NO-GO の根拠に使用 |
| Phase 12 | system-spec-update-summary.md / documentation-changelog.md に反映 |
| UT-09 | 確定 schema（テーブル名・カラム名）を Sheets→D1 mapper の前提として引き渡し |
| UT-21 | `audit_logs` 命名を audit hook と共有 |

## 多角的チェック観点

- 価値性: DRY 化により Phase 5 migration 実装時の手戻り削減。
- 実現性: 共通 DDL 部品化が wrangler の migration 連番管理と矛盾しないか。
- 整合性: 不変条件 #1（schema 固定回避）、#2（consent キー統一）、#5（apps/api 内閉鎖）を維持。
- 運用性: 命名一貫性で runbook / log 検索性が向上。
- 認可境界: schema レベルでの PII カラム識別が後続 PII 暗号化判断の前提となる（Phase 9 で確認）。
- 無料枠: index 数の最適化で D1 storage 増を抑制。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 命名揺れ洗い出し | 8 | spec_created | grep 結果を表化 |
| 2 | 共通 DDL 部品化方針確定 | 8 | spec_created | 6 件以上 |
| 3 | マッピング定義 single-source 化 | 8 | spec_created | phase-02 を正本 |
| 4 | migration 番号規約統一 | 8 | spec_created | `0001_` 4 桁 |
| 5 | navigation drift 確認 | 8 | spec_created | リンク切れ 0 |
| 6 | outputs/phase-08/main.md 作成 | 8 | spec_created | 全項目集約 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | DRY 化結果（Before/After・共通 DDL 部品化・navigation drift） |
| メタ | artifacts.json | Phase 8 状態の更新 |

## 完了条件

- [ ] Before / After 比較テーブルが 4 区分（命名 / 型 / path / migration 番号）すべてで埋まっている
- [ ] 共通 DDL 部品化箇所が 6 件以上列挙されている
- [ ] navigation drift（artifacts.json / index.md / phase-XX.md / outputs path）が 0
- [ ] schema-as-source-of-truth 原則が明文化されている
- [ ] migration 番号規約（`0001_init.sql` 4 桁）で全 Phase 一致
- [ ] outputs/phase-08/main.md が作成済み

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `spec_created`
- 成果物が `outputs/phase-08/main.md` に配置予定
- Before / After が 4 区分で網羅
- 共通 DDL 部品化 6 件以上
- navigation drift 0
- artifacts.json の `phases[7].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 9 (品質保証)
- 引き継ぎ事項:
  - DRY 化済みの命名・path 表（Phase 9 free-tier 見積もり / PII 識別の前提として参照）
  - 共通 DDL 部品化一覧（Phase 9 storage 見積もりで考慮）
  - schema-as-source-of-truth 原則の維持
  - navigation drift 0 状態の維持（Phase 9 link 検証で再確認）
- ブロック条件:
  - Before / After に空セルが残る
  - navigation drift が 0 にならない
  - schema 正本が複数箇所に分散している
