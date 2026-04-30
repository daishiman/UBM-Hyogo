# Phase 12 Unassigned Task Detection

> 正本仕様: `../../phase-12.md` §タスク 4
> 0 件でも出力必須。本タスクは direction-reconciliation の close-out 文書化に伴い 10 件登録。

---

## 1. 検出項目（10 件 = open question 6 件 + 追加 4 件）

| # | 検出項目 | 種別 | 推奨対応 | 割り当て先候補（新規 / 既存） | 関連 blocker ID（Phase 11） |
| --- | --- | --- | --- | --- | --- |
| 1 | Sheets 実装撤回 PR（`apps/api/src/jobs/sync-sheets-to-d1.ts` 系・`apps/api/src/routes/admin/sync.ts` 単一 endpoint） | 実作業（コード削除） | reconciliation の base case = 案 a に従い撤回 | **新規** unassigned-task: `task-ut09-sheets-impl-withdrawal-001` | B-01 |
| 2 | D1 migration `sync_locks` / `sync_job_logs` の down + 削除 | 実作業（migration） | `sync_jobs` ledger に統一するため不要化 | **新規** unassigned-task: `task-ut09-sheets-migration-withdrawal-001` | B-02 |
| 3 | D1 contention mitigation 5 知見（retry/backoff・short transaction・batch-size 制限・WAL 非前提・ledger 排他性）の 03a / 03b / 09b への移植 | 設計 / 仕様更新 | 各タスクの AC として継承 | 既存タスク: `02-application-implementation/03a` / `03b` / `09b-...` | B-03 |
| 4 | 旧 UT-09 root（`docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/`）を legacy umbrella 参照に戻す書き換え | 仕様更新 | direct implementation 化記述の撤回 | **新規** unassigned-task: `task-ut09-legacy-umbrella-restore-001` | B-04 |
| 5 | aiworkflow-requirements references 現行登録の整合確認 + stale Sheets 系記述の撤回 | 検証 / 仕様更新 | api-endpoints / database-schema / deployment-cloudflare / environment-variables / topic-map の audit。`POST /admin/sync` / Sheets cron / Sheets secret を current 風に残さず、A 維持の注記または撤回へ更新 | **新規** unassigned-task: `task-ut09-references-stale-audit-001` | B-05 |
| 6 | unrelated verification-report 削除の独立 PR 化 | 実作業 | 本 reconciliation PR に混ぜない方針に従い独立タスクで処理 | **新規** unassigned-task: `task-verification-report-cleanup-001` | B-06 |
| 7 | Sheets 系 Cloudflare Secret（`GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID`）の削除（dev / production 双方） | 実作業（secret） | `bash scripts/cf.sh secret delete ...` 経由（wrangler 直叩き禁止） | **新規** unassigned-task: `task-ut09-sheets-secrets-withdrawal-001` | B-07 |
| 8 | 案 b（Sheets 採用）の将来採用判断時期 | 設計 / 戦略 | wave 後段以降の検討候補 / user 判断 trigger | **保留登録**（user 判断 trigger） | B-08 |
| 9 | Phase 12 compliance の判定ルール統一（pending と PASS の混同防止） | 運用 | 全 task の Phase 12 compliance check に運用ルール 1（staging smoke 表記）を組み込む | task-specification-creator skill 改善（skill-feedback-report.md と連動） | B-09 |
| 10 | Sheets runtime kill-switch / cron 停止確認（B-01 削除前の暫定停止） | 実作業（runtime安全化） | `/admin/sync` mount、unknown cron fallback、`wrangler.toml` Sheets cron を確認し、削除前に停止条件を AC 化する | **新規** unassigned-task: `task-ut09-runtime-kill-switch-001` | B-10 |

> open question 6 件（#1〜#7 のうち #3 を除く 6 件 = #1, #2, #4, #5, #6, #7）+ 追加 4 件（#3 移植 / #8 案 b 将来 / #9 compliance ルール統一 / #10 runtime kill-switch） = 計 **10 件**。

## 2. 種別カバー範囲（4 種揃い確認）

| 種別 | 該当 # |
| --- | --- |
| 撤回（コード / migration / Secret / endpoint） | #1, #2, #7 |
| 移植（知見 / 仕様継承） | #3 |
| 削除 / 復元（旧 root / unrelated cleanup） | #4, #6 |
| 整合確認 / 戦略 / 運用 | #5, #8, #9, #10 |

## 3. 各検出項目の優先度 / 順序

| 優先度 | # | 理由 |
| --- | --- | --- |
| 高（次 wave） | #4 (B-04) | 旧 UT-09 root の direct implementation 化記述が残ると衝突再発リスク |
| 高（次 wave） | #1 (B-01) | コード共存リスクの解消 |
| 高（次 wave） | #2 (B-02) | migration 共存による ledger 不安定化解消 |
| 高（次 wave） | #10 (B-10) | B-01/B-02/B-07 完了前に Sheets runtime が動くリスクを止める |
| 中（次 wave 内） | #5 (B-05) | references stale audit。A 維持時の整合確認 |
| 中（次 wave 内） | #7 (B-07) | Sheets Secret hygiene |
| 中（独立 PR） | #6 (B-06) | unrelated cleanup |
| 中（既存タスク反映） | #3 (B-03) | 03a / 03b / 09b の AC 更新 |
| 低（戦略） | #8 (B-08) | Sheets 将来採用判断（trigger 待ち） |
| 低（skill 改善） | #9 (B-09) | task-specification-creator skill 改善 |

## 4. 別タスク化の方針（docs-only 境界の貫徹）

- 本 reconciliation タスクは **docs-only / spec_created** で close-out。
- 上記 10 件は **本 PR に混入させない**（運用ルール 2）。
- 各 unassigned-task の起票は本 Phase 12 完了後または Phase 13 PR レビュー後に行う。
- 現時点では `pending_creation`。検出と実ファイル起票を混同しない。
- B-08（Sheets 将来採用）は本ファイル内に「保留登録」として記録するに留める。

## 5. セルフチェック

- [x] Phase 3 の open question 6 件相当（撤回 / migration / 旧 root / references / unrelated / Secret）が含まれる
- [x] 撤回 / 移植 / 削除 / 整合確認 の 4 種が揃っている
- [x] 各検出項目に割り当て先（既存タスク or 新規 unassigned-task ID）が明示
- [x] 10 件すべてに blocker ID（B-01〜B-10）対応が付与
- [x] 0 件でも出力必須のルールに従い、明示的に 10 件すべてを記述

---

状態: spec_created
