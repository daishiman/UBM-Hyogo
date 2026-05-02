# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | UT-07B-FU-03 |
| Phase | 1 |
| 状態 | spec_created |
| taskType | requirements / operations / runbook |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #363（CLOSED） |

## 実行タスク

1. seed である `unassigned-task-detection.md` と上流 UT-07B / U-FIX-CF-ACCT-01 の完了状態を確認する。
2. `apps/api/migrations/0008_schema_alias_hardening.sql` の対象オブジェクトと運用境界（commit / PR / merge / ユーザー承認）を整理する。
3. runbook が満たすべき AC（preflight / apply / post-check / evidence / failure handling）を Phase 2 設計へ橋渡しできる粒度で確定する。
4. 要件レビュー思考法（システム系 / 戦略系 / 問題解決系）を適用し、4 条件評価で PASS を取る。

## 目的

UT-07B（schema alias hardening）の本番適用 SQL `apps/api/migrations/0008_schema_alias_hardening.sql` を、本タスク内では実行せず、**承認ゲート付き runbook 文書として正式化する** ための要件を確定する。

production D1 (`ubm-hyogo-db-prod`) への migration 適用は、commit / PR / merge / ユーザー明示承認の 4 段階を経た後に runbook に従って別タスクで運用実行する。本タスクの責務は **「適用前 / 適用 / 適用後 / 証跡 / 失敗時」の 5 セクションを過不足なく定義した runbook 仕様** を作ることに限定する。

> 本 Phase の成果物では production apply コマンドを「実行する例」ではなく「runbook 上で実行を想定するコマンド」として扱う。本 Phase および以降の仕様作成 Phase 内で `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production` を実走させない。

## 参照資料

- `index.md`
- `artifacts.json`
- seed: `../completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/unassigned-task-detection.md`
- 上流: `../completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/implementation-guide.md`
- 関連 runbook: `../completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-05/migration-runbook.md`
- 関連 rollback: `../completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-05/rollback-runbook.md`
- 対象 SQL: `apps/api/migrations/0008_schema_alias_hardening.sql`
- `scripts/cf.sh`（wrangler ラッパ。`op run` + `ESBUILD_BINARY_PATH` + `mise exec`）
- `apps/api/wrangler.toml`（`[env.production]` D1 binding）
- Cloudflare D1 migrations リファレンス

## 入力

- 対象 SQL: `apps/api/migrations/0008_schema_alias_hardening.sql`
  - `schema_aliases` table 作成
  - `idx_schema_aliases_revision_stablekey_unique`（revision-scoped stableKey UNIQUE index）
  - `idx_schema_aliases_revision_question_unique`（alias question UNIQUE guard）
  - `schema_diff_queue.backfill_cursor` カラム追加（resumable back-fill）
  - `schema_diff_queue.backfill_status` カラム追加
- 対象 DB: `ubm-hyogo-db-prod`（`wrangler.toml` の `[env.production]` で binding）
- 上流タスク完了状態:
  - UT-07B-schema-alias-hardening-001（実装・staging 適用済み）
  - U-FIX-CF-ACCT-01（production Token のスコープ最小化済み）
- 運用ラッパ: `scripts/cf.sh`（直 `wrangler` 禁止）

## P50 チェック（Phase 1 前提確認）

| 確認項目 | 結果 | 対応 |
| --- | --- | --- |
| 対象 SQL が main にマージ済みか | No（UT-07B branch 内に存在、本 runbook タスクとは別 PR でマージ予定） | runbook では「マージ後・ユーザー承認後にのみ apply」を境界として固定 |
| 上流（UT-07B / U-FIX-CF-ACCT-01）が完了済み | Yes | production Token / migration SQL の双方が前提条件として揃う |
| GitHub Issue #363 が OPEN | No（CLOSED） | seed が未消化のため `spec_created` として開始。Phase 12 で再 open or 新規 Issue 起票判断 |
| production apply を本タスクで実行するか | No | 本 Phase 含むすべての仕様 Phase で実走させない |

`implementation_mode = "new"` を採用する（既存 runbook はあるが、本番 apply 専用の承認ゲート付き派生として新規作成）。

## 真の論点

> `apps/api/migrations/0008_schema_alias_hardening.sql` を production D1 に適用する作業を、(a) CI による完全自動化、(b) 口頭運用での手動適用、(c) runbook + 承認ゲート + evidence 保存、のいずれの形式で固定するか。安全性・監査可能性・ユーザー承認境界・rollback 可能性のうち、本プロジェクトのフェーズに照らして最も適切な形式は何か。

**根本原因（潜在）**:

- D1 の DDL（`CREATE TABLE` / `CREATE UNIQUE INDEX` / `ALTER TABLE ADD COLUMN`）は idempotent ではなく、二重適用や既存データ衝突で失敗する。失敗状態の検知と中断判断は **コマンド出力を人間が見て判断する** 工程が不可欠。
- production D1 への apply は不可逆性が高く（rollback には別 migration が必要）、CI による完全自動化は「マージ即適用」となり、ユーザー承認境界が消失する。
- 直 `wrangler` 実行は `op` 経由の Token 注入と `esbuild` バージョン解決を自前で行う必要があり、operational error の温床になる。`scripts/cf.sh` 経由のみを許可する境界が必要。

**派生論点**:

- preflight で `migrations list` だけで十分か、`PRAGMA table_info` まで取るか
- evidence の保存先（`outputs/phase-11/` 配下）と保存項目（commit SHA / migration hash / 出力 / 時刻 / 承認者 / 対象 DB）
- 失敗時に runbook 内で「停止」のみとするか、limited rollback まで定義するか
- back-fill cursor / status カラムの post-check を read-only に限定する境界

## 要件レビュー思考法

### システム系（System Thinking）

- production D1 は「会員データ正本」を保持する境界資源。runbook は CI/CD と D1 の境界に置く **人間判断ゲート** に相当し、自動化と手動運用の中間項として機能する。
- preflight → apply → post-check の 3 段は、典型的な「観測 → 介入 → 検証」サイクルであり、failure handling は介入の不可逆性を吸収する fail-safe レイヤとなる。

### 戦略系（Strategic Thinking）

- MVP 段階では「手順の明文化と人間承認」を優先し、自動化（CI で `migrations apply` を直接呼ぶ）は将来課題化する。漏洩・誤適用時のブラスト半径より、適用判断のトレーサビリティ確保を優先する。
- runbook は **再利用可能な雛形** として将来の他 migration（0009, 0010 …）にも流用可能な構造で書く（章立てを共通化）。

### 問題解決系（Problem Solving）

- 「DDL の冪等性が保証されない」制約に対し、preflight で `migrations list` を必ず実行し、未適用判定が PASS した場合のみ apply に進む staged-gate を設計する。
- 「Token 値・Account ID 値が evidence に混入するリスク」に対し、Phase 6 / Phase 11 で grep verification を必須化し、`set -x` 系デバッグ出力を禁止する運用ルールを runbook 内に明記する。

## 依存関係・責務境界

- **本タスクの責務境界**: production migration apply runbook の **文書化のみ**。runbook の実走は本タスクの範囲外。
- **触らない境界**:
  - `apps/api/migrations/0008_schema_alias_hardening.sql` の SQL 内容（UT-07B で確定済み）
  - `wrangler.toml` の binding 定義
  - production D1 の実データ
  - Token / Account ID の値（参照のみ・記録しない）
- **状態所有権**:
  - SQL 内容の正本: UT-07B-schema-alias-hardening-001
  - production D1 の状態: Cloudflare D1（実体）が正本、runbook は手順の記述
  - runbook 文書の正本: 本タスク `outputs/phase-05/main.md`
  - 実適用 evidence: 別タスク（runbook 実走タスク）が所有

## 価値とコストの均衡

| 項目 | 内容 |
| --- | --- |
| 初期価値 | production migration の安全実行手順を文書化し、commit/PR/merge/ユーザー承認の境界を固定。誤適用 / 二重適用 / DB 取り違えの防止 |
| 導入コスト | runbook 5 セクションの仕様化と Phase 5 本体作成。実 apply は別タスクで運用実行 |
| 副次コスト | 将来の migration 増加時に runbook 雛形を都度更新する保守コスト |
| トレードオフ | 完全自動化（CI で apply）に比べ runbook 実走の手間が増えるが、ユーザー承認境界とトレーサビリティを得る |

## 不変条件 #5 の影響評価

不変条件 #5「D1 への直接アクセスは `apps/api` に閉じる」は、**ランタイムのデータアクセス境界** に関する規定であり、CI/CD およびオペレーション系の `wrangler d1 migrations apply` は対象外である。`scripts/cf.sh d1 migrations apply` は `apps/api/migrations/` 配下の SQL を Cloudflare D1 に適用する **運用コマンド** であり、`apps/web` から D1 を直接呼ぶ経路は本タスクで一切作らない。

post-check で実行する `SELECT name FROM sqlite_master ...` および `PRAGMA table_info(schema_diff_queue)` も、運用検証用の read-only クエリであり、ランタイム経路ではない。よって **不変条件 #5 は侵害しない** ことを宣言する。

## 受入条件マッピング

| AC | 確認方法（本 Phase での要件確定） |
| --- | --- |
| AC-1 | runbook 本体が `outputs/phase-05/main.md` として作成される要件を Phase 2 設計に引き渡す |
| AC-2 | commit / PR / merge / ユーザー承認の 4 ゲート境界を Phase 2 「承認ゲート設計」で固定する |
| AC-3 | 対象オブジェクト 5 件（table 1 + index 2 + column 2）を Phase 2 入力資料として列挙する |
| AC-4 | preflight に `migrations list` と未適用判定を含める要件を Phase 2 へ |
| AC-5 | apply コマンド `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production` と期待 exit=0 を Phase 2 へ |
| AC-6 | post-check に `sqlite_master` 検査 + `PRAGMA table_info(schema_diff_queue)` の 2 系を Phase 2 へ |
| AC-7 | evidence 保存項目（コマンド・出力・時刻・承認者・対象 DB・migration hash / commit SHA）を Phase 2 へ |
| AC-8 | failure handling 4 ケース（二重適用 / UNIQUE 衝突 / DB 取り違え / ALTER TABLE 失敗）を Phase 2 / Phase 6 へ |
| AC-9 | 「本タスク内では実行しない」境界を本 Phase の「真の論点」「責務境界」「P50」で明記 |
| AC-10 | post-check は read / dryRun のみ・destructive smoke は別承認に分離する原則を本 Phase で宣言 |
| AC-11 | 本ファイル末尾「4 条件評価」で PASS を記録 |
| AC-12 | Token 値・Account ID 値・OAuth トークン値の記録禁止を本 Phase で明記し Phase 6 / Phase 11 に引き継ぐ |

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | seed (`unassigned-task-detection.md`)、上流（UT-07B / U-FIX-CF-ACCT-01）、index.md の責務境界が排他で重複なし |
| 漏れなし | PASS | preflight / apply / post-check / evidence / failure handling の 5 セクションが AC-1〜AC-12 を網羅 |
| 整合性 | PASS | `scripts/cf.sh` 運用ルール、`apps/api/wrangler.toml` の `[env.production]` binding、Cloudflare D1 migrations 仕様と一致 |
| 依存関係整合 | PASS | 上流 UT-07B / U-FIX-CF-ACCT-01 が完了済み。下流（runbook 実走タスク）は本タスク完了後に着手する直列依存が成立 |

## 完了条件

- [ ] 対象 SQL の 5 オブジェクトが Phase 2 へ受け渡せる粒度で列挙されている
- [ ] runbook 5 セクションの責務が要件として確定している
- [ ] 「本タスクで production apply を実行しない」境界が宣言されている
- [ ] 不変条件 #5 への影響なしが宣言されている
- [ ] 4 条件評価が PASS で記録されている

## 成果物

- `outputs/phase-01/main.md`

## 統合テスト連携

NON_VISUAL runbook formalization のため統合テスト実行は行わない。実 production apply と runtime evidence は `task-ut-07b-fu-04-production-migration-apply-execution.md` に委譲する。
