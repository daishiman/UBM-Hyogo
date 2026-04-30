# Phase 5: reconciliation 実行ランブック（撤回 / 移植 / 同期手順）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-09 direction reconciliation（task-ut09-direction-reconciliation-001） |
| Phase 番号 | 5 / 13 |
| Phase 名称 | reconciliation 実行ランブック |
| 作成日 | 2026-04-29 |
| 前 Phase | 4 (テスト戦略 / 文書整合性検証) |
| 次 Phase | 6 (異常系検証 / reconciliation 失敗ケース) |
| 状態 | spec_created |
| タスク状態 | blocked（GitHub Issue #94 は CLOSED でも仕様書 blocked） |
| タスク分類 | docs-only / direction-reconciliation（implementation runbook → reconciliation runbook 翻訳） |

## 目的

本タスクは **docs-only / NON_VISUAL** であるため、Phase 5 は「コード実装ランブック」ではなく **「方針統一を文書として完了させる reconciliation 実行手順」** を確定する。Phase 3 で確定した base case（採用 A: Forms 分割方針）を前提に、選択肢 A 採用時の撤回手順 5 ステップ + 移植手順 4 ステップ + 正本同期手順、選択肢 B 採用時（要ユーザー承認）の正本仕様広範囲更新手順 + same-wave 更新対象、両者共通のロールバック手順を runbook 化する。本 Phase 自身は **仕様書のみ** を生成し、コード撤回 / migration down / secret 削除 / PR 作成は別タスクへ register する。

## 実行タスク

1. 採用 A 時の撤回手順 5 ステップを順序付きで確定する（完了条件: コード撤回 / migration down / Secret 削除 / 旧 UT-09 root 復元 / api-endpoints.md 確認 が 5 ステップで埋まり、各ステップが「別タスク化」明記）。
2. 採用 A 時の移植手順 4 ステップを順序付きで確定する（完了条件: 移植先文書 4 件（03a / 03b / 09b の品質要件 + 09b の二重起動防止 runbook）への記述追加手順）。
3. 採用 A 時の正本同期手順を 5 文書 × 同期観点で確定する（完了条件: legacy umbrella / 03a / 03b / 04c / 09b の 5 文書すべてに同期確認コマンドが指定）。
4. 採用 B 時の正本仕様広範囲更新手順を確定する（完了条件: ユーザー承認取得 → 5 文書更新 → references same-wave 更新 → topic-map / LOGS rebuild → UT-26 smoke 切替 の順序付き 5 ステップ）。
5. 共通ロールバック手順を確定する（完了条件: reconciliation 着手後に方針再選定が必要となった場合、どこまで巻き戻すかを明示）。
6. 別タスク register 一覧を確定する（完了条件: open question 6 件のうち本 Phase で別タスク化が必要なものを表化）。
7. sanity check（実行前 / 実行後）を Phase 4 スキャンと連結する（完了条件: 実行前 baseline 取得 → reconciliation 実行 → 実行後 diff 取得 の 3 ポイント）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut09-direction-reconciliation/phase-02.md | 撤回 / 移植 / same-wave 差分マッピング |
| 必須 | docs/30-workflows/ut09-direction-reconciliation/phase-03.md | base case = 案 a / open question 6 件 |
| 必須 | docs/30-workflows/ut09-direction-reconciliation/phase-04.md | 4 種スキャン / 11 キーワードマトリクス |
| 必須 | docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md | current 方針正本 |
| 必須 | docs/30-workflows/02-application-implementation/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md | 移植先 #1 |
| 必須 | docs/30-workflows/02-application-implementation/03b-parallel-forms-response-sync-and-current-response-resolver/index.md | 移植先 #2 |
| 必須 | docs/30-workflows/02-application-implementation/04c-parallel-admin-backoffice-api-endpoints/index.md | 同期確認 #4 |
| 必須 | docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md | 移植先 #3 / 同期確認 #5 |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/index.md | 撤回対象 root（legacy umbrella 参照に戻す対象） |
| 必須 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | 採用 A 時 `/admin/sync*` 正本登録の確認 |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | `sync_jobs` 単一 ledger 正本の確認 |
| 必須 | .claude/skills/aiworkflow-requirements/references/environment-variables.md / .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | `GOOGLE_FORM_ID` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` 正本確認 |
| 必須 | CLAUDE.md | `pnpm indexes:rebuild` / `bash scripts/cf.sh` ルール |
| 参考 | docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/phase-05.md | 同種 Sheets 系 blocked タスクの先行 runbook |

## 実行手順

以下の runbook を採用方針別に実行する。採用 A は別タスク登録と撤回・移植手順の文書化まで、採用 B はユーザー承認記録がある場合のみ same-wave 更新手順へ進む。

## reconciliation 実行 runbook（採用 A: Forms 分割方針）

### Step 0: 事前 baseline 取得（Phase 4 スキャン再利用）

```bash
# 5 文書 + references 状態の baseline
mkdir -p docs/30-workflows/ut09-direction-reconciliation/outputs/phase-09/baseline
rg -n '/admin/sync' docs/30-workflows/ \
  .claude/skills/aiworkflow-requirements/references/api-endpoints.md \
  > docs/30-workflows/ut09-direction-reconciliation/outputs/phase-09/baseline/admin-sync.txt
rg -n 'sync_jobs|sync_locks|sync_job_logs' \
  .claude/skills/aiworkflow-requirements/references/database-schema.md \
  > docs/30-workflows/ut09-direction-reconciliation/outputs/phase-09/baseline/ledger.txt
rg -n 'GOOGLE_(SHEETS|FORMS)_SA_JSON' \
  .claude/skills/aiworkflow-requirements/references/environment-variables.md / .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md \
  > docs/30-workflows/ut09-direction-reconciliation/outputs/phase-09/baseline/secrets.txt
```

> 本 Phase の Step 0 は「baseline 取得コマンドの定義」までを役割とする。実行は Phase 9 で行う。

### Step 1: 採用 A 時の撤回手順 5 ステップ（**全ステップが別タスクで実施される前提**）

| # | ステップ | 担当タスク（別 register） | 本 Phase の役割 |
| --- | --- | --- | --- |
| A1 | `apps/api/src/jobs/sync-sheets-to-d1.ts` 系 + `apps/api/src/routes/admin/sync.ts`（単一 endpoint）の削除 PR | 別タスク: `task-ut09-sheets-implementation-withdrawal-001`（仮称） | 撤回対象ファイルパスを runbook に列挙 |
| A2 | `sync_locks` / `sync_job_logs` migration の down 適用 + 削除 | 別タスク: 同上 | down migration 順序を runbook に列挙 |
| A3 | `GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` の Cloudflare Secret / Variable 削除 | 別タスク: 同上（`bash scripts/cf.sh secret delete ...` 経由） | 削除コマンドを runbook に列挙 |
| A4 | `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/index.md` を legacy umbrella 参照に戻す | 別タスク: `task-ut09-root-restore-legacy-umbrella-ref-001`（仮称） | 復元する記述パターンを runbook で指定 |
| A5 | `wrangler.toml` の `[triggers]` を Forms 2 経路前提（schema + responses）に揃える | 別タスク: 09b implementation 連携 | 必要な記述を runbook で指定 |

#### 撤回手順 — 別タスク register コマンド例（Phase 12 unassigned-task-detection で実施）

```bash
# 別タスク仕様書の雛形配置先（Phase 12 で実施、本 Phase は配置先のみ予約）
docs/30-workflows/unassigned-task/task-ut09-sheets-implementation-withdrawal-001.md
docs/30-workflows/unassigned-task/task-ut09-root-restore-legacy-umbrella-ref-001.md
```

### Step 2: 採用 A 時の移植手順 4 ステップ

| # | ステップ | 移植先文書 | 移植内容（Phase 2 「移植対象」表より） |
| --- | --- | --- | --- |
| P1 | WAL 非前提 / short transaction 知見の AC 化 | `03a/index.md`, `03b/index.md` | D1 のロック特性に依存しない設計 / 1 transaction の処理量制限 |
| P2 | retry/backoff / batch-size 制限の AC 化 | `03a/index.md`, `03b/index.md`, `09b/index.md` | exponential backoff / 最大試行回数 / 1 sync あたり処理件数の上限 |
| P3 | 二重起動防止の runbook 化 | `09b/index.md` | scheduled / manual 同時起動時の lock or idempotency strategy |
| P4 | 移植記述の整合確認（Phase 4 移植対象スキャン再実行） | scan-checklist.md の「移植対象スキャン」5 行 | 5 知見すべてが移植先文書にヒットする状態 |

> 移植「実装」（コード変更）は別タスク。本 Phase の役割は「移植先文書 + 記述追加方針」を runbook 化することまで。

### Step 3: 採用 A 時の正本同期手順（5 文書）

| # | 文書 | 同期観点 | 同期確認コマンド |
| --- | --- | --- | --- |
| S1 | `task-sync-forms-d1-legacy-umbrella-001.md` | 「旧 UT-09 を direct implementation にしない」方針の存続 | `rg '旧 UT-09 を direct implementation' docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` |
| S2 | `03a/index.md` | Forms schema sync 責務境界 + 移植 P1/P2 反映 | `rg 'forms.get\|exponential backoff\|batch' docs/30-workflows/02-application-implementation/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md` |
| S3 | `03b/index.md` | Forms response sync + 移植 P1/P2 反映 | `rg 'forms.responses.list\|short transaction' docs/30-workflows/02-application-implementation/03b-parallel-forms-response-sync-and-current-response-resolver/index.md` |
| S4 | `04c/index.md` | `/admin/sync/schema` + `/admin/sync/responses` 2 endpoint 維持 | `rg '/admin/sync/(schema\|responses)' docs/30-workflows/02-application-implementation/04c-parallel-admin-backoffice-api-endpoints/index.md` |
| S5 | `09b/index.md` | scheduled handler が 2 経路呼び出し + 二重起動防止 P3 反映 | `rg 'scheduled\|二重起動' docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md` |

### Step 4: aiworkflow-requirements indexes 同期

```bash
# Phase 4 で定義したコマンドを runbook 上で実行
mise exec -- pnpm indexes:rebuild

# drift 確認（出力差分が無いこと）
git status .claude/skills/aiworkflow-requirements/indexes/

# CI gate 局所確認（PR 化は別タスクだが、後続別タスクが drift で fail しないことを確認）
# .github/workflows/verify-indexes.yml の job 名: verify-indexes-up-to-date
```

### Step 5: reconciliation 実行後 diff 取得（Phase 4 スキャン再実行）

```bash
mkdir -p docs/30-workflows/ut09-direction-reconciliation/outputs/phase-09/after
# Step 0 と同じコマンドを after/ に出力
# Phase 9 で baseline/ と after/ を diff し、撤回 / 移植 / 同期が完了していることを確認
diff -u outputs/phase-09/baseline/admin-sync.txt outputs/phase-09/after/admin-sync.txt
diff -u outputs/phase-09/baseline/ledger.txt     outputs/phase-09/after/ledger.txt
diff -u outputs/phase-09/baseline/secrets.txt    outputs/phase-09/after/secrets.txt
```

## reconciliation 実行 runbook（採用 B: Sheets 採用方針 / 要ユーザー承認）

> 採用 B は Phase 3 の評価で MAJOR 1（current facts）/ MINOR 4 が残るため、ユーザー承認なしには着手不可。本 runbook は **承認後の手順雛形** として記述する。承認なしで着手した場合は Phase 3 の NO-GO 条件に該当し、reconciliation を Phase 2 に差し戻す。

### Step B0: ユーザー承認取得

- 承認対象: 「current Forms 分割方針を更新し、Sheets 採用方針を正本化する」
- 承認文の保存先: `outputs/phase-05/user-approval-record.md`（採用 B 時のみ作成）

### Step B1〜B5: same-wave 更新手順

| # | ステップ | 対象 | 内容 |
| --- | --- | --- | --- |
| B1 | legacy umbrella spec 更新 | `task-sync-forms-d1-legacy-umbrella-001.md` | 「旧 UT-09 を direct implementation にしない」方針の更新 |
| B2 | 03a / 03b / 04c / 09b 責務境界の再設計 | 4 文書 | Sheets API + 単一 `/admin/sync` 前提に再設計 |
| B3 | references same-wave 更新 | `api-endpoints.md`, `database-schema.md`, `deployment-cloudflare.md`, `environment-variables.md / deployment-cloudflare.md` | Sheets 採用に合わせて更新 |
| B4 | aiworkflow-requirements indexes / topic-map / LOGS rebuild | `mise exec -- pnpm indexes:rebuild` | drift ゼロ確認 |
| B5 | UT-26 staging-deploy-smoke シナリオ切替 | UT-26 仕様書 | smoke シナリオを Sheets 経路に切替 |

> 採用 B 時は同期確認スキャン（Step 3 相当）の期待結果を反転する。Phase 4 scan-checklist.md の「期待結果（採用 B 時）」列を再利用。

## ロールバック手順（共通）

| 状況 | ロールバック先 | コマンド / 手順 |
| --- | --- | --- |
| 採用 A の Step 1（撤回別タスク化）後に方針再選定が必要 | 別タスク仕様書を `blocked` 化し、本 reconciliation を Phase 2 に差し戻す | `outputs/phase-12/unassigned-task-detection.md` から該当別タスクを取り下げ |
| 採用 A の Step 2 移植記述追加後に取り消したい | 該当 PR を revert（移植記述追加 PR） | git revert（撤回 PR と分離されているため独立 revert 可能） |
| 採用 B 着手後に承認撤回 | 採用 A へフォールバック（Phase 2 Mermaid の B 未承認経路） | Step B1〜B5 の差分を revert し、本 runbook の採用 A 手順に切替 |
| reconciliation 全体の停止 | Phase 3 NO-GO 条件発動 | artifacts.json の `phases[2].status` を `blocked` に戻し、Phase 2 へ差し戻す |

## 別タスク register 一覧（open question からの転送）

| open# (Phase 3) | 質問 | 別タスク仮称 | 配置先 | Phase 12 で起票 |
| --- | --- | --- | --- | --- |
| 1 | Sheets 実装撤回の具体手順 | `task-ut09-sheets-implementation-withdrawal-001` | `docs/30-workflows/unassigned-task/` | YES |
| 2 | D1 contention mitigation 知見の 03a/03b/09b 移植 PR | `task-ut09-d1-contention-knowledge-port-001` | 同上 | YES |
| 3 | Sheets 採用（案 b）の将来採用判断時期 | unassigned-task-detection 内で記録のみ | Phase 12 detection.md | YES（detection 記録のみ） |
| 4 | 旧 UT-09 root の legacy umbrella 参照復元 PR | `task-ut09-root-restore-legacy-umbrella-ref-001` | `docs/30-workflows/unassigned-task/` | YES |
| 5 | aiworkflow-requirements references 更新確認 | Phase 9 で実施（別タスク不要） | 本タスク Phase 9 | NO |
| 6 | unrelated verification-report 削除の別タスク化 | `task-cleanup-verification-reports-001` | `docs/30-workflows/unassigned-task/` | YES |

## sanity check（実行前 / 実行後）

```bash
# 実行前 baseline（Step 0）
bash -c 'rg -n "/admin/sync" docs/ .claude/skills/ | wc -l'
bash -c 'rg -n "sync_locks" .claude/skills/aiworkflow-requirements/references/database-schema.md | wc -l'

# reconciliation 実行（採用 A）後
# 上記コマンドを再実行し、ヒット数の変化を観測
# - `/admin/sync/schema|responses` のヒットは横ばい or 増加（移植記述追加分）
# - `sync_locks` の正本ヒットは 0 件、ヒットが残る場合は「廃止候補」コンテキストのみ
```

## 禁止事項チェックリスト（docs-only タスク特有）

- [ ] 本 Phase でコード変更（`apps/api/src/**`, `apps/web/src/**`）を行っていない
- [ ] 本 Phase で migration の up/down を実行していない
- [ ] 本 Phase で `bash scripts/cf.sh secret put|delete` を実行していない（コマンド定義のみ）
- [ ] 本 Phase で PR 作成 / commit / push を行っていない
- [ ] `wrangler` を直接呼んでいない（runbook 上のコマンドはすべて `bash scripts/cf.sh` 経由）
- [ ] 1Password 参照は `op://Employee/ubm-hyogo-env/<FIELD>` 形式のみ
- [ ] unrelated verification-report 削除を本 reconciliation runbook に混ぜていない
- [ ] 採用 B 着手にユーザー承認の前提が runbook に明記されている
- [ ] 移植先 4 文書（03a / 03b / 09b ×2）すべてに移植内容が割当
- [ ] 5 文書同期確認コマンドが 5 件すべて記述

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | スキャンコマンドを Step 0 / Step 5 に組み込み |
| Phase 6 | 撤回漏れ / 移植漏れ / unrelated 混入 / ledger 二重化 / secret 名不一致 を failure case 入力に |
| Phase 7 | 別タスク register 表を AC マトリクスの「担当 outputs」列に流し込み |
| Phase 9 | Step 0 baseline / Step 5 after の diff 結果を保存 |
| Phase 11 | 採用 A の Step 1〜Step 5 を手動 smoke で 1 回通す（docs-only のため diff 取得のみ） |
| Phase 12 | open question 6 件のうち 4 件を別タスクとして起票 |

## 多角的チェック観点

- 価値性: runbook 通りに進めれば 5 文書 + references が採用 A 方向に揃うか。
- 実現性: docs-only 範囲で Step 1〜Step 5 が完結するか。コード撤回が「別タスク化」で逃せているか。
- 整合性（不変条件 #1）: 移植 P1〜P3 が schema を mapper.ts に閉じる方針を破壊していないか。
- 整合性（不変条件 #4）: 移植先文書の admin-managed data 専用テーブル分離記述を破壊していないか。
- 整合性（不変条件 #5）: D1 access が `apps/api` 内のみの記述を破壊していないか。
- 整合性（不変条件 #6）: 採用 A で旧 UT-09 を direct implementation 化しない方針を維持しているか。
- 運用性: ロールバック手順が採用 A / B 切替に対応しているか。
- 認可境界: 採用 A の S4（04c）で 2 endpoint 維持を確認するスキャンコマンドがあるか。
- D1 ledger 一意性: S2 baseline / S5 after で `sync_locks` 正本登録が消えていることを確認するか。
- Secret hygiene: S0 / S5 で `GOOGLE_SHEETS_SA_JSON` 正本登録が消えていることを確認するか。
- 採用 B 承認: Step B0 でユーザー承認取得が必須前提として記述されているか。
- 別タスク register: open question 6 件のうち 4 件が Phase 12 起票対象として明示されているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 採用 A 撤回手順 5 ステップ | 5 | spec_created | 全ステップ別タスク化 |
| 2 | 採用 A 移植手順 4 ステップ | 5 | spec_created | 03a / 03b / 09b 4 文書 |
| 3 | 採用 A 正本同期手順 5 文書 | 5 | spec_created | 5 文書すべて |
| 4 | 採用 B 同種更新手順 5 ステップ | 5 | spec_created | 要ユーザー承認 |
| 5 | ロールバック手順 4 ケース | 5 | spec_created | A / B 共通 |
| 6 | 別タスク register 6 件 | 5 | spec_created | Phase 12 起票 4 件 |
| 7 | sanity check 実行前 / 後 | 5 | spec_created | Phase 9 で実行 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/reconciliation-runbook.md | 採用 A / B / ロールバック / 別タスク register / sanity check |
| メタ | artifacts.json | Phase 5 状態の更新 |

## 完了条件

- [ ] 採用 A の撤回手順が 5 ステップで記述、各ステップが「別タスク化」明記
- [ ] 採用 A の移植手順が 4 ステップで記述、移植先 4 文書すべてに記述追加方針あり
- [ ] 採用 A の正本同期手順が 5 文書 × 同期観点 + コマンドで記述
- [ ] aiworkflow-requirements indexes 同期手順（`pnpm indexes:rebuild` + drift 確認）が含まれる
- [ ] 採用 B の手順が 5 ステップで記述、ユーザー承認が前提として明記
- [ ] ロールバック手順が 4 ケース以上記述
- [ ] 別タスク register 一覧が 6 件記述、うち 4 件が Phase 12 起票対象として明示
- [ ] sanity check が実行前 / 実行後の 2 ポイントで記述
- [ ] 禁止事項チェックリスト 10 項目が記述
- [ ] 成果物が `outputs/phase-05/reconciliation-runbook.md` に集約

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 成果物が `outputs/phase-05/reconciliation-runbook.md` に配置済み
- 採用 A / B / ロールバック / 別タスク register / sanity check の 5 セクションすべてが揃っている
- artifacts.json の `phases[4].status` が `spec_created`
- artifacts.json の `phases[4].outputs` に `reconciliation-runbook.md` が列挙されている

## 次 Phase への引き渡し

- 次 Phase: 6 (異常系検証)
- 引き継ぎ事項:
  - 撤回手順 5 ステップ / 移植手順 4 ステップ / 同期手順 5 文書を failure case の入力に
  - ロールバック手順 4 ケースを Phase 6 の復旧手順雛形に
  - 別タスク register 6 件のうち 4 件を Phase 12 unassigned-task-detection.md に登録予約
  - sanity check（Step 0 / Step 5）を Phase 9 で実施
  - 採用 B はユーザー承認後のみ実行可能。承認なしの着手は Phase 3 NO-GO 条件
- ブロック条件:
  - 採用 A 撤回ステップが 5 件未満
  - 移植先文書が 4 件未満
  - 5 文書同期確認コマンドが 5 件未満
  - 別タスク register が 6 件未満
  - 禁止事項チェックリストにコード変更 / migration 実行が紛れ込む
