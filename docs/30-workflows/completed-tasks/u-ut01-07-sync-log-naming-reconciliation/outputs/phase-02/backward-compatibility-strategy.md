# 後方互換戦略 4 案比較

| 項目 | 値 |
| --- | --- |
| 作成日 | 2026-04-30 |
| 状態 | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| 対応 AC | AC-3 |

## 1. 4 案の概要

| 案 | 概要 |
| --- | --- |
| **案 1（推奨・採択）no-op** | 既存物理 `sync_job_logs` / `sync_locks` を canonical に固定。論理 `sync_log` は概念用語に降格。既存物理 migration / コードを一切変更しない |
| 案 2 view | `CREATE VIEW sync_log AS SELECT ... FROM sync_job_logs LEFT JOIN sync_locks ON ...` で論理単一テーブルを擬似提供 |
| 案 3 rename | `ALTER TABLE sync_job_logs RENAME TO sync_log` 等で物理側を論理名へ rename |
| **案 4（明示却下）新テーブル+移行** | `sync_log` を新規 CREATE TABLE + 既存データ移行 + 旧 `sync_job_logs` / `sync_locks` を DROP |

## 2. 4 軸評価マトリクス

| 軸 | 案 1 no-op | 案 2 view | 案 3 rename | 案 4 新テーブル+移行 |
| --- | --- | --- | --- | --- |
| 破壊性 | **PASS（ゼロ）** | MINOR（VIEW 追加 migration が必要） | MAJOR（本番 table rename） | **MAJOR（DROP TABLE 含む・データ消失リスク）** |
| 実装コスト | **PASS（docs のみ）** | MINOR（VIEW DDL + JOIN 設計） | MAJOR（rename + UT-09 全コード書き換え） | **MAJOR（CREATE + 移行 SQL + DROP + 検証）** |
| 監査連続性 | **PASS（連続性 100%）** | PASS（VIEW 経由で連続） | MINOR（rename 後の旧名参照リスク） | **MAJOR（ID 系列断絶・過去ログ参照不能）** |
| rollback 容易性 | **PASS（rollback 不要）** | PASS（VIEW DROP のみ） | MINOR（逆 rename 必要） | **MAJOR（バックアップ復元しか手段なし）** |

## 3. 採択結論

**案 1（no-op）を採択する。**

### 採択理由

1. **データ消失ゼロ**: 既存物理を一切触らないため、本番 D1 の監査ログ / lock 状態が完全保持される
2. **rollback コストゼロ**: docs revert のみで決定取消可能
3. **UT-04 / UT-09 の並列着手を阻害しない**: 既存物理がそのまま canonical のため、他タスクが migration 衝突に巻き込まれない
4. **「何もしない」を結論として明示することで rename 誘発を防止**: 本文書を UT-04 着手の前提条件にすることで、善意の rename 提案を構造的にブロック

### 案 2（view）却下理由

- VIEW 経由で論理単一を擬似提供できるが、UT-09 が VIEW 越しに INSERT できない（SQLite の updatable view 制約）。読み取り専用 VIEW のため実利が薄い
- 本タスクは命名 reconciliation であり、論理単一インターフェースの提供は本タスクのスコープ外

### 案 3（rename）却下理由

- 本番 D1 への ALTER TABLE RENAME は技術的には可能だが、既存 `apps/api/src/jobs/sync-sheets-to-d1.ts` の全コード書き換えが必要となり、本タスクのスコープ（docs-only）を逸脱
- rename 中の中断 → rollback 不能リスク

### 案 4（新テーブル+移行）明示却下理由

- **DROP TABLE を含むためデータ消失リスクが構造的に存在**
- 本番監査ログの ID 系列断絶により、過去ログとの突合が不能
- バックアップ復元以外に rollback 手段がない
- リスクと対策表（issue 本文）の「データ消失リスク」項目で**選択肢として検討しない**と明記済

## 4. データ消失なしの保証

採択案（案 1 no-op）は以下を保証する:

- [x] `apps/api/migrations/0002_sync_logs_locks.sql` を改変しない
- [x] 新規 migration を追加しない（追加要否判断は UT-04 へ委譲）
- [x] 既存 `sync_job_logs` / `sync_locks` のデータを保持
- [x] DROP TABLE を含む案を明示却下
- [x] 本タスク完了時の git diff は workflow docs + aiworkflow index 導線のみ（`apps/api/` / `apps/web/` / `packages/shared/` は非混入）

## 5. UT-04 への引き継ぎ

- 採択戦略 = no-op
- UT-04 が新規カラム追加（idempotency_key 等）を判定した場合は、**新規 migration として ADD COLUMN** で追加（既存 migration の改変は禁止 / forward-only migration 規約に従う）
- rename / DROP / 統合系の戦略は本タスクで明示却下済のため、UT-04 で再議論しない
