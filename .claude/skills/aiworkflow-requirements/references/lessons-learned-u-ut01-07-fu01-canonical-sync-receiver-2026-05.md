# Lessons Learned: U-UT01-07-FU01 UT-09 canonical sync job receiver

> 由来: `docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/`
> 完了日: 2026-05-02
> タスク種別: docs-only / receiver-spec / NON_VISUAL / spec_created
> 親タスク: U-UT01-07 sync_log naming reconciliation（`docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/`）
> 受け皿 path: `docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md`
> 出典: `outputs/phase-12/system-spec-update-summary.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md` / `implementation-guide.md`

## 概要

親 U-UT01-07 が確定した canonical 名 `sync_job_logs` / `sync_locks` と「`sync_log` は概念名 / 物理化禁止」を、UT-09 実装タスクが必ず参照する**受け皿仕様 (receiver)** として固定するための docs-only ワークフロー。新規 task root を切らず、既存 legacy 文書である `unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md` の冒頭に **Canonical Receiver Note** を埋め込み、parent の正本 4 ファイル（`naming-canonical.md` / `column-mapping-matrix.md` / `backward-compatibility-strategy.md` / `handoff-to-ut04-ut09.md`）を必須参照として宣言した。コード・migration・grep guard・hook・CI gate は本タスクから一切作らず、UT-09 / governance guard へ委譲する。

## 苦戦箇所 4 件（L-UUT0107FU01-001〜004）

### L-UUT0107FU01-001: receiver 系 spec の `taskType` を実装側につられて誤分類しやすい

下流 consumer が UT-09 の **implementation** タスクである一方、本タスク自体は「canonical 名と必須参照リストを既存 path へ書き付ける」だけで、コードも migration も生まない。初版で `taskType` が `implementation` に揺れたが、Phase 12 直前で `docs-only / NON_VISUAL / spec_created` に正規化した。

- **教訓**: receiver / handoff 系タスクの `taskType` は consumer 側の種別ではなく**自タスクの成果物**で決める。コード・migration・script・hook を 1 行も生まないなら `docs-only` 固定。
- **再発防止**: Phase 1 メタ情報レビュー時に「自分が出す成果物に `.ts` / `.sql` / `.sh` / `.yml` を含むか」で判定するチェック行を `task-specification-creator` の receiver subtype 例として promote する（skill-feedback-report 中優先）。

### L-UUT0107FU01-002: Phase 12 strict 7 ファイル生成前に completion を主張する事故

artifacts.json と outputs ディレクトリ構造が parent UT-04 の 7 ファイル前提と異なるサブセットで一旦書かれ、Phase 12 を `completed` と表示しかけた。strict 7 ファイル（`main` / `implementation-guide` / `system-spec-update-summary` / `documentation-changelog` / `unassigned-task-detection` / `skill-feedback-report` / `phase12-task-spec-compliance-check`）と root `artifacts.json` parity が揃うまで `spec_created` から進めない運用に戻した。

- **教訓**: Phase 12 完了主張は「strict 7 ファイル存在 + root artifacts.json parity」の二条件を満たした瞬間にのみ許可する。outputs 側 artifacts.json はワークフローによって作らない選択も正規。
- **再発防止**: `outputs/phase-12/phase12-task-spec-compliance-check.md` を strict 7 ファイル目に固定し、parity 結果を本書に記録してから `index.md` の Phase 12 行を完了化する。

### L-UUT0107FU01-003: legacy 文書を receiver にする際は「履歴 vs 現行指示」境界を 1 行で宣言する

`UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md` は本文全体が legacy / historical context であり、そのまま receiver に流用すると「単一 `POST /admin/sync` 新設」など旧案を新規 ToDo として再開する誤読リスクがある。Canonical Receiver Note を最上部に挿入し「This legacy file is not reopened as an implementation instruction」と明示してから canonical inputs / required references / boundary を箇条書き化した。

- **教訓**: legacy 文書を receiver path に流用するときは、本文を編集せず、Note セクションを最上部に追加して**現行正本との境界**を 1 行で先頭固定する。本文は履歴証跡として保全する。
- **再発防止**: receiver Note には (a) legacy file 不再開宣言、(b) canonical 名（物理 / 概念）、(c) 親 Phase 02 必須参照、(d) boundary（コード / migration / hook / CI 委譲先）の 4 項目を必ず含める。

### L-UUT0107FU01-004: 親ワークフローの skill citation path drift を receiver wave で発見しやすい

resource-map と quick-reference の親 U-UT01-07 entry が `docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/` を指していたが、実体は既に `docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/` に置かれていた。本 receiver wave で参照導線を踏んだ結果 404 になり、citation correction を同 wave 同期で適用した。

- **教訓**: receiver / follow-up wave は親 path の skill citation 健全性チェックの最後の砦になる。`completed-tasks/` 配置済みの親を skill 側が active path で citing していないか、grep + 実体 ls で必ず確認する。
- **再発防止**: 同 wave 同期対象に「parent path drift detection」を加える。具体的には resource-map / quick-reference の親 entry を grep し、`docs/30-workflows/<slug>/` と `docs/30-workflows/completed-tasks/<slug>/` のどちらが実体かを `ls` で突き合わせる。

## 運用ルール 2 件（receiver 系の固定運用）

| 規則 | 内容 |
| --- | --- |
| OP-UUT0107FU01-1 | receiver / handoff 系タスクの `taskType` は consumer 種別ではなく自タスクの成果物で判定し、コード・migration・script を生まないなら `docs-only / NON_VISUAL / spec_created` 固定。 |
| OP-UUT0107FU01-2 | legacy 文書を receiver path に流用する場合、本文編集禁止 + 最上部 Canonical Receiver Note で legacy 不再開宣言・canonical 名・親必須参照・boundary を 1 ブロックに固定する。 |

## canonical 確定（参照用 / 親から継承）

| 概念 | 物理 | 役割 |
| --- | --- | --- |
| `sync_log`（概念名） | N/A | プロジェクト全体での集合呼称。実テーブル名で CREATE / RENAME / DROP しない |
| ジョブ実行履歴 | `sync_job_logs` | canonical（migrations 0002） |
| 排他制御 | `sync_locks` | canonical（migrations 0002） |

## 後続タスク

- UT-09 実装本体: `sync_job_logs` / `sync_locks` を canonical として使用し、`sync_log` を物理化しないこと。UT-21 受け皿は legacy note 維持のみ。
- UT-04: D1 schema 物理確定時の DDL 反映受け側（本タスクからは分離）。
- governance guard: `sync_log` 物理化検知用 grep guard / CI gate（本タスクからは委譲）。
