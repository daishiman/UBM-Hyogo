# Failure Cases — UT-09 direction reconciliation Phase 6 異常系検証

正本仕様: `../../phase-06.md`
前提: `../phase-01/main.md` / `../phase-02/reconciliation-design.md` / `../phase-02/option-comparison.md` / `../phase-03/main.md` / `../phase-05/reconciliation-runbook.md`

本書は docs-only reconciliation の **完了前後で発生し得る異常系** を 17 件、5 層（撤回 / 移植 / 同期 / 別タスク化 / 採用 B 承認運用）で網羅する。各ケースに「分類 / 原因 / 検出（Phase 4 スキャン再利用）/ 影響範囲 / 回復手順 / 対応 Phase」を割当て、Phase 7 AC マトリクスからトレース可能にする。本タスクは docs-only であり、回復手順もコード変更・migration up/down・Secret put を伴わない（実コード反映は別タスク）。

---

## 1. failure cases マトリクス（17 件）

| # | 分類 | ケース | 原因 | 検出（Phase 4 スキャン再利用） | 影響範囲 | 回復手順 | 対応 Phase |
| - | --- | --- | --- | --- | --- | --- | --- |
| 1 | 撤回漏れ（コード遺物） | `apps/api/src/jobs/sync-sheets-to-d1.ts` 系 Sheets ジョブが「正本」扱いのまま残る | withdrawal 別タスク未起票 / Phase 12 detection 漏れ | `rg -l 'sync-sheets-to-d1' docs/ .claude/` で 1 件以上ヒット | 採用 A 完了宣言後も Sheets 直接実装が正本扱いとなり、03a / 03b の Forms 分割方針と二重正本化。後続実装者が誤って Sheets 系を拡張する | Phase 12 unassigned-task-detection.md に `task-ut09-sheets-implementation-withdrawal-001` を必ず登録 → 別タスク完了まで本 reconciliation の PR 化を BLOCKED 維持 | 5, 9, 12 |
| 2 | 撤回漏れ（migration / ledger） | `sync_locks` / `sync_job_logs` が `database-schema.md` の正本テーブルとして登録されたまま | reconciliation 後の references 同期漏れ | `rg 'sync_locks\|sync_job_logs' .claude/skills/aiworkflow-requirements/references/database-schema.md` で正本登録ヒット | `sync_jobs` と `sync_locks`+`sync_job_logs` が同時に正本となり ledger 二重化（Case 9 と複合）。admin endpoint / cron handler の正本不安定化 | references を「廃止候補」コンテキストへ移動 → `mise exec -- pnpm indexes:rebuild` → `git status .claude/skills/aiworkflow-requirements/indexes/` で drift ゼロ確認 → Phase 9 同期チェック再走 | 5, 9 |
| 3 | 撤回漏れ（Secret） | `GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` が environment-variables.md / deployment-cloudflare.md に正本登録されたまま | 採用 A 時の secret 廃止記述が反映されない | `rg 'GOOGLE_SHEETS_SA_JSON\|SHEETS_SPREADSHEET_ID' .claude/skills/aiworkflow-requirements/references/environment-variables.md .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` で「廃止候補」コンテキスト以外でヒット | 採用 A の Secret hygiene が破綻し、Forms 3 変数（`GOOGLE_FORM_ID` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY`）と Sheets 系が並列正本化。Cloudflare Secret 削除タイミング誤りの誘発 | references を「廃止候補（Sheets 採用時のみ）」表記に変更 → 実 Secret 削除は別タスク `task-cleanup-cloudflare-secrets-sheets-001` を起票し `bash scripts/cf.sh secret delete GOOGLE_SHEETS_SA_JSON --env <env>` を当該タスクで実施 | 5, 9 |
| 4 | 撤回漏れ（旧 UT-09 root） | `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/index.md` が direct implementation 化記述のまま | `task-ut09-root-restore-legacy-umbrella-ref-001` 起票漏れ | `rg 'direct implementation' docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/` ヒット | 旧 UT-09 root が direct implementation を主張し続け、legacy umbrella spec との整合が崩れる。同種 Sheets 系再着手の温床 | Phase 12 detection に `task-ut09-root-restore-legacy-umbrella-ref-001` を登録 → 別タスクで legacy umbrella 参照に restore → Phase 9 5 文書同期で再確認 | 5, 9, 12 |
| 5 | 移植漏れ（WAL 非前提 / short transaction） | 03a / 03b に「D1 のロック特性に依存しない設計」AC が記述されない | Step P1 移植が別タスクで実施される際の指示漏れ | `rg 'WAL\|ロック特性\|short transaction' docs/30-workflows/02-application-implementation/03a*/index.md docs/30-workflows/02-application-implementation/03b*/index.md` で 0 件 | 旧 UT-09 で蓄積された D1 contention mitigation 知見が消失し、03a / 03b の品質要件が低下。本番で contention 起点のジョブ失敗が再発 | 移植 PR レビュー時に scan-checklist.md「移植対象スキャン」5 行を必須 review 項目化 → 03a / 03b index に AC を追記する別タスクをトリガ | 5, 9 |
| 6 | 移植漏れ（retry-backoff） | 09b に exponential backoff / 最大試行回数の記述が無い | Step P2 移植漏れ | `rg 'exponential backoff\|retry' docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md` で 0 件 | cron / runbook の retry 戦略が消失し、Forms API 一時障害時のジョブ自動回復が失われる | 09b index に retry-backoff AC を追記する別タスクをトリガ → Phase 9 必須 gate で再確認 | 5, 9 |
| 7 | 移植漏れ（batch-size 制限） | 03a / 03b / 09b いずれかに batch-size 上限記述が無い | Step P2 移植漏れ | `rg 'batch.{0,30}(size\|件数\|上限)' docs/30-workflows/02-application-implementation/03a*/ docs/30-workflows/02-application-implementation/03b*/ docs/30-workflows/09b*/` で 0 件 | 大量回答時に Workers CPU / D1 binding の制限を超え、ジョブが timeout で fail | 03a / 03b / 09b に batch-size 上限を追記する別タスクをトリガ | 5, 9 |
| 8 | 同期漏れ（endpoint 認可境界） | 04c が `/admin/sync` 単一 endpoint を「正本」記述したまま | reconciliation 結論が 04c に反映されない | `rg '^.*POST /admin/sync\s*$\|単一.*endpoint' docs/30-workflows/02-application-implementation/04c*/index.md` で正本ヒット | `/admin/sync/schema` + `/admin/sync/responses` 2 endpoint 認可境界（Bearer + admin allowlist）と単一 endpoint 設計が衝突。endpoint 認可境界の漏れが常態化 | Step 3 S4 同期確認コマンドを Phase 9 必須 gate 化 → 04c index を 2 endpoint 正本に更新する別タスクをトリガ | 5, 9 |
| 9 | ledger 二重化継続 | `sync_jobs` と `sync_locks`+`sync_job_logs` が同時に正本登録 | 採用 A の Step 2 撤回が完了しないまま indexes rebuild | `rg -c 'sync_jobs' .claude/skills/aiworkflow-requirements/references/database-schema.md` と `rg -c 'sync_locks' ...` の両者が正の値 | 不変条件 #4（admin-managed data 専用テーブル分離）が崩壊し、admin endpoint / cron handler のどちらが正本か不安定化（index.md 苦戦箇所 #2） | Phase 9 で baseline diff を必須化 → 二重ヒット時は Phase 5 ロールバック手順「採用 A 撤回未完」へ → withdrawal タスク完了確認後に `pnpm indexes:rebuild` を再実行 | 5, 6, 9 |
| 10 | secret 名不一致 | `GOOGLE_SHEETS_SA_JSON` と Forms 正本 3 変数のどちらが有効か曖昧 | 採用 A 時の正本（`GOOGLE_FORM_ID` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY`）が environment-variables.md / deployment-cloudflare.md と一致しない | `rg 'GOOGLE_FORM_ID\|GOOGLE_SERVICE_ACCOUNT_EMAIL\|GOOGLE_PRIVATE_KEY' .claude/skills/aiworkflow-requirements/references/environment-variables.md .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` で 3 件すべて確認できない | 採用 A 完了後も Sheets secret が「正本」扱いされ、本番 Cloudflare Secret 削除タイミングを誤ると Forms ジョブが起動不能。Secret 削除タイミング誤りの直接原因 | references に Forms 3 変数を必ず正本登録し、Sheets 系は「廃止候補」明記 → Phase 9 同期チェック再走 → Cloudflare Secret 実削除は採用 A merge 後の別タスクで `bash scripts/cf.sh secret delete` 実行 | 5, 9 |
| 11 | unrelated 削除混入（unrelated PR mixing） | reconciliation PR に verification-report 削除など unrelated 差分が紛れ込む | 別タスク化（運用ルール 2）の遵守失敗 | `git diff --name-status main...HEAD \| rg '^D.*verification-report'` で削除ヒット | reconciliation PR のレビュー範囲が膨張し、docs-only / direction-reconciliation の責務境界が崩壊。Phase 13 GO/NO-GO の判定が不安定化 | 該当削除を `git checkout main -- <path>` で復元 → `git add` → `git commit -m "revert: restore verification-report (out of scope)"` → 別タスク `task-cleanup-verification-reports-001` を起票 → Phase 13 GO/NO-GO 再評価 | 3, 12, 13 |
| 12 | staging smoke pending と PASS の混同 | Phase 12 compliance で実機未走行のまま PASS と記載 | 運用ルール 1 の遵守失敗 | `rg 'PASS' outputs/phase-12/` ヒット箇所で実機走行ログが対応していない / pending 表記の欠落 | 実機未走行を PASS と誤認した状態で merge され、本番デプロイで初めて smoke 失敗が発覚（UT-26 staging-deploy-smoke の信頼性が崩壊） | Phase 12 で「pending / PASS / FAIL」の 3 値表記を必須化 → 該当箇所を `pending（実機未走行）` に修正 → UT-26 別タスクで実機走行後に PASS / FAIL 確定 | 3, 12 |
| 13 | 採用 B 未承認のまま same-wave 更新着手 | ユーザー承認なしで legacy umbrella spec / 03a / 03b / 04c / 09b を Sheets 前提に更新 | 運用ルール（Phase 3 NO-GO 条件）の違反 | `git log --all --grep='Sheets採用\|switch to Sheets'` ヒット + `outputs/phase-05/user-approval-record.md` 不在 | 5 文書同期失敗の代表ケース。current 方針（A）と Sheets 方針（B）が同時更新され、reconciliation が逆に正本衝突を増幅 | Step B0 で承認文を必ず保存 → 承認なし着手時は same-wave 差分を `git revert` → Phase 2 Mermaid の B 未承認経路に従い採用 A へフォールバック → artifacts.json の base case を A に確定 | 3, 5, 13 |
| 14 | 採用 A 着手後の方針再選定（B 切替要求） | reconciliation 進行中に B への切替がユーザーから要求された | 想定外の運用イベント | runbook に明示的検出なし（ユーザー指示で発火） | 採用 A の撤回 / 移植 / 同期作業が無効化され、5 文書同期の一貫性が崩れる | Phase 5 ロールバック手順「採用 B 着手後に承認撤回」と対称な「採用 A 着手後に B 切替」runbook を Phase 12 で起票 → 既着手分は revert / 別タスク化し、Phase 2 から再実行 | 5, 12 |
| 15 | aiworkflow-requirements indexes drift（stale contract 残置） | reconciliation 完了 PR で `verify-indexes-up-to-date` CI gate が fail | `pnpm indexes:rebuild` の実行漏れ / stale contract 残置 | `gh pr checks` で `verify-indexes-up-to-date` が fail / `git status .claude/skills/aiworkflow-requirements/indexes/` に diff | references 更新が indexes に伝搬せず、後続タスクが stale contract を参照。aiworkflow-requirements stale contract 残置 | Step 4 を別タスク PR 着手前の必須前提に → `mise exec -- pnpm indexes:rebuild` を実行 → diff を本 PR に同梱（lefthook prepare 経由で local 確認） | 5, 9, 13 |
| 16 | docs-only 境界違反 | 本 reconciliation タスク内でコード変更 / migration up/down / Secret put が実行される | runbook の「別タスク化」運用が無視される | `git diff main...HEAD -- 'apps/api/src/**' 'apps/web/src/**' 'apps/api/migrations/**'` で変更検出 | docs-only / direction-reconciliation の責務境界が崩壊し、本 PR が code 変更 PR と化す。レビュー範囲爆発と rollback 困難 | 該当 diff を `git checkout main -- <path>` で復元 → 該当変更を別タスク（withdrawal / contention port / migration）として起票 → Phase 13 GO/NO-GO で「docs-only 境界違反」を NO-GO 条件として固定 | 5, 13 |
| 17 | open question 別タスク化漏れ | open question 6 件のうち 4 件（withdrawal / contention port / root-restore / cleanup-verification-reports）が Phase 12 detection.md に登録されない | Phase 12 で detection 列挙ミス | `rg 'task-ut09-(sheets-implementation-withdrawal\|d1-contention-knowledge-port\|root-restore-legacy-umbrella-ref)\|cleanup-verification-reports' outputs/phase-12/unassigned-task-detection.md` で 4 件未満 | reconciliation 完了後に必要な 4 別タスクが消失し、撤回 / 移植 / unrelated 削除が永続的に未処理化 | Phase 12 完了条件に「4 件登録」を必須化 → detection.md を補完 → Phase 9 で再確認 | 5, 12 |

合計 17 件（要件 12 件以上を満たす）。5 層内訳:

- 撤回漏れ: #1（コード）/ #2（migration）/ #3（Secret）/ #4（旧 UT-09 root） = 4 件
- 移植漏れ: #5（WAL）/ #6（retry-backoff）/ #7（batch-size） = 3 件
- 同期漏れ: #8（endpoint）/ #9（ledger 二重化）/ #10（secret 名）/ #15（indexes drift） = 4 件
- 別タスク化 / 運用境界: #11（unrelated 混入）/ #16（docs-only 違反）/ #17（open question） = 3 件
- 採用 B 承認運用 / 採用切替: #12（pending/PASS）/ #13（B 未承認）/ #14（A → B 切替） = 3 件

---

## 2. 撤回漏れ統合 runbook（Case #1〜#4）

reconciliation 完了宣言（Phase 12 phase12-task-spec-compliance-check.md）時点で以下を必ず再走査する。

```
reconciliation 完了宣言
  → scan-checklist.md「撤回対象スキャン」5 行を再走査
    → 「正本」コンテキストでヒット → 即 BLOCKED
      → 該当別タスク（withdrawal / root-restore）を Phase 12 detection.md に追補
      → 本 reconciliation の Phase 9 同期チェックを再実施まで PR 化禁止
    → 「廃止候補」「採用 B 時のみ」コンテキストでのみヒット → PASS
```

スキャン対象（Phase 4 撤回対象スキャン #1〜#6）:

```bash
rg -l 'sync-sheets-to-d1' docs/ .claude/                                              # Case #1
rg 'sync_locks|sync_job_logs' .claude/skills/aiworkflow-requirements/references/database-schema.md  # Case #2, #9
rg 'GOOGLE_SHEETS_SA_JSON|SHEETS_SPREADSHEET_ID' \
  .claude/skills/aiworkflow-requirements/references/environment-variables.md \
  .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md          # Case #3, #10
rg 'direct implementation' docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/        # Case #4
```

---

## 3. 移植漏れ統合 runbook（Case #5〜#7）

03a / 03b / 09b への移植は別タスクで実施されるが、本 reconciliation の Phase 9 同期チェックで以下を **必須 gate** とする:

| 知見 | 必須記述位置 | scan command | 通過条件 |
| --- | --- | --- | --- |
| WAL 非前提 / short transaction | 03a/index.md + 03b/index.md | `rg 'WAL\|short transaction\|ロック特性' docs/30-workflows/02-application-implementation/{03a,03b}*/index.md` | 2 件以上 |
| retry/backoff | 03a + 03b + 09b | `rg 'exponential backoff\|retry' docs/30-workflows/02-application-implementation/{03a,03b}*/index.md docs/30-workflows/09b*/index.md` | 3 件以上 |
| batch-size 制限 | 03a + 03b + 09b | `rg 'batch.{0,30}(size\|件数\|上限)' ...` | 3 件以上 |
| 二重起動防止 | 09b | `rg '二重起動\|idempotency\|lock' docs/30-workflows/09b*/index.md` | 1 件以上 |

未達ヒット時は `task-ut09-d1-contention-knowledge-port-001` を Phase 12 detection.md に登録し、別タスクで 03a / 03b / 09b index を更新する。

---

## 4. unrelated PR mixing 防止 runbook（Case #11）

Phase 3 で確定した運用ルール 2（unrelated verification-report 削除を本 PR に混ぜない）を **検出可能** にする。

```bash
# 本 reconciliation PR の変更ファイル一覧で verification-report が削除されていないこと
git diff --name-status main...HEAD | rg '^D.*verification-report'
# → ヒットあり = NO-GO

# 復旧手順
git checkout main -- docs/30-workflows/<該当パス>/verification-report*
git add docs/30-workflows/<該当パス>/verification-report*
git commit -m "revert: restore verification-report (out of scope for reconciliation PR)"

# 別タスク化
ls docs/30-workflows/unassigned-task/task-cleanup-verification-reports-001.md \
  || echo "起票必須: task-cleanup-verification-reports-001"
```

---

## 5. 各ケース ↔ Phase 4 スキャン wire-in（17 件全件）

| Case # | 対応スキャン（Phase 4 / scan-checklist.md） |
| --- | --- |
| #1 | 撤回対象スキャン #1（コード遺物） |
| #2, #9 | 撤回対象スキャン #3, #4（ledger） / aiworkflow-requirements indexes drift |
| #3, #10 | 撤回対象スキャン #5（secret） / aiworkflow-requirements indexes drift |
| #4 | 撤回対象スキャン #6（旧 UT-09 root） |
| #5, #6, #7 | 移植対象スキャン #1, #2, #3 |
| #8 | 5 文書同期スキャン #4（04c） |
| #11 | scan-checklist.md キーワード `unrelated` / `verification-report`（Phase 4 補助） |
| #12 | scan-checklist.md キーワード `pending` / `PASS` |
| #13 | `outputs/phase-05/user-approval-record.md` 不在検出（Phase 5 ロールバック対象） |
| #14 | runbook 拡張（Phase 12 起票、Phase 4 直接スキャン外） |
| #15 | aiworkflow-requirements indexes drift（CI gate `verify-indexes-up-to-date`） |
| #16 | git diff（Phase 4 4 種スキャン外、Phase 13 ローカル check と連結） |
| #17 | Phase 12 unassigned-task-detection.md スキャン |

11 キーワード（Phase 4 マトリクス）すべてが少なくとも 1 ケースに紐付くことを確認済み: `sync-sheets-to-d1` / `sync_locks` / `sync_job_logs` / `GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` / `direct implementation` / `単一 endpoint` / `WAL` / `exponential backoff` / `pending` / `verification-report`。

---

## 6. 復旧 runbook（代表 3 ケース）

### Case #9: ledger 二重化継続

```bash
# baseline 確認
rg -c 'sync_jobs' .claude/skills/aiworkflow-requirements/references/database-schema.md
rg -c 'sync_locks|sync_job_logs' .claude/skills/aiworkflow-requirements/references/database-schema.md

# 二重化検出 → Phase 5 ロールバック
# 採用 A の Step 2（撤回）を完了させる別タスクが起票されていることを確認
ls docs/30-workflows/unassigned-task/task-ut09-sheets-implementation-withdrawal-001.md \
  || echo "BLOCKED: withdrawal タスク未起票"

# 起票後、indexes rebuild
mise exec -- pnpm indexes:rebuild
git status .claude/skills/aiworkflow-requirements/indexes/
```

### Case #11: unrelated verification-report 削除混入

```bash
# 検出
git diff --name-status main...HEAD | rg '^D.*verification-report'

# 復旧 = 該当削除を本 PR から取り戻す
git checkout main -- docs/30-workflows/<該当パス>/verification-report*
git add docs/30-workflows/<該当パス>/verification-report*
git commit -m "revert: restore verification-report (out of scope for reconciliation PR)"

# 別タスク化
ls docs/30-workflows/unassigned-task/task-cleanup-verification-reports-001.md \
  || echo "起票必須: task-cleanup-verification-reports-001"
```

### Case #13: 採用 B 未承認のまま same-wave 更新着手

```bash
# 検出
test -f docs/30-workflows/ut09-direction-reconciliation/outputs/phase-05/user-approval-record.md \
  || echo "BLOCKED: 採用 B 着手にユーザー承認が未取得"

# 復旧 = 採用 A へフォールバック（Phase 2 Mermaid の B 未承認経路）
# 1. same-wave 更新の差分を git revert で巻き戻す
# 2. Phase 5 採用 A runbook へ切替
# 3. artifacts.json の base case を 採用 A に確定
```

復旧 runbook はいずれも `bash scripts/cf.sh` ラッパー（Cloudflare 系操作時）/ `mise exec -- pnpm indexes:rebuild`（indexes 再生成）/ `git` 操作のみで完結し、コード変更・migration up/down は登場しない（docs-only 境界遵守）。

---

## 7. 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | 17 件 failure case を AC マトリクスの「関連 failure case」列に紐付け |
| Phase 8 | 撤回漏れ / 移植漏れ / 同期漏れの検出ロジックの DRY 化（scan-checklist.md の bash 1-liner 集約） |
| Phase 9 | 17 件すべてに対応するスキャンを Phase 5 Step 0 / Step 5 で実行し、diff を保存 |
| Phase 10 | docs-only 境界違反（#16）/ unrelated 混入（#11）/ staging smoke 誤記（#12）を blocker 評価対象 |
| Phase 11 | 復旧 runbook 代表 3 ケース（#9 / #11 / #13）を手動 dry-run（実 revert はしない、コマンド reachability の確認のみ） |
| Phase 12 | open question 別タスク化漏れ（#17）を unassigned-task-detection.md の必須 4 件として固定 |
| Phase 13 | docs-only 境界違反（#16）+ unrelated 混入（#11）+ indexes drift（#15）を NO-GO 条件として確定 |

---

## 8. 多角的チェック観点（self review）

- 価値性: 各ケースが reconciliation の品質劣化を阻止する具体検出を持つ（17/17 件で検出コマンドを記述）。
- 実現性: docs-only 範囲で検出 + 回復が完結（コード追加・migration 実行を含まない）。
- 整合性 #1（schema 固定回避）: 移植漏れケース（#5〜#7）が schema mapper 閉じ込め方針を破壊しない。
- 整合性 #4（admin-managed data 分離）: ledger 二重化（#9）が admin-managed data 専用テーブル分離を維持。
- 整合性 #5（D1 access 閉じ込め）: 撤回漏れ（#1〜#3）が D1 access の `apps/api` 内閉じ込めを維持。
- 整合性 #6（GAS prototype 非昇格）: 撤回漏れ（#1, #4）が GAS prototype 延長を本番昇格させない。
- 運用性: 復旧 runbook が `bash scripts/cf.sh` / `pnpm indexes:rebuild` / `git` のみ。
- 認可境界: ケース #8（04c 同期漏れ）が `/admin/sync*` 認可境界の正本性を維持。
- D1 ledger 一意性: ケース #9 に Phase 9 必須 gate を割当済。
- Secret hygiene: ケース #3 / #10 に検出スキャンを割当済。
- 5 文書同期: ケース #8 が 5 文書（legacy umbrella / 03a / 03b / 04c / 09b）すべてに展開可能。
- docs-only 境界: ケース #16 が docs-only 違反を git diff で確実に検出。
- 採用 B 承認: ケース #13 がユーザー承認不在時の自動ブロックを構築。

---

## 9. 完了条件チェック

- [x] 12 件以上の failure case を 5 層別に網羅（17 件）
- [x] 撤回漏れケースが 3 件以上（#1 コード / #2 migration / #3 Secret / #4 旧 UT-09 root の 4 軸でカバー）
- [x] 移植漏れケースが 2 件以上（#5 WAL / #6 retry-backoff / #7 batch-size の 3 件）
- [x] unrelated PR mixing 防止が独立節（§4）で記述
- [x] ledger 二重化（#9）と secret 名不一致（#10）を独立ケースで記述
- [x] 採用 B 未承認着手（#13）/ docs-only 境界違反（#16）/ open question 別タスク化漏れ（#17）を記述
- [x] 全ケースに Phase 4 スキャン wire-in を割当（§5）
- [x] 代表 3 ケースの復旧 runbook が `bash scripts/cf.sh` / `pnpm indexes:rebuild` / `git` 経由で記述（§6）
- [x] 復旧 runbook 内でコード変更 / migration up/down が登場しない（docs-only 境界遵守）

---

状態: spec_created
