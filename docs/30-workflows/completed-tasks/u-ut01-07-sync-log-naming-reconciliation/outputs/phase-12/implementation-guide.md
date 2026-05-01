# Phase 12 実装ガイド: sync_log 命名 reconciliation

## メタ情報

| 項目 | 値 |
| --- | --- |
| 作成日 | 2026-04-30 |
| タスク | U-UT01-07 |
| taskType | docs-only-design-reconciliation |
| visualEvidence | NON_VISUAL |

---

## Part 1: 中学生レベル（日常の例え話で理解する）

### このタスクは何をしたいのか

UBM 兵庫支部会のシステムには、Google スプレッドシートから Cloudflare D1 という「クラウドの大きなノート」へデータを写す仕組みがあります。その「写した記録」を残すためのページが、設計書（論理設計）では `sync_log` と 1 冊にまとめる前提だったのに、実際に動いている本番のノート（物理実装）では `sync_job_logs`（記録）と `sync_locks`（鍵）の 2 冊に分かれていました。

このタスクは、この「設計書 1 冊 vs 実物 2 冊」の食い違いを、**ノートを書き換えずに** 整理するための「呼び方ルール」を決める作業です。コードや本番データには一切手を触れません。

### 例え話 1: クラスの委員会ノート

クラスに「行事委員会ノート」という設計書があったとします。先生は「全部 1 冊にまとめてね」と言いました。でも実際には、生徒たちが既に「実施記録ノート」と「予約ノート（会場の鍵借用簿）」の 2 冊で運用していました。

ここで「設計書通り 1 冊に統合し直す」と、これまでの記録が混乱します。だから今回のタスクは「実物の 2 冊を正式名（canonical）にして、設計書側の `sync_log` は『総称』として残す」という整理を **文書だけで** 行います。鍵借用簿（`sync_locks`）と実施記録（`sync_job_logs`）の役割の違いも明文化します。

### 例え話 2: 図書館の蔵書 ID 統一

図書館で、新人司書が「貸出記録」を新しい台帳で作ろうとしていたら、ベテラン司書から「もう同じ役目の台帳があるよ」と言われたケースを想像してください。新人が知らずに新しい台帳を作ると、同じ本の貸出履歴が 2 系統に分裂してしまいます（**二重 ledger 化**）。

このタスクでは「次に作業する人（UT-04 / UT-09 担当）が新しい台帳を作ってしまわないように、既存の台帳の名前と中身を一覧表で残す」のが目的です。

### 例え話 3: 引っ越しせずに住所表記だけ揃える

「マンション A 棟 2 階 201 号室」を「セントラルハイツ 201」と呼んでいた人がいたとします。住所そのものを引っ越すのはコストが高いので、「正式表記はマンション A 棟 2 階 201 号室、ニックネームはセントラルハイツ 201」と **呼び方の対応表** を作って配るだけにします。これがこのタスクで採択する **no-op 戦略**（何も物理的には変えない）です。

### 例え話 4: チェックリストの分業

このタスクでは「呼び方」と「どの値を入れるか」を分けて考えます。「呼び方」は本タスク（U-UT01-07）、「どの値を入れるか（enum）」は別タスク（U-UT01-08）、「何回やり直すか（retry）」もまた別タスク（U-UT01-09）です。一人で全部やろうとすると話がこんがらがるので、線引き表で分業します。

### このタスクで決めること（中学生レベル）

1. 正式名（canonical）は **物理実装の `sync_job_logs` と `sync_locks` の 2 つ**。`sync_log` は「総称・概念名」として文書中に残す。
2. 設計書の 13 項目のうち、どれが既に物理にあるか・どれは将来追加が必要か（追加判定は次タスク UT-04 へ委譲）の対応表を作る。
3. 「何もしない（no-op）」を採択する根拠を残す。データ消失を絶対に起こさない。
4. 呼び方以外（enum・retry・offset）は別タスクの担当だと宣言する。

---

## Part 2: 技術者レベル

### canonical 命名の決定

| 項目 | 採択 | 根拠 |
| --- | --- | --- |
| canonical（物理） | `sync_job_logs`（ledger） / `sync_locks`（lock） | 既存 `apps/api/migrations/0002_sync_logs_locks.sql` で本番稼働。rename は破壊的変更コストが高い |
| 概念名（文書用） | `sync_log` | UT-01 Phase 2 sync-log-schema.md の論理設計を概念名として保持。コードからは参照しない |
| 採択戦略 | **A 案: 物理を canonical 化、論理を概念名に降格** | 破壊性 = none / 実装コスト = none / 監査連続性 = 完全保持 / rollback = 不要 |

### 論理 13 カラム → 物理 N:M マッピング（概要）

| 論理（sync_log） | 物理（責務テーブル） | 物理カラム | 状態 |
| --- | --- | --- | --- |
| job_id / run_id | sync_job_logs | id (or run_id) | 物理あり |
| started_at | sync_job_logs | started_at | 物理あり |
| finished_at | sync_job_logs | finished_at | 物理あり |
| status | sync_job_logs | status | 物理あり（enum 値統一は U-UT01-08） |
| trigger | sync_job_logs | trigger | 物理あり（enum 値統一は U-UT01-08） |
| processed_count | sync_job_logs | processed_count | 物理あり |
| processed_offset | sync_job_logs | （未実装） | **物理未実装 / 追加判定は UT-04** |
| idempotency_key | sync_job_logs | （未実装） | **物理未実装 / 追加判定は UT-04** |
| error_message | sync_job_logs | error_message | 物理あり |
| retries | sync_job_logs | retries | 物理あり（値統一は U-UT01-09） |
| lock_owner | sync_locks | owner | 物理あり |
| lock_acquired_at | sync_locks | acquired_at | 物理あり |
| lock_expires_at | sync_locks | expires_at | 物理あり |

> 厳密なカラム名は Phase 2 マッピング表を正本とし、本ガイドはサマリ。

### 後方互換戦略の比較表

| 案 | 破壊性 | 実装コスト | 監査連続性 | rollback 容易性 | 採否 |
| --- | --- | --- | --- | --- | --- |
| no-op（物理 canonical） | なし | なし | 完全 | 不要 | **採択** |
| view 化 (`CREATE VIEW sync_log`) | 低 | 中 | 完全 | 容易 | 却下（不要な抽象化） |
| rename | 高 | 高 | 中断リスク | 困難 | 却下（rollback 不能リスク） |
| 新テーブル + データ移行 | 最高 | 最高 | 全消失リスク | 不能 | **明示却下**（データ消失リスク） |

### UT-04 への引き継ぎ（migration 戦略）

- **戦略**: in-place 拡張（必要時のみ ALTER TABLE / ADD COLUMN）。新規テーブル CREATE は禁止。
- **判定対象**: `processed_offset`（INTEGER）/ `idempotency_key`（TEXT UNIQUE）の物理追加要否を UT-04 で判定。
- **禁止事項**: `sync_job_logs` / `sync_locks` の DROP / RENAME を含む migration。

### UT-09 への引き継ぎ（実装契約）

- ジョブ実装は canonical 物理名 `sync_job_logs` / `sync_locks` を直接参照する。`sync_log` という識別子はコード中には出現させない（概念名であり実体ではない）。
- enum 値（`pending|in_progress|completed|failed` ↔ `running|success|failed|skipped`）の解決は U-UT01-08 完了後に確定。

### 直交タスクとの境界

| 直交タスク | 本タスクで扱わないもの |
| --- | --- |
| U-UT01-08 | `status` / `trigger` の enum 値 canonical 決定 |
| U-UT01-09 | `DEFAULT_MAX_RETRIES` / `processed_offset` 既定値 / resume 戦略 |
| U-10（参考） | shared `Zod` schema 実装 |

### 設定値（docs-only タスクの相当記述）

| 項目 | 値 / 参照先 |
| --- | --- |
| 物理 ledger テーブル名 | `sync_job_logs` |
| 物理 lock テーブル名 | `sync_locks` |
| 概念名（文書用） | `sync_log`（コードでは使用禁止） |
| 物理 migration ファイル | `apps/api/migrations/0002_sync_logs_locks.sql` |
| 物理利用フロー | `apps/api/src/jobs/sync-sheets-to-d1.ts` |
| システム仕様正本 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` |

### エラー処理相当（NO-GO 条件）

- 本タスク仕様書本文で **データ消失を伴う案を採択** している場合 → 即時 NO-GO
- canonical 命名の採択理由が空欄 → NO-GO
- マッピング表で論理 13 カラムのうち未判定（空欄）が 1 件でもある → NO-GO
- enum / retry 値の決定が本タスク内で行われている → 直交境界違反 / NO-GO

---

## 参照

- 原典: `docs/30-workflows/unassigned-task/U-UT01-07-sync-log-naming-reconciliation.md`
- 論理正本: `docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-log-schema.md`
- 物理現状: `apps/api/migrations/0002_sync_logs_locks.sql`、`apps/api/src/jobs/sync-sheets-to-d1.ts`
- システム仕様: `.claude/skills/aiworkflow-requirements/references/database-schema.md`
