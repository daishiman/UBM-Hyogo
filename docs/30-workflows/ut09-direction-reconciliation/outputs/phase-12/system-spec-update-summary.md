# Phase 12 System Spec Update Summary

> 正本仕様: `../../phase-12.md` §タスク 2
> 採用方針: **A 維持（推奨 / base case）**
> Step 2: **stale 撤回として発火**。A 維持でも、正本 references / runtime に Sheets 系 stale 記述・経路が残る場合は
> 「新規採用」ではなく「撤回・停止」のための最小更新を別タスク化する。
> 本タスクではコード / migration / Secret / wrangler は触らず、ドキュメント正本・skill 導線・未タスクを同期する。

---

## Step 1-A: 完了タスク記録 + 関連 doc リンク + 変更履歴 + LOGS ×2 + topic-map

| # | 同期対象 | パス | 記述内容 |
| --- | --- | --- | --- |
| 1 | workflow LOG | `docs/30-workflows/LOGS.md` | UT-09 reconciliation close-out 行追記。base case = 案 a / stale 撤回発火 / docs-only / NON_VISUAL |
| 2 | aiworkflow SKILL | `.claude/skills/aiworkflow-requirements/SKILL.md` | 変更履歴テーブル更新行: stale Sheets 系 references / runtime が残る場合は A 維持でも Step 2 stale 撤回として発火 |
| 3 | task-spec SKILL | `.claude/skills/task-specification-creator/SKILL.md` | 変更履歴テーブル更新行: docs-only / direction-reconciliation でも実測 validator と記述レベル PASS を分離 |
| 4 | topic-map | `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | `direction-reconciliation` / `二重正本解消` / `stale 撤回` / `runtime kill-switch` / `pending と PASS の区別` の導線追加 |
| 5 | active guide | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | docs-only reconciliation で references / runtime に stale contract が残る場合の Step 2 発火境界を追記 |
| 6 | 関連 doc 双方向リンク | 5 関連タスク + ut-09 root + ut-21 | legacy umbrella / 03a / 03b / 04c / 09b / ut-09 root / ut-21 と本 reconciliation タスクの双方向リンク方針を記録（実リンク追記は既存タスクの所有権を尊重し B-03 / B-04 / B-05 へ分割） |

## Step 1-B: 実装状況テーブル更新（`spec_created` 固定）

| 項目 | 値 |
| --- | --- |
| 仕様状態の遷移 | `blocked` →（reconciliation 完了）→ **`spec_created`** →（採用方針 A の関連タスク反映後）→ `merged` |
| 本タスクの最終状態 | **`spec_created`**（`implemented` には **しない**。docs-only のため） |
| 統合 README / `docs/30-workflows/LOGS.md` | UT-09 reconciliation を `spec_created` ステータスで実装状況テーブルに登録。コード反映は別タスク化のため `implemented` にしない |
| `docs/30-workflows/unassigned-task/task-ut09-direction-reconciliation-001.md` | 本タスクディレクトリ（`docs/30-workflows/ut09-direction-reconciliation/`）への昇格を記録（または link）|

## Step 1-C: 関連タスクテーブル更新予定（5 + 2 タスク）

以下 5 関連タスク + 2 並列タスクの index.md「下流 / 関連」テーブルに UT-09 reconciliation 完了情報と
base case 結論を反映する:

| # | 対象 index.md | 追記内容 |
| --- | --- | --- |
| 1 | `docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` | UT-09 reconciliation 完了 / 推奨方針 A 維持 / 本タスクとの双方向リンク |
| 2 | `docs/30-workflows/completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md` | UT-09 reconciliation の base case = A を引用 / D1 contention mitigation 5 知見を AC として継承（B-03 経由） |
| 3 | `docs/30-workflows/02-application-implementation/03b-parallel-forms-response-sync-and-current-response-resolver/index.md` | 同上（responseId 解決 / B-03 経由） |
| 4 | `docs/30-workflows/02-application-implementation/04c-parallel-admin-backoffice-api-endpoints/index.md` | 2 endpoint 維持 / Bearer middleware 認可境界 current 維持を引用 |
| 5 | `docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md` | cron 経路 = Forms 2 endpoint 維持 / Sheets 単一経路は撤回候補 |
| 6 | `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/index.md` | legacy umbrella 参照復元方針を明記（実書き換えは B-04） |
| 7 | `docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/index.md` | 「同様に blocked」項目に「UT-09 reconciliation で base case = 案 a 確定」を双方向リンク |

## Step 2（条件付き）: 採用方針別の発火

| 採用方針 | Step 2 発火 | 更新対象 references | 本タスクでの扱い |
| --- | --- | --- | --- |
| **A（推奨 / base case / 確定）** | **stale 撤回として発火** | `api-endpoints.md` / `deployment-cloudflare.md` / `environment-variables.md` / `database-schema.md` / `apps/api runtime` / `wrangler.toml` を audit し、Sheets 系 current 風記述・runtime 経路を撤回または停止する | B-05（references stale 撤回）/ B-10（runtime kill-switch）で実施 |
| B（要 user 承認 / 不採用） | 広範囲発火 | `api-endpoints.md`（単一 `/admin/sync`）/ `database-schema.md`（`sync_locks` + `sync_job_logs`）/ `deployment-cloudflare.md`（Sheets 単一経路 cron）/ `environment-variables.md`（`GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` 正式採用）/ `topic-map.md` を same-wave 更新 | 不採用のため記述のみ。実書き換えは行わない |

> **重要**: 本タスクは A 維持で確定（Phase 10 GO）。ただし、A 維持は「何も更新しない」ではない。
> 正本 references / runtime に Sheets 系 current 風記述・経路が残る場合は、stale 撤回として Step 2 を発火させる。
> 実 references 書き換えと runtime 停止は B-05 / B-10 で扱い、本タスクでは発火条件と未タスクを固定する。

## 別タスク登録項目（system spec 更新の文脈で発生する）

| 別タスク ID | 内容 | system spec 更新との関係 |
| --- | --- | --- |
| B-04: `task-ut09-legacy-umbrella-restore-001` | 旧 UT-09 root を legacy umbrella 参照に戻す書き換え | Step 1-C #6 の実書き換え |
| B-05: `task-ut09-references-stale-audit-001` | aiworkflow-requirements references stale audit + stale 撤回 | A 維持時の Step 2 検証と `api-endpoints` / `deployment-cloudflare` / `environment-variables` の最小撤回 |
| B-10: `task-ut09-runtime-kill-switch-001` | Sheets runtime kill-switch / cron 停止確認 | B-01 削除前に `/admin/sync` mount / cron / `wrangler.toml` の暫定停止を確認 |
| B-09: task-specification-creator skill 改善（Phase 12 compliance ルール統一） | skill-feedback-report.md の改善提案を反映 | SKILL #2 の変更履歴と連動 |

## 完了条件（セルフチェック）

- [x] Step 1-A の同期対象（workflow LOG / SKILL ×2 / topic-map / active guide / 関連 doc 方針）が揃っている
- [x] Step 1-B で `spec_created` ステータスに固定（`implemented` は使わない）
- [x] Step 1-C で 5 関連タスク + 2 並列タスクへの双方向リンク
- [x] Step 2 が A / B 別の発火条件で記述（A 維持 → stale 撤回 / B 採用 → 広範囲発火）
- [x] 「コード / migration / Secret / wrangler の本体は別タスク」が明記
- [x] 別タスク ID（B-04 / B-05 / B-09 / B-10）が明示

---

状態: spec_created
