# Phase 4 Output: raw evidence 収集

> 本ファイルは判定（新設不要）の一次証跡を、再現可能な検索コマンドと raw 出力の対応で記録する。
> ここに記す「raw 結果サマリ」は判定根拠の期待値であり、**実際のコマンド実行による再現確認は Phase 11**（`outputs/phase-11/manual-test-result.md` / `reproduction-verification.md`）で行う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | task-ut21-sync-audit-tables-necessity-judgement-001 |
| Phase | 4 / 13 |
| 実測基準コミット | origin/dev `f6faeb005`（2026-05-31 時点） |
| 検索ツール | ripgrep (`rg`) / `grep` |
| 対象 root | `apps/`（不変条件 #5: D1 直接アクセスは `apps/api` に閉じる） |

## E-1. `sync_audit_*` の非存在（apps/ 配下 0 件）

| 列 | 内容 |
| --- | --- |
| コマンド | `rg -n -e "sync_audit_logs" -e "sync_audit_outbox" apps/` |
| 目的 | 判定対象の 2 テーブルが apps（マイグレーション・実コード）に存在しないことを実測する |
| raw 結果サマリ | **ヒット 0 件**（match なし＝exit code 1）。`apps/api/migrations/*.sql` にも `apps/api/src/**` にも `sync_audit_logs` / `sync_audit_outbox` の出現なし |
| 判定への含意 | UT-21 が前提とした二段監査テーブルは現コードに**未導入**。「新設不要」の判定は「既存を消す」のではなく「最初から作っていない」状態の追認である |

### E-1.1 docs/skill 参照のみであることの確認

`sync_audit_*` の文字列は設計検討・判定文書（docs）と skill 参照にのみ現れ、実コードには現れない。

| 出現区分 | 例（参照のみ・実装ではない） | 性質 |
| --- | --- | --- |
| docs（本 workflow） | 本 issue-235 配下の判定文書群（index / phase-01〜06 / outputs） | 判定の検討対象としての言及 |
| docs（親 close-out） | `docs/30-workflows/completed-tasks/ut21-forms-sync-conflict-closeout/**`（§(d) 保留対象） | 保留方針の対象名としての言及 |
| docs（原典 U02 spec） | `docs/30-workflows/unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md` | 判定フレームワークの入力 |
| skill 参照 | `.claude/skills/aiworkflow-requirements/references/` 系 task-workflow 記載 | current facts としての言及 |

> いずれも DDL（`CREATE TABLE`）でも TS writer でもなく、**設計判断の検討語彙**としての出現にとどまる。実テーブルは存在しない。

## E-2. `sync_jobs` 定義箇所の棚卸し（実コード正本）

| 列 | 内容 |
| --- | --- |
| コマンド | `rg -ln "sync_jobs" apps/api/src apps/api/migrations` |
| 目的 | 現行 ledger の正本ファイルを列挙し、判定根拠（O-1〜O-4 を充足する既存資産）の所在を確定する |
| raw 結果サマリ | 下表のファイル群がヒット |
| 判定への含意 | `sync_jobs` ledger + 補助台帳 + zod が実コードとして揃っており、audit 観点を充足する基盤が既に稼働している |

| ヒットファイル | 役割 |
| --- | --- |
| `apps/api/migrations/0003_auth_support.sql` | `sync_jobs` 本体 DDL（`job_id` / `job_type` / `started_at` / `finished_at` / `status` / `error_json` / `metrics_json`） |
| `apps/api/migrations/0002_sync_logs_locks.sql` | `sync_job_logs`（run 単位カウント列）/ `sync_locks`（TTL ロック） |
| `apps/api/src/repository/syncJobs.ts` | lifecycle（`start` / `succeed` / `fail` / `findLatest` / `listRecent`、`ALLOWED_TRANSITIONS` 一方向遷移） |
| `apps/api/src/jobs/_shared/sync-jobs-schema.ts` | `metrics_json` zod schema / PII 禁止キー |

> 注: `apps/api/src/jobs/**` の sync 実行経路（schema_sync / response_sync）も `sync_jobs` を参照するが、ledger の正本は上記 4 ファイル。

## E-3. `metrics_json` zod schema の構造化確認

| 列 | 内容 |
| --- | --- |
| コマンド | `rg -n -e "metricsJsonBaseSchema" -e "metrics_json" -e "assertNoPii" -e "PII_FORBIDDEN_KEYS" apps/api/src/jobs/_shared/sync-jobs-schema.ts` |
| 目的 | O-1（実行ごと詳細）が自由形式ではなく構造化・検証済みで保持されることを実測する |
| raw 結果サマリ | `metricsJsonBaseSchema`（`cursor` / `processed` / `writes` / `error_count` / `skipped` / `writeCapHit` / `reason` / `lock_acquired_at` 等の構造化キー）、`assertNoPii` / `PII_FORBIDDEN_KEYS`（email / name 等を遮断）がヒット |
| 判定への含意 | 実行ごと詳細は zod で**型付き構造化 + PII 遮断**済み。別テーブル（`sync_audit_logs`）を新設しなくても O-1 を満たす |

## E-4. `CREATE TABLE` 棚卸し（sync_audit_* 非作成の証明）

| 列 | 内容 |
| --- | --- |
| コマンド | `grep -rn "CREATE TABLE" apps/api/migrations/*.sql` |
| 目的 | マイグレーションが作成する全テーブルを列挙し、`sync_audit_logs` / `sync_audit_outbox` が作成対象に**含まれない**ことを示す |
| raw 結果サマリ | `sync_jobs` / `sync_job_logs` / `sync_locks` / `notification_outbox` / `notification_ledger` 等は `CREATE TABLE` されるが、`sync_audit_logs` / `sync_audit_outbox` の `CREATE TABLE` 行は**一件も現れない** |
| 判定への含意 | E-1 を DDL 側から二重に裏付ける。判定対象テーブルはスキーマ上も未定義であり、新設を見送る判定と整合する |

## E-5. `notification_outbox` 前例の確認

| 列 | 内容 |
| --- | --- |
| コマンド | `rg -ln -e "notification_outbox" -e "notification_ledger" apps/api/migrations` |
| 目的 | 「実需ベースで outbox を新設する」運用前例が実在することを確認する |
| raw 結果サマリ | `apps/api/migrations/0014_notification_outbox.sql` がヒット（`notification_outbox` / `notification_ledger`） |
| 判定への含意 | 本リポジトリは「outbox を一律で作らない」のではなく「at-least-once 配送が**真に必要な領域（通知）にのみ**実需ベースで新設する」運用が確立している。sync audit には現時点でその実需がない（判定基準 4.3 の条件 2 が非該当）ため、`notification_outbox` の存在は「新設不要」判定を補強する反例ではなく、むしろ整合する前例として機能する |

## 証跡サマリと判定への接続

| 証跡 | 結果 | 接続先 AC | 判定への寄与 |
| --- | --- | --- | --- |
| E-1 | `sync_audit_*` apps/ 配下 0 件 | AC-9 | 新設不要判定の前提（未導入の追認） |
| E-2 | `sync_jobs` ledger 群が実在 | AC-1 / AC-2 | O-1〜O-4 を充足する既存基盤の所在 |
| E-3 | `metrics_json` zod 構造化 + PII 遮断 | AC-2 | O-1（実行ごと詳細）充足 |
| E-4 | `sync_audit_*` の `CREATE TABLE` なし | AC-9 | DDL 側からの二重裏付け |
| E-5 | `notification_outbox` 前例実在 | AC-4（条件 2 非該当補強） | 実需ベース outbox 運用の整合前例 |

> 上記はすべて read-only 検索の期待結果。実コマンド実行と 0 差分（`git status --short apps packages` 0 件）の再現確認は Phase 11 で行う。
