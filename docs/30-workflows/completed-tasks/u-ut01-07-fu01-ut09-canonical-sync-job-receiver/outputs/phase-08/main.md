# Phase 8 成果物: ドキュメントリファクタリング（DRY 化 / 構成最適化）

## 概要

本タスク（UT-09 canonical sync job implementation receiver / U-UT01-07-FU01）は、UT-09 同期ジョブ実装に対し canonical 名 `sync_job_logs` / `sync_locks` の採用を強制する「受け皿確定」スコープである。Phase 1〜7 で確定した以下の設計要素を 1 ドキュメントに統合し、Phase 9（静的検証 + CI gate）と Phase 10（Go/No-Go）が「単一正本を読めば判定できる」状態を確立する。

- canonical 名定義の単一正本化（コード側）
- 必須参照リストの単一正本化（docs 側）
- grep ガード script の一本化（運用側）
- aiworkflow-requirements `database-schema.md` との二重記述検出
- 重複検出 grep 戦略 5 パターン

UT-09 受け皿採択 path（確定済み）: `docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md`

親タスク Phase 2 正本 4 ファイル（絶対パス）:

- `docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/naming-canonical.md`
- `docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/column-mapping-matrix.md`
- `docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/backward-compatibility-strategy.md`
- `docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/handoff-to-ut04-ut09.md`

---

## 1. Before / After 比較（4 区分）

### 1.1 canonical 名定義

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| 物理テーブル名リテラル | mapper / job / migration / docs に文字列 `'sync_job_logs'` / `'sync_locks'` が散在 | `apps/api/src/sync/canonical-names.ts` に `SYNC_JOB_LOGS_TABLE` / `SYNC_LOCKS_TABLE` を `as const` で集約。UT-09 mapper / job 実装はここからのみ import 参照する | 単一正本化により grep 検出容易・将来の rename も const 1 箇所で完結 |
| 概念名 `sync_log` | コード中に物理テーブル名として出現する余地（旧揺れ） | constants ファイル不採用・docs 中の概念注釈付き表記としてのみ存在 | AC-3（`sync_log` 物理化禁止）担保。CREATE/RENAME/DROP の発火経路を構造的に閉じる |
| migration 内テーブル名 | `apps/api/migrations/0002_sync_logs_locks.sql` で確定済 | 改変禁止・参照のみ（Read-only） | 既存実装尊重・UT-04 直交性維持 |
| const 名と物理 table 名の対応 | 暗黙 | `SYNC_JOB_LOGS_TABLE = 'sync_job_logs'` / `SYNC_LOCKS_TABLE = 'sync_locks'` を spec として明示 | UT-09 実装担当者が import 経路で迷わない |

### 1.2 必須参照リスト

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| 必須参照リスト本体 | UT-09 root / 本タスク root / 親 U-UT01-07 outputs に類似記述が分散 | 親 `outputs/phase-02/` 配下 4 ファイルを SSOT とし、UT-09 root と本タスク root からは相対 link 参照のみ | 二重正本化排除・親採択ロジックを再議論しない |
| UT-09 root からの参照 | テキスト言及のみ | UT-21 receiver path に「Required Reading」節を設け、SSOT 4 ファイルを明示 link 参照 | trace 容易化・UT-09 着手時の参照漏れ 0 |
| 本タスクからの参照 | phase-XX.md ごとに記述揺れ可能性 | 全 phase で同一 SSOT を参照する規約 | navigation drift 0 |

### 1.3 grep ガード

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| canonical 名違反検出 script | UT-09 PR 用 / FU01 PR 用 / aiworkflow drift 用で script が分かれる懸念 | `scripts/check-canonical-sync-names.sh` 1 本に集約し、3 用途で再利用 | 重複排除・保守容易化・検出ロジック一元化 |
| 検出対象パターン | 各所で表記揺れ | 5 パターン固定（後述 §3） | 機械可読化・CI gate / pre-commit hook 共通化 |
| 呼び出し経路 | 個別実装 | pre-commit hook（薄いラッパー）/ CI workflow / 手動 smoke の 3 経路すべて同一 script | DRY 原則徹底 |

### 1.4 aiworkflow-requirements 二重記述

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| schema 定義の正本 | migration と `.claude/skills/aiworkflow-requirements/references/database-schema.md` 両方に DDL 詳細を持つ可能性 | migration を正本・`database-schema.md` は canonical 名 + migration 参照のみに縮約 | 二重記述排除・migration を SSOT に固定 |
| canonical 名言及 | 旧揺れ表記混入の可能性 | `sync_job_logs` / `sync_locks` のみ採用、`sync_log` は概念注釈付き | drift 検出基準を明示 |
| mirror parity | `.agents` 側との非同期可能性 | 更新時は Phase 12 で `.agents` 同期発火を義務化 | mirror drift 0 |

---

## 2. 重複記述の集約方針（5 件）

| # | 重複対象 | 集約先（単一正本） | 他箇所の扱い |
| --- | --- | --- | --- |
| 1 | canonical 名リテラル文字列 | `apps/api/src/sync/canonical-names.ts`（UT-09 で実装発火） | UT-09 mapper / job は import 経由で参照のみ。docs では const 名で言及 |
| 2 | 必須参照リスト | 親 `docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/` 配下 4 ファイル | UT-09 root / 本タスク root からは相対 link 参照のみ |
| 3 | grep ガード script | `scripts/check-canonical-sync-names.sh`（UT-09 で実装発火） | UT-09 PR / FU01 PR / CI gate / pre-commit hook の 4 経路で同一 script を呼び出し |
| 4 | 物理テーブル DDL | `apps/api/migrations/0002_sync_logs_locks.sql`（既存・改変禁止） | docs / aiworkflow-requirements は migration を相対 link 参照 |
| 5 | `sync_log` 物理化禁止ルール | 本タスク `outputs/phase-02/code-scope.md` および `outputs/phase-02/orthogonality-checklist.md` | UT-09 root / aiworkflow-requirements からは link 参照のみ。grep ガードパターン #2 / #3 で機械検出 |

---

## 3. 重複検出 grep 戦略（5 パターン）

`scripts/check-canonical-sync-names.sh` 内に組み込む検出パターン。Phase 9 の静的検証ゲートおよび Phase 11 manual-smoke-log で再実行可能。

| # | 検出パターン | コマンド例 | 期待値 |
| --- | --- | --- | --- |
| 1 | 物理テーブル文字列の constants 外出現 | `rg -n "['\"]sync_job_logs['\"]\|['\"]sync_locks['\"]" apps/ --glob '!apps/api/src/sync/canonical-names.ts' --glob '!apps/api/migrations/**'` | 0 件 |
| 2 | `sync_log` を物理テーブル扱いするコード | `rg -n "CREATE\s+TABLE\s+sync_log\b\|FROM\s+sync_log\b\|INTO\s+sync_log\b" apps/` | 0 件 |
| 3 | 物理テーブル CREATE/RENAME/DROP（既存 migration 以外） | `rg -n "(CREATE\|RENAME\|DROP)\s+TABLE\s+(sync_log\|sync_logs\|sync_job_logs\|sync_locks)" apps/api/migrations/ --glob '!0002_sync_logs_locks.sql'` | 0 件 |
| 4 | 旧揺れ表記（複数形 vs 単数形混在） | `rg -n "\bsync_logs\b\|\bsync_lock\b" apps/ docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/` | 0 件（canonical は `sync_job_logs` / `sync_locks`） |
| 5 | aiworkflow-requirements 二重 DDL | `rg -n "CREATE\s+TABLE" .claude/skills/aiworkflow-requirements/references/database-schema.md` | 0 件（migration 参照のみ） |

> exit code 仕様: 全 5 パターンで違反 0 件なら `exit 0`、いずれかで 1 件以上検出されれば `exit 1`。違反行は stderr に出力。

---

## 4. canonical 名 const 設計（spec）

`apps/api/src/sync/canonical-names.ts` の export 仕様（実装は UT-09 で発火）:

```ts
// apps/api/src/sync/canonical-names.ts (UT-09 で実装発火・本タスクは spec 確定のみ)
export const SYNC_JOB_LOGS_TABLE = 'sync_job_logs' as const;
export const SYNC_LOCKS_TABLE = 'sync_locks' as const;

export type SyncCanonicalTable =
  | typeof SYNC_JOB_LOGS_TABLE
  | typeof SYNC_LOCKS_TABLE;
```

- 配置先: `apps/api/src/sync/` （不変条件 #5「D1 access apps/api 内閉鎖」に整合）
- import 規約: UT-09 の mapper / job 実装は本ファイルからのみ canonical 名を参照する
- 検証: grep パターン #1 で constants ファイル外のリテラル出現を機械検出

---

## 5. grep ガード script 仕様（spec）

`scripts/check-canonical-sync-names.sh` の入出力仕様（実装は UT-09 で発火）:

| 項目 | 仕様 |
| --- | --- |
| 入力 | なし（リポジトリ root を作業ディレクトリとして実行） |
| 出力 | 違反行を stderr に出力（`rg -n` 形式: `path:line:content`） |
| exit code | 違反 0 件で `0`、1 件以上で `1` |
| 依存 | `rg` (ripgrep), `bash` |
| 呼び出し経路 | (a) 手動 (b) `scripts/hooks/canonical-sync-names-guard.sh`（pre-commit）(c) `.github/workflows/verify-canonical-sync-names.yml`（CI） |

---

## 6. 削除対象

- UT-09 root / 本タスク root に散在する canonical 名リテラル文字列の重複記述 → const 名（`SYNC_JOB_LOGS_TABLE` / `SYNC_LOCKS_TABLE`）で言及する形式に置換。
- 必須参照リストの実体記述 → 親 SSOT への相対 link に置換。
- aiworkflow-requirements `database-schema.md` 内の `sync_job_logs` / `sync_locks` DDL 詳細（存在する場合）→ migration 参照形式に縮約。
- 旧揺れ表記 `sync_logs` / `sync_lock` の単独使用箇所 → canonical 名に置換。

---

## 7. 共通化パターン（3 層分担）

| 層 | 単一正本 | 役割 |
| --- | --- | --- |
| コード | `apps/api/src/sync/canonical-names.ts`（const） | プログラム内の物理テーブル名解決 |
| docs | 親 `outputs/phase-02/` 4 ファイル | 命名採択ロジックと参照ガイド |
| 物理 DDL | `apps/api/migrations/0002_sync_logs_locks.sql` | 実テーブル定義（改変禁止） |

grep ガード（`scripts/check-canonical-sync-names.sh`）はこの 3 層の境界違反を機械検出する横串の役割を持つ。pre-commit hook / CI gate / 手動 smoke / drift 検出の 4 経路で再利用される。

概念名 `sync_log` は docs 内の注釈付き表記のみ許容、コード中の物理テーブル名としての出現は禁止。

---

## 8. navigation drift 確認表

| チェック項目 | 確認方法 | 想定結果 | 担当 Phase |
| --- | --- | --- | --- |
| 本タスク phase-XX.md ↔ outputs link | grep 突き合わせ（`rg "outputs/phase-"` ）| 完全一致 | Phase 9 文書整合 |
| 親 U-UT01-07 SSOT への相対 link | 全 phase で実在確認（4 ファイル） | リンク切れ 0 | Phase 9 文書整合 |
| UT-09 receiver path（UT-21）からの参照 link | UT-21 root の Required Reading 節を確認 | 実在 | Phase 9 / Phase 12 |
| canonical-names.ts への import 設計記述 | UT-09 phase-05（実装計画）で言及 | 言及あり | UT-09 側で確認 |
| aiworkflow-requirements drift 対象 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` の実在 | 実在 | Phase 9 drift 実測 |
| `database-schema.md` drift 状態 | 親タスクで既に canonical 名で記述済（drift なし） | drift 0 | Phase 9 で追認 |

---

## 9. UT-09 / UT-04 / 親 U-UT01-07 への引き継ぎ事項

| 引き継ぎ先 | 内容 |
| --- | --- |
| UT-09（UT-21 receiver path） | (a) canonical-names.ts の const export 実装発火 (b) `scripts/check-canonical-sync-names.sh` 実装発火 (c) pre-commit hook + CI gate 実装発火 (d) 必須参照 4 ファイルの link 反映 |
| UT-04 | 既存 migration `0002_sync_logs_locks.sql` の改変禁止を継続的に尊重 |
| 親 U-UT01-07 | 採択された canonical 名（`sync_job_logs` / `sync_locks`）を継承するのみ。再議論しない |
| aiworkflow-requirements | `database-schema.md` は migration 参照形式を維持。drift 検出時は Phase 12 で doc-only 更新 + `.agents` mirror sync |

---

## 10. 完了条件チェック

- [x] Before / After 4 区分（canonical 名 / 必須参照 / grep ガード / aiworkflow 二重記述）が記述
- [x] 重複集約方針が 5 件列挙
- [x] 重複検出 grep 戦略が 5 パターン記述
- [x] navigation drift 表完備（drift 0 を想定）
- [x] canonical-names.ts / `scripts/check-canonical-sync-names.sh` の単一正本化方針を明文化
- [x] 既存 migration（`0002_sync_logs_locks.sql`）の改変計画が含まれていない（Read のみ）
- [x] 親 U-UT01-07 SSOT 4 ファイルへの参照経路を明示

→ Phase 9（品質保証）への進行可能。
