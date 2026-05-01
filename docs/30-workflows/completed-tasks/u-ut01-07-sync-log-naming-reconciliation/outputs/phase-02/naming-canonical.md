# canonical 命名決定

| 項目 | 値 |
| --- | --- |
| 作成日 | 2026-04-30 |
| 状態 | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| 対応 AC | AC-1 |

## 1. 候補 3 案

### 案 A（推奨・採択）: 物理を canonical 化、論理を概念名に降格

- 物理 `sync_job_logs`（ledger）+ `sync_locks`（lock）を canonical 名として固定
- UT-01 ドキュメント上の `sync_log` は「論理概念用語」として降格し、言及時は注釈（"= 物理 `sync_job_logs` + `sync_locks`"）を必須化
- 既存物理 `apps/api/migrations/0002_sync_logs_locks.sql` は **改変なし**

### 案 B（却下）: 論理 `sync_log` を canonical 化、物理 2 テーブルを単一 `sync_log` テーブルへ統合 rename + データ移行

- 物理 2 テーブルを 1 テーブルに統合 → ledger と lock の責務が混在し、stale lock 検出ロジックの SQL が複雑化
- 本番 D1 に対する table rename + データ移行 → rollback 不能リスク

### 案 C（案 A に統合）: 論理を概念名降格 + 物理を canonical 化

- 実質案 A と同義（論理が概念名であり物理が canonical という結論が同じ）。本検討では案 A に統合し独立採否は行わない

## 2. 4 軸評価

| 軸 | 案 A（推奨） | 案 B（却下） |
| --- | --- | --- |
| 破壊性 | **PASS（破壊性ゼロ）** ─ 既存物理を改変しない | **MAJOR** ─ 本番 table rename + データ移行が必要、rollback 不能リスク |
| 実装コスト | **PASS（docs のみ）** ─ Markdown 更新のみ | **MAJOR** ─ migration 追加 + UT-09 ジョブコード書き換え + 監査ログ整合性検証 |
| 監査連続性 | **PASS（連続性 100%）** ─ ledger / lock データそのまま継続 | **MAJOR** ─ rename / 統合過程でログ ID 系列が変わり監査連続性が壊れる |
| rollback 容易性 | **PASS（rollback 不要）** ─ docs revert のみ | **MAJOR** ─ 逆 migration が複雑、本番データ巻き戻し困難 |
| 概念純度 | MINOR ─ 物理 2 分離が論理 1 より概念的に重い | PASS ─ 単一概念に整合 |

## 3. 採択結論

**案 A を採択する。**

### 採択理由

1. **破壊性ゼロ**: 既存 `apps/api/migrations/0002_sync_logs_locks.sql` を read-only として保護でき、本番稼働中の D1 への影響がゼロ
2. **監査連続性 100%**: `sync_job_logs.run_id` / `sync_locks.id` の主キー系列が継続するため、過去ログとの突合が可能
3. **rollback コスト最小**: docs-only のため、決定を取り消す場合も Markdown revert のみで済む
4. **直交性担保**: enum / retry / offset の決定（U-8 / U-9）に踏み込まずに命名のみを確定できる
5. **概念純度の MINOR は許容可**: 物理 2 分離は責務分離原則（ledger / lock の SRP）として正当化可能。論理 1 テーブル設計は概念モデル文書として残す

### 案 B 却下理由

破壊性 / 実装コスト / 監査連続性 / rollback 容易性 4 軸すべてで MAJOR。**データ消失リスクを伴うため明示却下**。

## 4. canonical 名宣言

| 概念 | canonical 物理名 | 文書内表記 |
| --- | --- | --- |
| 同期ジョブ実行ログ（ledger） | `sync_job_logs` | コード・migration・spec で本名のみ使用 |
| 同期 lock（二重実行防止） | `sync_locks` | 同上 |
| 論理単一概念（参考用） | `sync_log`（注釈付き） | UT-01 概念モデル文書のみで使用、初出時に "= `sync_job_logs` + `sync_locks`" を併記 |

## 5. 後続タスクへの宣言

- **UT-04**: 新規 migration を追加する場合、`sync_job_logs` / `sync_locks` 名を踏襲。新テーブル `sync_log` の CREATE は禁止
- **UT-09**: 実装で参照するテーブル名は `sync_job_logs` / `sync_locks` のみ
- **U-8 / U-9**: 本決定は命名のみで、enum 値・retry 値・offset 値は別タスクで決定
