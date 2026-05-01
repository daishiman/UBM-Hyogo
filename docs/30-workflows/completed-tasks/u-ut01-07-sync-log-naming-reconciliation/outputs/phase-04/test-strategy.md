# Phase 4 成果物: 文書検証戦略（docs-only 縮約）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | U-UT01-07 / Issue #261 |
| Phase | 4（テスト作成 → docs-only 読み替え: 文書検証戦略） |
| 作成日 | 2026-04-30 |
| 状態 | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| Wave | 1 |

## 目的

Phase 2 で確定した canonical 命名・マッピング表・後方互換 4 案・直交性チェックリスト・引き継ぎ事項を、第三者が grep / Read のみで機械的に検証できる **7 項目の文書検証戦略** として固定する。コード / DDL 変更が無いため line/branch coverage は適用せず、文書不変条件の充足率を代替指標とする。

## 文書検証 7 項目（V-1〜V-7）

| # | 検証項目 | 目的 | 検証手段 | 合格条件 | AC trace |
| - | --- | --- | --- | --- | --- |
| V-1 | canonical 命名一意性 | `sync_log` / `sync_job_logs` / `sync_locks` の使い分けが新ドキュメント内で混同されないこと | `grep -rn "sync_log\b" docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/` で全出現箇所を抽出し、概念名 vs 物理名の判別可能性を目視 | 物理表記と概念表記の混同 0 件、採択 canonical 名（A: 物理寄せ / C: 概念降格）が一貫 | AC-1 |
| V-2 | マッピング表完全性 | UT-01 phase-02 sync-log-schema.md の論理 13 カラムが Phase 2 column-mapping-matrix.md に全件登場すること | column-mapping-matrix.md の table 行数を `grep -c '^| '` で計測、論理側 13 カラムと突合 | 13 カラム漏れ 0、判定空欄（物理対応 / 物理未実装 / 不要）0 | AC-2 |
| V-3 | 既存実装との整合 | 物理側で実装済みのカラム / index / 関数がマトリクス左欄に揃って記載されていること | `apps/api/migrations/0002_sync_logs_locks.sql` と `apps/api/src/jobs/sync-sheets-to-d1.ts` を Read / Grep し物理側を列挙、Phase 2 column-mapping-matrix.md と diff | 物理側に存在するカラム / 関数のうち matrix 未掲載 0 件 | AC-2 / AC-4 |
| V-4 | 4 案比較表完全性 | no-op / view / rename / 新テーブル+移行 の 4 案が 4 軸（破壊性 / 実装コスト / 監査連続性 / rollback 容易性）で評価され、採否理由付きであること | backward-compatibility-strategy.md の 4×4 セルを目視、採択案 1 件 / 却下案 3 件すべてに採否理由列が埋まっていることを確認 | 16 セル全埋め、採択案がデータ消失非伴の戦略であることが明記 | AC-3 |
| V-5 | 直交性チェックリスト存在 | 本タスクが U-8 / U-9 のスコープに踏み込んでいないこと | handoff-to-ut04-ut09.md を Read し「本タスクは enum 値 / retry 値 / offset 値 / shared schema 実装 / 物理 migration 発行を決定しない」のチェック項目 5 件以上を確認 | 5 チェック項目すべてが `[x]` でクローズ、各項目に直交先タスク ID（U-8 / U-9 等）を併記 | AC-5 |
| V-6 | UT-04 / UT-09 引き継ぎ網羅 | 各下流タスクが本仕様書だけで canonical name と migration 戦略を理解できること | Phase 2 成果物に「UT-04 引き継ぎ」「UT-09 引き継ぎ」セクションが独立して存在することを grep で確認 | 各下流タスク向けに「決定事項」「未決定で下流に委ねる事項」が分離記述 | AC-4 |
| V-7 | aiworkflow-requirements drift 検出 | システム仕様 `database-schema.md` の sync 系記述が canonical 名と整合していること | `grep -n "sync_log\|sync_job_logs\|sync_locks" .claude/skills/aiworkflow-requirements/references/database-schema.md` で出現箇所を抽出、drift 件数を Phase 2 成果物に記録 | drift 0 件、または更新案が成果物に存在し Phase 5 runbook へ申し送り済 | AC-6 |

## 再現コマンド集（コピペ実行可能）

```bash
# V-1
grep -rn "sync_log\b" docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/

# V-2
grep -c '^| ' docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/column-mapping-matrix.md

# V-3 (Read + Grep)
grep -nE "CREATE TABLE|CREATE INDEX|UNIQUE|FOREIGN KEY" \
  apps/api/migrations/0002_sync_logs_locks.sql
grep -nE "sync_job_logs|sync_locks|INSERT|UPDATE|acquireLock|releaseLock|expires_at" \
  apps/api/src/jobs/sync-sheets-to-d1.ts

# V-4
grep -c '^| ' docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/backward-compatibility-strategy.md

# V-5
grep -nE "U-8|U-9|enum|retry|offset|shared schema|physical migration" \
  docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/handoff-to-ut04-ut09.md

# V-6
grep -nE "UT-04|UT-09|引き継ぎ|handoff" \
  docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/naming-canonical.md

# V-7
grep -n "sync_log\|sync_job_logs\|sync_locks" \
  .claude/skills/aiworkflow-requirements/references/database-schema.md
```

## 物理側ベースライン（V-3 の入力）

> Phase 2 で `apps/api/migrations/0002_sync_logs_locks.sql` と `apps/api/src/jobs/sync-sheets-to-d1.ts` を Read し物理側を列挙する。本ベースラインは Phase 2 column-mapping-matrix.md の左欄（物理側）と diff ゼロでなければならない。

| 物理オブジェクト | 種別 | 出典（Read 対象） |
| --- | --- | --- |
| `sync_job_logs`（ledger） | TABLE | `apps/api/migrations/0002_sync_logs_locks.sql` |
| `sync_locks`（lock） | TABLE | 同上 |
| `sync_locks.expires_at` | COLUMN | 同上 |
| ledger 書込関数 | function | `apps/api/src/jobs/sync-sheets-to-d1.ts` |
| lock 取得 / 解放関数 | function | 同上 |

> 上記は概略骨格。Phase 2 / Phase 6 で物理側の全カラム / 全関数を列挙し本表へ反映する。物理側に書込 / 改変は行わない。

## coverage 代替指標

| 指標 | 目標値 | 計測方法 | 出力先 |
| --- | --- | --- | --- |
| 文書不変条件の充足率 | 100%（V-1〜V-7 全件 PASS） | 上記コマンドの結果を観測 | `outputs/phase-09/manual-smoke-log.md` |
| canonical 命名 drift ヒット | 0 件 | V-1 grep 出力に物理名混同が無いこと | 同上 |
| 13 カラム被覆率 | 100% | V-2 行数 diff = 13 | 同上 |

> line/branch coverage は本タスクでは適用しない（コード変更ゼロのため）。

## AC × V trace 草案（Phase 7 で最終確定）

| AC# | 内容（要約） | 主担 V | 補助 V |
| --- | --- | --- | --- |
| AC-1 | canonical 命名決定と採択理由 | V-1 | V-4 |
| AC-2 | 1:N マッピング表 | V-2 | V-3 |
| AC-3 | 後方互換 4 案比較 | V-4 | - |
| AC-4 | UT-04 への migration 戦略引き継ぎ | V-6 | V-3 |
| AC-5 | U-8 / U-9 直交性 | V-5 | - |
| AC-6 | aiworkflow-requirements drift 解消 | V-7 | - |

全 AC が最低 1 検証項目で被覆（未被覆セル 0）。

## 引き継ぎ contract（不変条件）

### 本タスクで決定する事項

- canonical 命名（採択案 A / B / C）と採択理由
- 論理 13 カラム → 物理 1:N マッピング
- 後方互換戦略（4 案比較と採択）
- UT-04 / UT-09 への引き継ぎ事項の明文化
- aiworkflow-requirements drift の更新案（実適用は Phase 12 Step 1-A）

### 本タスクで決定しない事項（直交先）

- enum 値の canonical（→ U-8）
- retry 回数 / offset resume 値（→ U-9）
- shared `Zod` schema 実装（→ U-10）
- 物理 DDL の発行 / 既存 migration 改変（→ UT-04）
- 同期ジョブのコード改修（→ UT-09）

## 関連

- `phase-04.md`（本成果物の親仕様）
- `outputs/phase-02/naming-canonical.md`（V-1 / V-6 入力）
- `outputs/phase-02/column-mapping-matrix.md`（V-2 / V-3 入力）
- `outputs/phase-02/backward-compatibility-strategy.md`（V-4 入力）
- `outputs/phase-02/handoff-to-ut04-ut09.md`（V-5 入力）
