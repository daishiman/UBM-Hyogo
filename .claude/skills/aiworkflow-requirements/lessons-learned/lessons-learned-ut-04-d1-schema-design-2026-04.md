# Lessons Learned — UT-04 D1 データスキーマ設計（2026-04-29）

> task: `ut-04-d1-schema-design`
> 関連 spec: `references/database-schema.md`（DDL 同期テンプレ章）/ `references/deployment-cloudflare.md`（D1 migration 章）
> 関連 LOGS: 2026-04-29 entry
> 親仕様: `docs/30-workflows/ut-04-d1-schema-design/index.md` / `outputs/phase-12/skill-feedback-report.md`

## 教訓一覧

### L-UT04-001: spec_created タスクは workflow root を completed にしない
- **背景**: UT-04 は実 DDL を `apps/api/migrations/` に投入しない設計のみのタスク（taskType=implementation × workflow_state=spec_created × docsOnly=true）。完了とみなして workflow root を `completed` にすると、後続の実装 PR と二重 close されて ledger の整合が崩れる。
- **教訓**: spec PR は `workflow_state=spec_created` / `docsOnly=true` で merge し、実装 PR が別 wave で `implemented` へ昇格する 2 段階運用を徹底する。phase-12-pitfalls.md の三併存ケースとしても明文化済み。
- **適用**: 設計タスク（D1 schema / API endpoint / shared 型契約）を作る時は Phase 1 の段階で 3 メタの併存を確認し、Phase 12 まで `spec_created` を据え置く。

### L-UT04-002: 既存 migration から current canonical schema を抽出し、新規 DDL は重複追記しない
- **背景**: `database-schema.md` に既存正本があり、UT-04 はそれを再利用する spec タスク。正本に追加 DDL を重複追記すると drift が発生する。
- **教訓**: Step 1-A で「既存正本として参照、本 PR では追加 DDL を重複追記しない」と verified ステータスで記録する。実 DDL は実装 PR で migration ファイルに投入し、本 reference は DDL 同期テンプレ節（v1.3.0 で追加）の雛形に沿って後続 PR で更新する。
- **適用**: Step 1-A のチェック表に `verified` 状態を必ず採番し、N/A や deferred も明示する。

### L-UT04-003: 旧 `members` と current `member_responses` の表記 drift を grep evidence 化する
- **背景**: UT-04 で current canonical 6 テーブル（`member_responses` / `member_identities` / `member_status` / `response_fields` / `schema_diff_queue` / `sync_jobs`）を確定したが、UT-09 関連コード・ドキュメントには旧 `members` 表前提の箇所が残っている。表記だけに見えて、mapper の upsert 先を誤ると同期データが二重化する。
- **教訓**: 「legacy / current」の境界を quick-reference に明示し、UT-09 Phase 8 / Phase 11 前に grep 結果を evidence 化する未タスク（`task-ut-09-member-responses-table-name-drift.md`）を立てる。
- **適用**: schema 変更時は legacy / current / transition の 3 区分を表で分離。grep evidence は smoke log に転記する。

### L-UT04-004: `sync_jobs` / `sync_job_logs` / `sync_locks` の責務分離を ADR 化する
- **背景**: UT-04 の正本 6 テーブルには `sync_jobs` が含まれるが、既存 migration には `sync_job_logs` / `sync_locks` も存在する。「legacy」とだけ書くと、実 DB に存在するテーブルの扱いが曖昧になる。
- **教訓**: 排他制御（`sync_locks`）/ 実行単位（`sync_jobs`）/ 履歴（`sync_job_logs`）の 3 責務を分類し、UT-09 owned transition tables として明示する。書き込み先は UT-09 で一意に決め、読み取り互換が必要なら view / adapter を定義する。
- **適用**: 未タスク `task-ut-04-sync-ledger-transition-plan.md` で transition plan を ADR 化してから実装 PR を切る。

### L-UT04-005: D1（SQLite）の TEXT 型で DATETIME / JSON を扱う場合は mapper 層の validation を正本契約と接続する
- **背景**: D1 は SQLite なので DATETIME / JSON は実質 TEXT として保存される。DB の型制約だけでは検証できない値が多く、mapper / repository 層の validation が正本 schema とずれると、API → D1 間で silent な型崩れが起きる。
- **教訓**: DATETIME は ISO 8601 TEXT に統一し、Zod schema を正本として apps/api の mapper と packages/shared の契約型を共通化する（DDL→Zod 自動派生 or 手書き同期は ADR で決める）。
- **適用**: 未タスク `task-ut-04-shared-zod-codegen.md` で生成方式 vs 手書き方式の比較 ADR を作る。`packages/shared` が DB 実装詳細を持ちすぎないよう apps/api 所有の DB schema との境界を明示する。

### L-UT04-006: seed / fixture と本番データ移行を runbook で完全分離する
- **背景**: Phase 11 smoke では合成値で DB 制約を確認するが、seed と本番データ移行を混同すると個人情報の混入や重複投入につながる。
- **教訓**: fixture は `example.com` / `R-TEST-*` のみ許可。idempotent seed は `INSERT OR IGNORE`、検証用一時データは cleanup 手順を必須化する。
- **適用**: 未タスク `task-ut-04-seed-data-runbook.md` で dev / staging / production それぞれの seed 規約と禁止事項を runbook 化する。

### L-UT04-007: `PRAGMA foreign_keys = ON` は session 単位で OFF が既定なので migration 先頭 + 起動時 health check で常時保証する
- **背景**: D1 の SQLite は session ごとに `PRAGMA foreign_keys` が OFF で開始する。migration 中に有効化を忘れると FK 制約が無効化されたまま DDL が通り、参照整合性が壊れる。
- **教訓**: migration 先頭で `PRAGMA foreign_keys = ON;` を宣言し、apps/api 起動時 health check で同 PRAGMA の有効性を検証する。`database-schema.md` の運用メモにも明記済み。
- **適用**: D1 系の新規 migration / health check 追加時はこの 2 点をチェックリスト化する。

## 申し送り先

- 未タスク: `task-ut-04-seed-data-runbook.md` / `task-ut-04-shared-zod-codegen.md` / `task-ut-04-sync-ledger-transition-plan.md` / `task-ut-09-member-responses-table-name-drift.md`
- 下流: UT-09（Sheets→D1 同期実装）/ UT-06（本番デプロイ）/ UT-21（sheets-d1-sync-endpoint-and-audit）/ UT-26（backup 自動化）
- skill 改善: `task-specification-creator/references/phase-12-pitfalls.md`（三併存ケース集）/ `aiworkflow-requirements/references/database-schema.md`（DDL 同期テンプレ v1.3.0）
