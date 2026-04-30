# Phase 6: 異常系検証（reconciliation 失敗ケース）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-09 direction reconciliation（task-ut09-direction-reconciliation-001） |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証（reconciliation 失敗ケース） |
| 作成日 | 2026-04-29 |
| 前 Phase | 5 (reconciliation 実行ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | spec_created |
| タスク状態 | blocked（GitHub Issue #94 は CLOSED でも仕様書 blocked） |
| タスク分類 | docs-only / direction-reconciliation（failure-case → reconciliation 失敗系） |

## 目的

Phase 5 で組み立てた reconciliation runbook（採用 A 撤回 / 移植 / 同期、採用 B 更新、ロールバック、別タスク register）に対し、**reconciliation そのものが失敗するパターン**を 5 層（撤回 / 移植 / 同期 / 別タスク化 / 採用 B 承認運用）で網羅する。コード実装タスクと違い、本タスクの failure case は「文書整合性が保てない」「正本が二重化したまま残る」「unrelated 削除が PR に紛れ込む」「secret 名が不一致のまま放置」のような **文書 / 正本 / 運用の品質劣化** が中心となる。各ケースに対し検出方法（Phase 4 のスキャンを再利用）と回避策（Phase 5 runbook へのフィードバック）を揃え、Phase 7 AC マトリクスでトレース可能にする。

## 実行タスク

1. failure case を 5 層別に列挙し、12 件以上のマトリクスを完成する（完了条件: 各ケースに分類 / 原因 / 検出 / 回避策 / 対応 Phase の 5 項目が埋まる）。
2. 撤回漏れ（stale Sheets 実装が「正本」として残る）ケースを 3 件以上記述する（完了条件: コード / migration / Secret の各軸でケース提示）。
3. 移植漏れ（D1 contention mitigation 知見が消える）ケースを 2 件以上記述する（完了条件: WAL 非前提 / retry-backoff / batch-size の知見ごとに失敗パターン）。
4. unrelated PR mixing（verification-report 削除など）の混入ケースを記述する（完了条件: 検出方法 + 回避策が運用ルール 2 と整合）。
5. ledger 二重化（`sync_jobs` と `sync_locks` の併存）ケースを記述する（完了条件: database-schema.md スキャンとの連動）。
6. secret 名不一致（`GOOGLE_SHEETS_SA_JSON` vs `GOOGLE_FORM_ID` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY`）ケースを記述する（完了条件: environment-variables.md / deployment-cloudflare.md スキャンとの連動）。
7. 採用 B 未承認のまま same-wave 更新着手 / 採用 A 着手後の方針再選定 のような運用系異常を記述する（完了条件: ロールバック手順 4 ケースとの 1:1 対応）。
8. 各ケースを Phase 4 のスキャン項目（4 種類スキャン / 11 キーワード）にマップする（完了条件: 全ケースで対応スキャンが特定）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut09-direction-reconciliation/phase-02.md | 撤回 / 移植 / same-wave 差分マッピング |
| 必須 | docs/30-workflows/ut09-direction-reconciliation/phase-03.md | base case = 案 a / 運用ルール 2 件 / open question 6 件 |
| 必須 | docs/30-workflows/ut09-direction-reconciliation/phase-04.md | 4 種スキャン / 11 キーワードマトリクス |
| 必須 | docs/30-workflows/ut09-direction-reconciliation/phase-05.md | 撤回 / 移植 / 同期 / ロールバック / 別タスク register |
| 必須 | docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md | current 方針正本 |
| 必須 | docs/30-workflows/02-application-implementation/04c-parallel-admin-backoffice-api-endpoints/index.md | 04c 整合 |
| 必須 | docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md | 09b 整合 |
| 必須 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | endpoint 正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | ledger 正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/environment-variables.md / .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | secret 正本 |
| 必須 | CLAUDE.md | 不変条件 #1/#4/#5/#6 / solo 運用ポリシー |
| 参考 | docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/phase-06.md | 同種 Sheets 系 blocked タスクの先行 failure case |

## 実行手順

failure cases マトリクスを作成し、撤回漏れ・移植漏れ・unrelated PR mixing の復旧 runbook と Phase 4 スキャンへの wire-in を順に確認する。

## failure cases マトリクス（reconciliation 失敗系）

| # | 分類 | ケース | 原因 | 検出（Phase 4 スキャン再利用） | 回避策 | 対応 Phase |
| - | --- | --- | --- | --- | --- | --- |
| 1 | 撤回漏れ（コード） | `apps/api/src/jobs/sync-sheets-to-d1.ts` 系が「正本」扱いのまま残る | 別タスク（withdrawal）が起票されない / Phase 12 detection 漏れ | scan-checklist.md の `rg -l 'sync-sheets-to-d1' docs/ .claude/` で 1 件以上ヒット | Phase 12 unassigned-task-detection.md に `task-ut09-sheets-implementation-withdrawal-001` を必ず登録 | 5, 9, 12 |
| 2 | 撤回漏れ（migration） | `sync_locks` / `sync_job_logs` が `database-schema.md` の正本テーブルとして登録されたまま | reconciliation 後の references 同期が漏れる | `rg 'sync_locks\|sync_job_logs' .claude/skills/aiworkflow-requirements/references/database-schema.md` で正本登録ヒット | Step 4 indexes drift 検証で必ずゼロ化 / `pnpm indexes:rebuild` 後に再 review | 5, 9 |
| 3 | 撤回漏れ（Secret） | `GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` が environment-variables.md / deployment-cloudflare.md に正本登録されたまま | 採用 A 時の secret 廃止記述が反映されない | `rg 'GOOGLE_SHEETS_SA_JSON\|SHEETS_SPREADSHEET_ID' .claude/skills/aiworkflow-requirements/references/environment-variables.md / .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` で「廃止候補」コンテキスト以外でヒット | 採用 A 時は「廃止候補」明記、Cloudflare Secret は別タスクで `bash scripts/cf.sh secret delete` | 5, 9 |
| 4 | 撤回漏れ（旧 UT-09 root） | `ut-09-sheets-to-d1-cron-sync-job/index.md` が direct implementation 化記述のまま | `task-ut09-root-restore-legacy-umbrella-ref-001` 起票漏れ | `rg 'direct implementation' docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/` ヒット | Phase 12 detection 必須登録 / Step A4 完了確認 | 5, 9, 12 |
| 5 | 移植漏れ（WAL 非前提） | 03a / 03b に「D1 のロック特性に依存しない設計」AC が記述されない | Step P1 移植が別タスクで実施される際の指示漏れ | `rg 'WAL\|ロック特性\|short transaction' docs/30-workflows/02-application-implementation/03a*/index.md docs/30-workflows/02-application-implementation/03b*/index.md` で 0 件 | 移植 PR レビュー時に scan-checklist.md「移植対象スキャン」5 行を必須 review 項目化 | 5, 9 |
| 6 | 移植漏れ（retry-backoff） | 09b に exponential backoff / 最大試行回数の記述が無い | Step P2 移植漏れ | `rg 'exponential backoff\|retry' docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md` で 0 件 | 同上 | 5, 9 |
| 7 | 移植漏れ（batch-size 制限） | 03a / 03b / 09b いずれかに batch-size 上限記述が無い | Step P2 移植漏れ | `rg 'batch.{0,30}(size\|件数\|上限)' docs/30-workflows/02-application-implementation/03a*/ docs/30-workflows/02-application-implementation/03b*/ docs/30-workflows/09b*/` で 0 件 | 同上 | 5, 9 |
| 8 | 同期漏れ（endpoint 認可境界） | 04c が `/admin/sync` 単一 endpoint を「正本」記述したまま | reconciliation 結論が 04c に反映されない | `rg '^.*POST /admin/sync\s*$\|単一.*endpoint' docs/30-workflows/02-application-implementation/04c*/index.md` で正本ヒット | Step 3 S4 同期確認コマンドを Phase 9 必須 gate 化 | 5, 9 |
| 9 | ledger 二重化 | `sync_jobs` と `sync_locks` + `sync_job_logs` 両方が正本登録 | 採用 A の Step 2 撤回が完了しないまま indexes rebuild | `rg -c 'sync_jobs' .claude/skills/aiworkflow-requirements/references/database-schema.md` と `rg -c 'sync_locks' ...` の両者が正の値 | Phase 9 で baseline diff を必須化 / 二重ヒット時は Phase 5 ロールバック | 5, 6, 9 |
| 10 | secret 名不一致 | `GOOGLE_SHEETS_SA_JSON` と Forms 正本 3 変数のどちらが有効か曖昧 | 採用 A 時の正本（`GOOGLE_FORM_ID` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY`）が environment-variables.md / deployment-cloudflare.md と一致しない | `rg 'GOOGLE_FORM_ID|GOOGLE_SERVICE_ACCOUNT_EMAIL|GOOGLE_PRIVATE_KEY' .claude/skills/aiworkflow-requirements/references/environment-variables.md .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` で 3 件すべて確認 | 採用 A 完了時に必ず Forms 3 変数を正本登録、Sheets 系は「廃止候補」明記 | 5, 9 |
| 11 | unrelated PR mixing | reconciliation PR に verification-report 削除が紛れ込む | 別タスク化（運用ルール 2）の遵守失敗 | `git diff main...HEAD --stat` で `docs/30-workflows/.../verification-report*` 削除がヒット | 運用ルール 2 厳守 / `task-cleanup-verification-reports-001` を別タスク化 / Phase 13 GO/NO-GO で NO-GO | 3, 12, 13 |
| 12 | staging smoke pending を PASS と誤記 | Phase 12 compliance で実機未走行のまま PASS と書く | 運用ルール 1 の遵守失敗 | `rg 'PASS' outputs/phase-12/` ヒット箇所で実機走行ログが対応していない | 運用ルール 1 厳守 / Phase 12 で「pending / PASS / FAIL」の 3 値表記を必須化 | 3, 12 |
| 13 | 採用 B 未承認のまま same-wave 更新着手 | ユーザー承認なしで legacy umbrella spec / 03a / 03b / 04c / 09b を Sheets 前提に更新 | 運用ルール（Phase 3 NO-GO 条件）の違反 | `git log --all --grep='Sheets採用\|switch to Sheets'` ヒット + `outputs/phase-05/user-approval-record.md` 不在 | Step B0 で承認文を必ず保存 / 承認なし着手時は本 reconciliation を Phase 2 に差し戻す | 3, 5, 13 |
| 14 | 採用 A 着手後の方針再選定（B 切替要求） | reconciliation 進行中に B への切替がユーザー要求された | 想定外の運用イベント | runbook に明示的検出なし（ユーザー指示で発火） | Phase 5 ロールバック手順「採用 B 着手後に承認撤回」と対称な「採用 A 着手後に B 切替」runbook を Phase 12 で起票 | 5, 12 |
| 15 | aiworkflow-requirements indexes drift | reconciliation 完了 PR で `verify-indexes-up-to-date` CI gate が fail | `pnpm indexes:rebuild` の実行漏れ | `gh pr checks` で `verify-indexes-up-to-date` が fail | Step 4 を別タスク PR 着手前の必須前提に / lefthook prepare 経由で local 確認 | 5, 9, 13 |
| 16 | docs-only 境界違反 | 本 reconciliation タスク内でコード変更 / migration up/down / Secret put が実行される | runbook の「別タスク化」運用が無視される | `git diff main...HEAD -- 'apps/api/src/**' 'apps/web/src/**' 'apps/api/migrations/**'` で変更検出 | Phase 13 GO/NO-GO で「docs-only 境界違反」を NO-GO 条件として固定 | 5, 13 |
| 17 | open question 別タスク化漏れ | open question 6 件のうち 4 件が Phase 12 detection.md に登録されない | Phase 12 で detection 列挙ミス | `rg 'task-ut09-(sheets-implementation-withdrawal\|d1-contention-knowledge-port\|root-restore-legacy-umbrella-ref)\|cleanup-verification-reports' outputs/phase-12/unassigned-task-detection.md` で 4 件未満 | Phase 12 完了条件に「4 件登録」を必須化 | 5, 12 |

合計: 17 件（要件 12 件以上を満たす）。

## 撤回漏れの独立 runbook（5 ケース統合）

```
reconciliation 完了宣言（Phase 12 phase12-task-spec-compliance-check.md）
  → scan-checklist.md「撤回対象スキャン」5 行を再走査
    → 「正本」コンテキストでヒット → 即 BLOCKED
      → 該当別タスク（withdrawal / root-restore）を Phase 12 detection.md に追補
      → 本 reconciliation の Phase 9 同期チェックを再実施まで PR 化禁止
    → 「廃止候補」「採用 B 時のみ」コンテキストでのみヒット → PASS
```

## 移植漏れの独立 runbook（5 知見統合）

03a / 03b / 09b への移植は別タスクで実施されるが、本 reconciliation の Phase 9 同期チェックで以下を **必須 gate** とする:

| 知見 | 必須記述 | scan command |
| --- | --- | --- |
| WAL 非前提 / short transaction | `03a/index.md` + `03b/index.md` | `rg 'WAL\|short transaction\|ロック特性' docs/30-workflows/02-application-implementation/{03a,03b}*/index.md` で 2 件以上 |
| retry/backoff | `03a` + `03b` + `09b` | `rg 'exponential backoff\|retry' docs/30-workflows/02-application-implementation/{03a,03b}*/index.md docs/30-workflows/09b*/index.md` で 3 件以上 |
| batch-size 制限 | 同上 | `rg 'batch.{0,30}(size\|件数\|上限)' ...` で 3 件以上 |
| 二重起動防止 | `09b` | `rg '二重起動\|idempotency\|lock' docs/30-workflows/09b*/index.md` で 1 件以上 |

## unrelated PR mixing 防止 runbook

03 で確定した運用ルール 2（unrelated verification-report 削除を本 PR に混ぜない）を **検出可能** にする手順:

```bash
# 本 reconciliation PR の変更ファイル一覧で verification-report が削除されていないこと
git diff --name-status main...HEAD | rg '^D.*verification-report'
# → ヒットあり = NO-GO

# verification-report 削除は別タスクで実施
# 別タスク仮称: task-cleanup-verification-reports-001
ls docs/30-workflows/unassigned-task/task-cleanup-verification-reports-001.md
```

## 各ケース ↔ Phase 4 スキャン wire-in

| Case # | 対応スキャン（Phase 4） |
| --- | --- |
| 1 | 撤回対象スキャン #1（コード遺物） |
| 2, 9 | 撤回対象スキャン #3, #4（ledger） / aiworkflow-requirements indexes drift |
| 3, 10 | 撤回対象スキャン #5 / aiworkflow-requirements indexes drift（secret） |
| 4 | 撤回対象スキャン #6（旧 UT-09 root） |
| 5, 6, 7 | 移植対象スキャン #1, #2, #3 |
| 8 | 5 文書同期スキャン #4（04c） |
| 11 | scan-checklist.md キーワード `unrelated` / `verification-report`（Phase 4 補助） |
| 12 | scan-checklist.md キーワード `pending` / `PASS` |
| 13 | `outputs/phase-05/user-approval-record.md` 不在検出（Phase 5 ロールバック対象） |
| 14 | runbook 拡張（Phase 12 起票） |
| 15 | aiworkflow-requirements indexes drift |
| 16 | git diff（Phase 4 4 種スキャン外、Phase 13 ローカル check と連結） |
| 17 | Phase 12 unassigned-task-detection.md スキャン |

## 復旧 runbook（代表 3 ケース）

### Case 9: ledger 二重化

```bash
# baseline 確認
rg -c 'sync_jobs' .claude/skills/aiworkflow-requirements/references/database-schema.md
rg -c 'sync_locks\|sync_job_logs' .claude/skills/aiworkflow-requirements/references/database-schema.md

# 二重化検出 → Phase 5 ロールバック
# 採用 A の Step 2（撤回）を完了させる別タスクが起票されていることを確認
ls docs/30-workflows/unassigned-task/task-ut09-sheets-implementation-withdrawal-001.md

# 起票後、indexes rebuild
mise exec -- pnpm indexes:rebuild
git status .claude/skills/aiworkflow-requirements/indexes/
```

### Case 11: unrelated verification-report 削除混入

```bash
# 検出
git diff --name-status main...HEAD | rg '^D.*verification-report'

# 復旧 = 該当削除を本 PR から取り戻す
git checkout main -- docs/30-workflows/<該当パス>/verification-report*
git add docs/30-workflows/<該当パス>/verification-report*
git commit -m "revert: restore verification-report (out of scope for reconciliation PR)"

# 別タスク化
touch docs/30-workflows/unassigned-task/task-cleanup-verification-reports-001.md
```

### Case 13: 採用 B 未承認のまま same-wave 更新着手

```bash
# 検出
test -f docs/30-workflows/ut09-direction-reconciliation/outputs/phase-05/user-approval-record.md \
  || echo "BLOCKED: 採用 B 着手にユーザー承認が未取得"

# 復旧 = 採用 A へフォールバック（Phase 2 Mermaid の B 未承認経路）
# 1. same-wave 更新の差分を revert
# 2. Phase 5 採用 A runbook へ切替
# 3. artifacts.json の base case を 採用 A に確定
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | 17 件 failure case を AC マトリクスの「関連 failure case」列に紐付け |
| Phase 8 | 撤回漏れ / 移植漏れ / 同期漏れの検出ロジックの DRY 化（scan-checklist.md の bash 1-liner 集約） |
| Phase 9 | 17 件すべてに対応するスキャンを Phase 5 Step 0 / Step 5 で実行し、diff を保存 |
| Phase 10 | docs-only 境界違反（#16） / unrelated 混入（#11） / staging smoke 誤記（#12）を blocker 評価対象 |
| Phase 11 | 復旧 runbook 代表 3 ケースを手動 dry-run（実 revert はしない、コマンド reachability の確認のみ） |
| Phase 12 | open question 別タスク化漏れ（#17）を unassigned-task-detection.md の必須 4 件として固定 |
| Phase 13 | docs-only 境界違反（#16）+ unrelated 混入（#11）+ indexes drift（#15）を NO-GO 条件として確定 |

## 多角的チェック観点

- 価値性: 各ケースが reconciliation の品質劣化を阻止する具体検出を持つか。
- 実現性: docs-only 範囲で検出 + 回避策が完結するか（コード追加・migration 実行を含まない）。
- 整合性（不変条件 #1）: 移植漏れケースが schema mapper 閉じ込め方針を破壊しないか。
- 整合性（不変条件 #4）: ledger 二重化ケースが admin-managed data 専用テーブル分離を維持するか。
- 整合性（不変条件 #5）: 撤回漏れケースが D1 access の `apps/api` 内閉じ込めを維持するか。
- 整合性（不変条件 #6）: 撤回漏れケースが GAS prototype 延長を本番昇格させていないか。
- 運用性: 復旧 runbook が `bash scripts/cf.sh` 経由 / `pnpm indexes:rebuild` 経由のみか。
- 認可境界: ケース 8（04c 同期漏れ）が `/admin/sync*` 認可境界の正本性を維持するか。
- D1 ledger 一意性: ケース 9（ledger 二重化）に Phase 9 必須 gate が割当てられているか。
- Secret hygiene: ケース 3 / 10（secret 名関連）に検出スキャンが割当てられているか。
- 5 文書同期: ケース 8（同期漏れ）が 5 文書すべてに展開可能か。
- docs-only 境界: ケース 16 が docs-only 違反を確実に検出するか。
- 採用 B 承認: ケース 13 がユーザー承認不在時の自動ブロックを構築できるか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 17 件 failure case マトリクス | 6 | spec_created | 5 層 × 3 件以上 |
| 2 | 撤回漏れ統合 runbook | 6 | spec_created | 5 ケース統合 |
| 3 | 移植漏れ統合 runbook | 6 | spec_created | 5 知見統合 |
| 4 | unrelated PR mixing 防止 runbook | 6 | spec_created | git diff スキャン |
| 5 | Phase 4 スキャン wire-in 表 | 6 | spec_created | 17 件全件 |
| 6 | 代表 3 ケース復旧 runbook | 6 | spec_created | Case 9 / 11 / 13 |
| 7 | docs-only 境界違反検出（#16） | 6 | spec_created | Phase 13 NO-GO 連動 |
| 8 | open question 別タスク化漏れ（#17） | 6 | spec_created | Phase 12 必須 4 件 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/failure-cases.md | 17 件マトリクス + 撤回漏れ / 移植漏れ統合 runbook + 復旧コマンド |
| メタ | artifacts.json | Phase 6 状態の更新 |

## 完了条件

- [ ] 12 件以上の failure case が 5 層別に網羅
- [ ] 撤回漏れケースが 3 件以上（コード / migration / Secret / 旧 UT-09 root の 4 軸でカバー）
- [ ] 移植漏れケースが 2 件以上（5 知見のうち少なくとも 3 件にケース提示）
- [ ] unrelated PR mixing 防止が独立節で記述
- [ ] ledger 二重化（#9）と secret 名不一致（#10）が独立ケースとして記述
- [ ] 採用 B 未承認着手（#13）と docs-only 境界違反（#16）と open question 別タスク化漏れ（#17）が記述
- [ ] 全ケースに Phase 4 スキャン wire-in が割当
- [ ] 代表 3 ケースの復旧 runbook が `bash scripts/cf.sh` / `pnpm indexes:rebuild` 経由で記述
- [ ] 復旧 runbook 内でコード変更 / migration up/down が登場しない（docs-only 境界遵守）

## タスク100%実行確認【必須】

- 全実行タスク（8 件）が `spec_created`
- 成果物が `outputs/phase-06/failure-cases.md` に配置済み
- 17 件全てに 5 項目（分類 / 原因 / 検出 / 回避策 / 対応 Phase）が記入
- Phase 5 runbook の例外パス（撤回漏れ / 移植漏れ / 同期漏れ / 採用 B 未承認 / docs-only 違反 / indexes drift）が全て failure case に対応
- artifacts.json の `phases[5].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 7 (AC マトリクス)
- 引き継ぎ事項:
  - 17 件の failure case ID（#1〜#17）を AC マトリクスの「関連 failure case」列で参照
  - 撤回漏れ / 移植漏れ / 同期漏れの 3 統合 runbook を Phase 9 必須 gate に予約
  - docs-only 境界違反（#16）/ unrelated 混入（#11）/ indexes drift（#15）を Phase 13 NO-GO 条件に予約
  - open question 別タスク化漏れ（#17）を Phase 12 unassigned-task-detection.md の必須 4 件として固定
  - 復旧 runbook 代表 3 ケース（#9 / #11 / #13）を Phase 11 手動 dry-run 対象に予約
- ブロック条件:
  - 12 件未満で Phase 7 へ進む
  - 撤回漏れ / 移植漏れ / 同期漏れの 3 系統のいずれかが欠落
  - Phase 4 スキャン wire-in が未割当のケースが残る
  - docs-only 境界違反（#16）が記述されない
