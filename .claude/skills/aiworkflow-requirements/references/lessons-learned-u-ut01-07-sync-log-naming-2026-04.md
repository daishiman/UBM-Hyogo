# Lessons Learned: U-UT01-07 sync_log naming reconciliation（論理 vs 物理 canonical 決定）

> 由来: `docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/`
> 完了日: 2026-04-30
> タスク種別: docs-only / design-reconciliation / NON_VISUAL / spec_created
> 出典: `outputs/phase-12/system-spec-update-summary.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md`

## 概要

UT-01 Phase 2 で論理設計した `sync_log` テーブルと、`apps/api/migrations/0002_sync_logs_locks.sql` で先行物理化されていた `sync_job_logs` / `sync_locks` の二重 ledger 化を防ぐため、**物理 2 テーブル分割を canonical として追認し、`sync_log` を概念名（プロジェクト全体での集合呼称）に降格** する設計 reconciliation を確定。物理 rename / view 化 / DDL 追補は本タスクに含めず、UT-04（D1 schema 物理確定）/ U-UT01-08（enum 統一）/ U-UT01-09（retry/offset 統一）/ U-UT01-07-FU01（UT-09 実装受け皿）に分離した。

## 苦戦箇所 5 件（L-UUT0107-001〜005）

### L-UUT0107-001: 物理稼働中 vs 論理設計の齟齬で「論理を物理に寄せる」採択を見落としやすい

論理正本（UT-01 Phase 2 sync-log-schema.md / 13 カラム単一テーブル）と物理実装（migrations 0002 / `sync_job_logs` + `sync_locks` の 2 テーブル分割）が並存している場合、reflex で「論理を維持し物理を rename / merge する」案に倒れやすい。本タスクでは比較表（rename / view / 物理追認 + 概念名降格）を Phase 02 backward-compatibility-strategy.md で明示し、運用中 cron / job の挙動互換と migration 副作用ゼロを優先して **追認 + 概念名降格** を採択。

- **教訓**: 物理が稼働している場合、reconciliation の最初の選択肢として「物理追認 + 論理側を概念名に降格」を Phase 02 で必ず比較表に含める。rename / view 化は migration 副作用ありとして低位に置く。
- **再発防止**: `outputs/phase-02/backward-compatibility-strategy.md` を `naming-canonical.md` / `column-mapping-matrix.md` / `handoff-to-ut04-ut09.md` と並ぶ正本 4 ファイルとして固定し、resource-map / quick-reference の reconciliation 系 entry にこの 4 ファイルを明示同梱する。

### L-UUT0107-002: `database-schema.md` の grep 0 件を「追補不要」と誤読する余地

`.claude/skills/aiworkflow-requirements/references/database-schema.md` に `sync_log` / `sync_logs` / `sync_job_logs` / `sync_locks` の grep が 0 件で、既存 drift は無いと判定した。一方で「0 hits = canonical 追補不要」と後続が誤読すると、UT-04 物理確定時に DDL 反映が漏れて二重 ledger が再発する。

- **教訓**: grep 0 件は「既存記述の drift なし」であって「canonical 追補不要」を意味しない。docs-only reconciliation で DDL 追補を **物理確定タスク（UT-04）に委譲する** 判断は、quick-reference / resource-map の「未タスク」欄に明示する。
- **再発防止**: `system-spec-update-summary.md` Step 1-A-3 で「追補を本タスクで行わない理由」を文章化し、`quick-reference.md` に U-UT01-07 entry を追加して UT-04 への委譲線を可視化済。

### L-UUT0107-003: 後続実装タスクの実パス未確認を「既存委譲」で閉じる罠

UT-09 系には withdrawal / direction reconciliation / stale audit 等の workflow が複数あるが、canonical 名を実装で参照する単一の実装タスク root が現ワークツリーで確認できなかった。これを「既存委譲」で閉じると、`apps/api/src/jobs/sync-sheets-to-d1.ts` 側が U-UT01-07 の Phase 02 正本を読まず、`sync_log` を実テーブル名として CREATE / RENAME する実装ドリフトが起きうる。

- **教訓**: 「既存タスクへの委譲」を成立させるには、委譲先 task root の実パス確認を Phase 12 unassigned-task-detection の必須ゲートにする。実パス未確認の場合は受け皿確定 follow-up を formalize する。
- **後続タスク**: `docs/30-workflows/unassigned-task/U-UT01-07-FU01-ut09-canonical-sync-job-receiver.md`（HIGH 優先度）。受入条件に「`sync_log` の物理 CREATE / RENAME / DROP 禁止」を含める。

### L-UUT0107-004: docs-only-design-reconciliation subtype の Step 1-A 実適用 vs diff plan の判定基準が暗黙

task-specification-creator の Phase 12 テンプレでは `taskType=docs-only` の subtype（drift cleanup / design reconciliation / governance / runbook）が陽に列挙されておらず、Step 1-A を「実適用するか diff plan のみで残すか」が読者の暗黙判断に委ねられる。本タスクでは indexes 同期と原典 unassigned 状態更新は実適用、`database-schema.md` への DDL 反映は diff plan 留めとした。

- **教訓**: docs-only / reconciliation の Step 1-A 適用境界は「正本の物理整合と独立して即時適用できる範囲（indexes / 状態 / 後継 path 追記）」と「物理整合と並行適用すべき範囲（DDL 追補）」を明示分離する。
- **後続フィードバック**: skill-feedback-report.md に中優先度として記録（task-specification-creator references への subtype カタログ追加提案）。

### L-UUT0107-005: Phase 12 必須ファイル数の正本が SKILL refs 内で揺れる

UT-04 phase-12.md は 7 必須ファイル（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）として記述、本タスク仕様書は 5 必須として指示されており、`phase12-task-spec-compliance-check.md` の position が「必須 6 ファイル目」「任意の 6 ファイル目」「必須 7 ファイル目」で揺れる。

- **教訓**: Phase 12 必須ファイル数の正本を SKILL.md に明示し、taskType / visualEvidence ごとの必須セット差分を表で固定する。本タスクは安全側として 7 ファイル全揃え + `phase12-task-spec-compliance-check.md` を root evidence として artifacts.json 7 件目に位置付けた。
- **後続フィードバック**: skill-feedback-report.md に中優先度として記録。

## 運用ルール 3 件（reconciliation 系の固定運用）

| 規則 | 内容 |
| --- | --- |
| OP-UUT0107-1 | 物理稼働中の論理 reconciliation では Phase 02 比較表に「物理追認 + 概念名降格」を必ず含める。rename / view 化は migration 副作用ありとして低位。 |
| OP-UUT0107-2 | 既存タスクへの委譲は task root の実パス確認を Phase 12 unassigned-task-detection の必須ゲートにする。未確認は受け皿確定 follow-up を formalize する。 |
| OP-UUT0107-3 | docs-only reconciliation で `database-schema.md` 追補を物理確定タスクに委譲する判断は、quick-reference / resource-map の entry に明示し、grep 0 件の誤読を防ぐ。 |

## canonical 確定（参照用）

| 概念 | 物理 | 役割 |
| --- | --- | --- |
| `sync_log`（概念名） | N/A | プロジェクト全体での集合呼称。実テーブル名としては使用しない |
| ジョブ実行履歴 | `sync_job_logs` | canonical（migrations 0002） |
| 排他制御 | `sync_locks` | canonical（migrations 0002） |

## 後続タスク

- `U-UT01-07-FU01`: UT-09 canonical sync job implementation receiver（HIGH）
- `UT-04`: D1 schema design - sync 系 DDL canonical 追補
- `U-UT01-08`: sync 状態 / trigger enum 統一
- `U-UT01-09`: retry 回数 / offset resume 統一
