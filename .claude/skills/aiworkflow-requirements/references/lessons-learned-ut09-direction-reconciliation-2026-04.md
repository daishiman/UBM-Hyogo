# Lessons Learned: UT-09 direction reconciliation（Forms vs Sheets 同期方針統一）

> 由来: `docs/30-workflows/ut09-direction-reconciliation/`
> 完了日: 2026-04-29
> タスク種別: docs-only / direction-reconciliation / NON_VISUAL / spec_created
> 出典: `outputs/phase-12/system-spec-update-summary.md` / `unassigned-task-detection.md` / `skill-feedback-report.md`

## 概要

`task-sync-forms-d1-legacy-umbrella-001` で確定した current Forms 分割方針 (A) と、本ワークツリーで `apps/api/` に実装された Sheets 採用方針 (B) の二重正本（dual-canonical）衝突を解消するため、docs-only / NON_VISUAL の reconciliation タスクとして方針 A 維持を確定。コード撤回・migration 削除・Cloudflare Secret 削除は本タスクに含めず、撤回・移植・整合確認の 10 件を `B-01〜B-10` として別タスク化した。Phase 12 close-out では「A 維持でも stale 撤回として Step 2 を発火させる」運用境界を新設した。

## 苦戦箇所 6 件（L-UT09-001〜006）

### L-UT09-001: A 維持時に Step 2「不発火」と誤判定すると stale references を見逃す

採用方針 A を維持した場合、aiworkflow-requirements の Step 2（references 同期更新）は「正本採用更新が不要だから不発火」と判定しがち。しかし `references/api-endpoints.md` / `deployment-cloudflare.md` / `environment-variables.md` / `wrangler.toml` runtime mount / cron に不採用方針 B（Sheets）の current 風記述・経路が残ると、二重正本が再発する。

- **教訓**: docs-only / direction-reconciliation で A 維持時も、不採用方針の current 風記述・runtime 経路が残るなら Step 2 を **stale 撤回として発火**させる。
- **再発防止**: `references/task-workflow-active.md` に「docs-only direction-reconciliation の stale 撤回境界」セクションを追加し、判定表記（実測 PASS / 記述済み / pending_creation / NOT_APPLICABLE）を分離。`SKILL.md` 変更履歴と topic-map にも導線を追加。

### L-UT09-002: 二重正本（dual-canonical）の検出機構が references に無い

`api-endpoints.md` / `database-schema.md` 等の登録に「採用方針別の有効期間」を持たせる仕組みが無く、Forms 系と Sheets 系の同種 entry が both current として共存できてしまう。

- **教訓**: 各 entry に `direction_owner` フィールド（A / B / N/A）を導入し、reconciliation で参照される base case を明示する。Ownership 宣言を 5 対象（api-endpoints / database-schema / environment-variables / deployment-cloudflare / topic-map）に拡張。
- **後続タスク**: `task-ut09-references-stale-audit-001`（B-05）で実装。

### L-UT09-003: 実測 PASS と記述レベル PASS の混同

Phase 12 compliance check で「validator 未実行」「未起票 unassigned-task」「stale references 撤回待ち」を PASS としてしまうと、実態と記述が乖離する。staging smoke pending を PASS と誤記する事例も近接タスクで観測。

- **教訓**: compliance check に `PASS / PENDING / NOT_APPLICABLE` の 3 値を導入し、validator 未実行・別タスク起票前の項目は PASS にしない。`pending` と `PASS` の表記を厳密に分離する運用ルールを全 task の Phase 12 に組み込む。
- **後続タスク**: `task-task-spec-creator-phase12-compliance-rules-001`（B-09）で skill template に反映。

### L-UT09-004: docs-only / direction-reconciliation での `implemented` 強要が不適切

task-specification-creator skill の Phase 12 closeout テンプレが `implemented` 必須前提で書かれており、docs-only / reconciliation 系では `spec_created` で close-out するパスが明示されていなかった。Phase 12「実装ガイド」も code-only 前提のままだった。

- **教訓**: docs-only タスクは `spec_created` で close-out 可能と明示し、Phase 12 「実装ガイド」は「reconciliation / 文書化手順ガイド」への読み替えを許容する。
- **後続タスク**: B-09 で skill template 改善。

### L-UT09-005: 30 種思考法の分割適用は全 30 種揃うまで PASS にしない

Phase 3 の代表 8 種だけでは AC-11 PASS にできない。Phase 10 補完 22 種を必須ゲート化することで全 30 種適用を満たした。分割適用の途中段階で「主要思考法は適用済み」として PASS 化すると、未適用の思考法が拾わなかった blocker を見逃す。

- **教訓**: 30 種思考法は省略不可。分割適用する場合も、全 30 種が揃うまで PASS としない運用ルールを skill / Phase template に追記。

### L-UT09-006: docs-only でも runtime kill-switch / cron 停止確認を別タスクに挟む必要

Sheets 実装撤回 PR (B-01) / migration 撤回 (B-02) / Sheets Secret 削除 (B-07) を実行する前に、Sheets runtime（`/admin/sync` mount・unknown cron fallback・`wrangler.toml` Sheets cron）が動き続けていると、撤回作業中に意図しない sync ジョブが走るリスクが残る。

- **教訓**: 撤回系タスクの前段に「runtime kill-switch / cron 停止確認」を独立タスクとして挟む。docs-only reconciliation の段階で停止条件を AC 化しておく。
- **後続タスク**: `task-ut09-runtime-kill-switch-001`（B-10）として新設。B-01/B-02/B-07 の上流依存に置く。

## 運用ルール 2 件（reconciliation 系の固定運用）

| 規則 | 内容 |
| --- | --- |
| OP-UT09-1 | staging smoke 状態は `pending` / `PASS` / `FAIL` のいずれかで明示し、`pending` を `PASS` と誤記しない。Phase 12 compliance check の固定行として組み込む。|
| OP-UT09-2 | reconciliation で検出した撤回・移植・削除・整合確認系の作業は本 PR に混入させず、`docs/30-workflows/unassigned-task/` に独立タスクとして分離する。Phase 13 PR レビュー後に起票しても可。|

## 同期完了サマリー（same-wave sync）

| 同期対象 | パス | 反映内容 |
| --- | --- | --- |
| workflow LOG | `docs/30-workflows/LOGS.md` | UT-09 reconciliation close-out 行 |
| SKILL #1 | `.claude/skills/aiworkflow-requirements/SKILL.md` | 変更履歴に v2026.04.29-ut09 行 + stale 撤回発火ルール |
| SKILL #2 | `.claude/skills/task-specification-creator/SKILL.md` | 変更履歴に docs-only 実測判定ルール |
| topic-map | `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | direction-reconciliation / 二重正本解消 / stale 撤回 / runtime kill-switch / pending 区別の導線 |
| active guide | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | docs-only direction-reconciliation の stale 撤回境界 |
| lessons-learned | 本ファイル | L-UT09-001〜006 + OP-UT09-1/2 |
| 二重 ledger | `artifacts.json` (root) + `outputs/artifacts.json` | parity 確保 |

## 関連 unassigned-task（B-01〜B-10）

| ID | unassigned-task | 種別 |
| --- | --- | --- |
| B-01 | `task-ut09-sheets-impl-withdrawal-001` | コード撤回 |
| B-02 | `task-ut09-sheets-migration-withdrawal-001` | migration 撤回 |
| B-03 | 03a / 03b / 09b の AC 更新（既存タスク反映） | 移植 |
| B-04 | `task-ut09-legacy-umbrella-restore-001` | 旧 root 復元 |
| B-05 | `task-ut09-references-stale-audit-001` | references audit |
| B-06 | `task-verification-report-cleanup-001` | unrelated cleanup |
| B-07 | `task-ut09-sheets-secrets-withdrawal-001` | Secret 削除 |
| B-08 | （保留登録のみ・未起票） | 戦略 |
| B-09 | `task-task-spec-creator-phase12-compliance-rules-001` | skill 改善 |
| B-10 | `task-ut09-runtime-kill-switch-001` | runtime 停止 |
