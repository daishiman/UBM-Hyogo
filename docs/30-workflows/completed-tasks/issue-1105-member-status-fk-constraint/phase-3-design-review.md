# Phase 3 — 設計レビュー（ゲート）

> Phase 4 へ進めるかを判定する。判定: **PASS（Phase 4 へ進行可）**

## 3.1 要件レビュー思考法（3 系統）

### システム系（因果・境界・状態所有権）

- **真の論点**: 「orphan を DB レベルで構造的に禁止する単一ガードが無い」。親タスクの止血（backfill + `ensureMemberStatusRow`）はアプリ／データ層の予防であり、DB 自身の不変条件強制ではない。
- **強化ループ**: ingest 経路の漏れ → orphan 発生 → 詳細/status 404 → 手動 backfill → また漏れ（FK 不在で再発余地が残る）。
- **バランスループ**: FK 制約導入 → DB が orphan INSERT を拒否 → 経路漏れがあっても orphan が物理的に発生しない（再発ループを構造的に遮断）。
- **状態所有権**: 参照整合性の所有権を「アプリ層（`ensureMemberStatusRow`）」から「DB 層（FK）」へ最下層に移し、多層防御を完成させる。責務境界の混在なし（作成経路統一は followup-001 に分離）。

### 戦略・価値系

- **価値**: orphan 起因の admin 404 再発を DB レベルで恒久遮断。コスト最大の部品は「SQLite テーブル再構築 + D1 PRAGMA 検証」。
- **トレードオフ**: 再構築は DROP/RENAME を伴うため移行リスクがある。全カラム明示 INSERT + 回帰テスト + 冪等性で緩和。
- **初回価値 vs 将来層**: 初回 = FK 導入 + 検証。将来層（他テーブル FK・作成経路統一）は明示的にスコープ外。

### 問題解決系

- **優先順位**: 親タスクで止血済みのため優先度 low。ただし「予防の予防（多層防御の最下層）」として価値は明確。
- **仮説**: D1 が PRAGMA foreign_keys を接続単位で尊重する → test で実証 + runbook 記録で補完。

## 3.2 4 条件評価

| 条件 | 判定 | 根拠 |
|------|------|------|
| 価値性 | PASS | orphan 再発の DB レベル恒久遮断。誰の（admin 運用者の）どのコスト（404 再発・手動 backfill）を下げるか明確 |
| 実現性 | PASS | migration 1 + test 1 で 1 サイクル完了可能。再構築パターンは SQLite 標準手法 |
| 整合性 | PASS | 責務境界（FK = DB 層 / 作成経路統一 = followup-001）が分離。DEFAULT 値・INDEX・データ移行が 0002 と整合 |
| 運用性 | PASS | 冪等 migration / sequence guard / D1 PRAGMA runbook で導入後運用が破綻しない |

## 3.3 設計の妥当性チェック

| 項目 | 確認 |
|------|------|
| migration 番号 | 0026（0025 backfill の後・unique prefix・sequence-exceptions 編集不要） |
| 順序依存 | 0025（orphan 解消）→ 0026（FK 導入）を番号で保証。AC-5 |
| INDEX 再作成漏れ | `idx_member_status_public` を SQL §4 で再作成（AC-9）。**Phase 2 で具体化済み** |
| データ移行安全性 | 全カラム明示 INSERT + 移行前後の行数/全カラム比較 test（AC-3） |
| 冪等性 | `CREATE INDEX IF NOT EXISTS` + test で 2 回適用検証（AC-4） |
| D1 PRAGMA リスク | test（in-memory）+ runbook（本番 binding）の二段で検証（AC-6） |
| apps/web 非接触 | 対象は apps/api/migrations のみ（AC-8） |

## 3.4 リスクと緩和（設計時点）

| リスク | 緩和 |
|--------|------|
| 再構築でデータ損失 | 全カラム明示 INSERT・移行前後比較 test・冪等再適用 test |
| D1 が PRAGMA を尊重しない | schema 宣言 + `ensureMemberStatusRow` 多層防御へフォールバック・runbook 記録 |
| INDEX 取りこぼし | Phase 2 §2.2 SQL §4 で再作成を明文化・AC-9 でテスト |
| 0025 未適用で FK 違反 | 番号順序で保証・移行前 orphan ゼロ確認 |

## 3.5 判定

**PASS** — 設計は 4 条件を満たし、再構築 SQL 骨子・PRAGMA 検証・INDEX 再作成・順序依存がすべて明確。Phase 4（テスト作成）へ進行する。
